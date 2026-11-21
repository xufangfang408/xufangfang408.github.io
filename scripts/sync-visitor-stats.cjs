const { writeFile } = require('node:fs/promises');
const { setTimeout: delay } = require('node:timers/promises');
const { regions: regionCenters } = require('./visitor-region-centers.json');

const days = 30;
const pageSize = 100;

function aggregate(rows, getLabel) {
  const counts = new Map();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.count) || row.count < 0) throw new Error('Invalid GoatCounter visit count');
    const label = getLabel(row);
    if (label && row.count) counts.set(label, (counts.get(label) || 0) + row.count);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function countryCode({ id }) {
  const code = String(id || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(code) && code !== 'ZZ' && code !== 'XX') return code;
}

function regionKey(name) {
  return name.normalize('NFD').toLowerCase().replace(/[\p{M}'’]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function regionCoordinates(country) {
  const primary = new Map();
  const alternate = new Map();

  function add(centers, name, point) {
    const key = regionKey(name);
    // If two subdivisions share a name, leave it unmapped.
    if (!centers.has(key)) centers.set(key, point);
    else if (centers.get(key) !== point) centers.set(key, null);
  }

  for (const [longitude, latitude, [name, ...aliases]] of regionCenters[country] || []) {
    const point = [longitude, latitude];
    add(primary, name, point);
    for (const alias of aliases) add(alternate, alias, point);
  }
  return new Map([...alternate, ...primary]);
}

function sourceLabel({ name, ref_scheme: scheme }) {
  if (!name || /^(?:\((?:unknown|direct|no referrer)\)|direct|unknown)$/i.test(name)) return 'Direct or unknown';
  if (scheme === 'c') return 'Campaign links';
  if (scheme === 'g' && /^[A-Za-z][A-Za-z0-9 .&+_-]{0,39}$/.test(name)) return name;
  if (scheme === 'h') {
    const url = URL.parse(name.includes('://') ? name : `https://${name}`);
    const host = url?.hostname.replace(/^www\./, '');
    if (host?.includes('.') && /[a-z]/i.test(host) && !url.username && !url.password) return host;
  }
  return 'Other sources';
}

async function snapshot(origin, token, now = new Date(), fetchStats = fetch) {
  const end = new Date(Math.floor(now.valueOf() / 3_600_000) * 3_600_000);
  const start = new Date(end.valueOf() - days * 86_400_000);
  const period = { start: start.toISOString(), end: end.toISOString() };
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  let nextRequest = 0;

  async function get(kind, query = {}) {
    const url = new URL(`/api/v0/stats/${kind}`, origin);
    url.search = new URLSearchParams({ ...period, ...query });
    const maxAttempts = 5;
    const retryableStatuses = new Set([404, 408, 425, 429, 500, 502, 503, 504]);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (nextRequest > Date.now()) await delay(nextRequest - Date.now());
      nextRequest = Date.now() + 300;

      let response;
      try {
        response = await fetchStats(url, {
          headers,
          redirect: 'error',
          signal: AbortSignal.timeout(30_000)
        });
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(
            `GoatCounter ${kind} request failed after ${attempt} attempts: ${error.message}`,
            { cause: error }
          );
        }
        const waitMs = Math.min(1_000 * 2 ** (attempt - 1), 15_000);
        console.warn(
          `GoatCounter ${kind} request failed (${error.message}); retrying in ${waitMs / 1_000}s (${attempt}/${maxAttempts - 1})`
        );
        await delay(waitMs);
        continue;
      }

      if (response.ok) return response.json();

      if (!retryableStatuses.has(response.status) || attempt === maxAttempts) {
        throw new Error(
          `GoatCounter ${kind} returned HTTP ${response.status}${attempt > 1 ? ` after ${attempt} attempts` : ''}`
        );
      }

      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterSeconds = Number(retryAfterHeader);
      const retryAfterDate = Date.parse(retryAfterHeader || '');
      const retryAfterMs = retryAfterHeader && retryAfterHeader.trim() !== ''
        ? (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
          ? retryAfterSeconds * 1_000
          : Number.isFinite(retryAfterDate)
            ? Math.max(0, retryAfterDate - Date.now())
            : null)
        : null;
      const waitMs = Math.min(retryAfterMs ?? 1_000 * 2 ** (attempt - 1), 30_000);

      console.warn(
        `GoatCounter ${kind} returned HTTP ${response.status}; retrying in ${(waitMs / 1_000).toFixed(1)}s (${attempt}/${maxAttempts - 1})`
      );
      await delay(waitMs);
    }

    throw new Error(`GoatCounter ${kind} failed after ${maxAttempts} attempts`);
  }

  async function rowsFor(kind) {
    const rows = [];
    while (rows.length < 5000) {
      const { stats, more } = await get(kind, { limit: pageSize, offset: rows.length });
      if (stats !== null && !Array.isArray(stats)) throw new Error(`Invalid GoatCounter ${kind} response`);
      rows.push(...(stats || []));
      if (!more) return rows;
      if (!stats?.length) throw new Error(`Empty GoatCounter ${kind} page`);
    }
    throw new Error(`Too many GoatCounter ${kind} rows to publish a complete snapshot`);
  }

  const { total_utc: total } = await get('total');
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid GoatCounter visit total');
  const countries = aggregate(await rowsFor('locations'), countryCode);
  const regions = [];
  for (const [country] of countries) {
    const centers = regionCoordinates(country);
    const rows = await rowsFor(`locations/${country}`);
    for (const [name, count] of aggregate(rows, ({ name }) => {
      const label = name?.trim();
      if (label && !/^\(?unknown\)?$/i.test(label)) return label;
    })) {
      const coordinates = centers.get(regionKey(name));
      regions.push({ country, name, count, ...(coordinates && { coordinates }) });
    }
  }
  regions.sort((a, b) => b.count - a.count || a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  return {
    days,
    updatedAt: end.toISOString(),
    total,
    countries,
    regions,
    sources: aggregate(await rowsFor('toprefs'), sourceLabel).slice(0, 7)
  };
}

async function main() {
  const token = process.env.GOATCOUNTER_API_TOKEN;
  if (!token) {
    console.log('No GOATCOUNTER_API_TOKEN configured. Skipping visitor statistics update.');
    return;
  }
  const origin = process.env.GOATCOUNTER_ORIGIN;
  if (!/^https:\/\/[a-z0-9-]+\.goatcounter\.com$/.test(origin || '')) throw new Error('Invalid GoatCounter origin');
  const data = await snapshot(origin, token);
  await writeFile(process.argv[2] || 'visitor-stats.json', JSON.stringify(data, null, 2) + '\n');
}

if (require.main === module) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { snapshot };
