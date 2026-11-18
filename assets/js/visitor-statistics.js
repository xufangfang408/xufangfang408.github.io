(function () {
  'use strict';

  const section = document.getElementById('visitors');
  if (!section) return;

  const number = new Intl.NumberFormat('en');
  const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });
  const regions = new Intl.DisplayNames('en', { type: 'region' });

  function row(label, count, max) {
    const item = document.createElement('li');
    const values = document.createElement('div');
    values.className = 'visitor-stat-row';
    for (const value of [label, number.format(count)]) {
      const span = document.createElement('span');
      span.textContent = value;
      values.append(span);
    }
    item.append(values);
    if (max) {
      const bar = document.createElement('div');
      bar.className = 'visitor-bar';
      bar.style.width = `${(count / max) * 100}%`;
      bar.setAttribute('aria-hidden', 'true');
      item.append(bar);
    }
    return item;
  }

  function renderStats(data) {
    const period = section.querySelector('[data-visitor-period]');
    const total = document.createElement('strong');
    total.textContent = `${number.format(data.total)} ${data.total === 1 ? 'visit' : 'visits'}`;
    const updated = document.createElement('time');
    updated.dateTime = data.updatedAt;
    updated.textContent = date.format(new Date(data.updatedAt));
    period.replaceChildren(total, ` in the last ${data.days} days · Updated `, updated);

    const countries = section.querySelector('[data-visitor-countries]');
    countries.replaceChildren(...data.countries.map(([code, count]) => row(regions.of(code), count)));
    countries.parentElement.hidden = !data.countries.length;

    const sources = section.querySelector('[data-visitor-sources]');
    const sourceStatus = section.querySelector('[data-visitor-source-status]');
    const max = Math.max(0, ...data.sources.map(([, count]) => count));
    sources.replaceChildren(...data.sources.map(([name, count]) => row(name, count, max)));
    sources.hidden = !data.sources.length;
    sourceStatus.hidden = data.sources.length > 0;
    sourceStatus.textContent = 'No traffic sources recorded in this period.';
  }

  function drawMap(map, data) {
    const canvas = section.querySelector('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    const places = new Map(data?.countries);
    const max = Math.max(0, ...places.values());
    const label = section.querySelector('[data-visitor-place]');
    const labelDefault = max ? 'Hover or tap a region' : 'Visits by country or region';
    label.textContent = labelDefault;
    section.querySelector('.visitor-legend').hidden = max === 0;

    canvas.width = map.width;
    canvas.height = map.height;
    const polygons = map.countries.map(([code, rings]) => {
      const path = new Path2D();
      for (const points of rings) {
        path.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) path.lineTo(points[i], points[i + 1]);
        path.closePath();
      }
      const count = places.get(code) || 0;
      const level = count ? Math.ceil(4 * Math.sqrt(count / max)) : 0;
      return { code, path, count, level };
    });

    function paint() {
      const styles = getComputedStyle(section);
      const colors = ['land', 'low', 'mid', 'high', 'peak'].map(key => styles.getPropertyValue(`--map-${key}`).trim());
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = styles.getPropertyValue('--soft').trim();
      context.lineWidth = 0.7;
      for (const { path, level } of polygons) {
        context.fillStyle = colors[level];
        context.fill(path, 'evenodd');
        context.stroke(path);
      }
    }

    paint();
    new MutationObserver(paint).observe(document.documentElement, { attributeFilter: ['data-theme'] });
    if (!max) return;

    function showPlace(event) {
      const bounds = canvas.getBoundingClientRect();
      const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
      const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
      const place = polygons.find(({ code, path }) => code && context.isPointInPath(path, x, y, 'evenodd'));
      label.textContent = place ? `${regions.of(place.code)} · ${number.format(place.count)} ${place.count === 1 ? 'visit' : 'visits'}` : labelDefault;
    }
    canvas.addEventListener('pointermove', showPlace);
    canvas.addEventListener('click', showPlace);
    canvas.addEventListener('pointerleave', () => { label.textContent = labelDefault; });
  }

  async function json(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  }

  async function load() {
    const [map, stats] = await Promise.allSettled([json(section.dataset.visitorMap), json(section.dataset.visitorStats)]);
    const period = section.querySelector('[data-visitor-period]');
    let data;
    if (stats.status === 'fulfilled') {
      data = stats.value;
      renderStats(data);
    } else {
      period.textContent = stats.reason.message === '404'
        ? 'Visit totals will appear after the first update.'
        : 'Visitor statistics are temporarily unavailable.';
      section.querySelector('[data-visitor-source-status]').textContent = 'No source totals to display.';
    }
    if (map.status === 'fulfilled') drawMap(map.value, data);
    else section.querySelector('[data-visitor-place]').textContent = 'The map is temporarily unavailable.';
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    load().catch(() => {
      section.querySelector('[data-visitor-period]').textContent = 'Visitor statistics are temporarily unavailable.';
    });
  }, { rootMargin: '250px' });
  observer.observe(section);
})();
