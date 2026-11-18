const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Run after Jekyll builds, so missing or mismatched published assets fail CI.
const output = path.resolve(process.argv[2] || '_site');
const baseurl = (process.argv[3] || '').replace(/\/$/, '');
const talksPage = 'talks/index.html';
const talksUrl = baseurl + '/talks/';
const pages = ['index.html', 'publications/index.html', talksPage, 'cv/index.html', 'sitemap/index.html', '404.html'];
const expectedStylesheet = '/assets/css/academic-v2.css';
const analyticsScript = baseurl + '/assets/js/goatcounter-count.js';
let stylesheetUrl;
let analyticsEndpoint;
let recentTalkId;

function attribute(tag, name) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2].replace(/&amp;/g, '&') : null;
}

function hasClass(tag, name) {
  return (attribute(tag, 'class') || '').split(/\s+/).includes(name);
}

function verifyAnalytics(html, name) {
  assert(!/flagcounter\.com|visitor-map\.js/i.test(html), `Retired visitor counter in ${name}`);
  const scripts = (html.match(/<script\b[^>]*>/gi) || [])
    .filter(tag => attribute(tag, 'data-goatcounter') || attribute(tag, 'src') === analyticsScript);
  assert(scripts.length <= 1, `Duplicate GoatCounter script in ${name}`);
  const endpoint = scripts.length ? attribute(scripts[0], 'data-goatcounter') : null;

  if (scripts.length) {
    assert.equal(attribute(scripts[0], 'src'), analyticsScript, `Wrong GoatCounter script in ${name}`);
    assert(/\sasync[\s>]/.test(scripts[0]), `GoatCounter must load asynchronously in ${name}`);
    assert(/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint || ''), `Invalid GoatCounter endpoint in ${name}`);
  }
  if (name === 'index.html') analyticsEndpoint = endpoint;
  assert.equal(endpoint, analyticsEndpoint, `Inconsistent GoatCounter setup in ${name}`);

  const dashboard = (html.match(/<a\b[^>]*>/gi) || []).find(tag => hasClass(tag, 'visitor-statistics'));
  if (dashboard) {
    assert(endpoint, `Dashboard link without GoatCounter script in ${name}`);
    assert.equal(attribute(dashboard, 'href'), new URL(endpoint).origin, `Wrong GoatCounter dashboard link in ${name}`);
  }
}

function localFile(url) {
  const pathname = new URL(url, 'https://example.test').pathname;
  assert(pathname.startsWith(baseurl + '/'), `Asset is outside the configured base URL: ${url}`);
  const file = path.resolve(output, '.' + pathname.slice(baseurl.length));
  assert(file.startsWith(output + path.sep), `Asset is outside the build: ${url}`);
  assert(fs.existsSync(file), `Missing published asset: ${url}`);
  return file;
}

for (const name of pages) {
  const html = fs.readFileSync(path.join(output, name), 'utf8');
  assert(!/\{%|\{\{/.test(html), `Unrendered Liquid in ${name}`);
  assert(hasClass(html.match(/<body\b[^>]*>/i)?.[0] || '', 'academic-v2'), `Wrong layout in ${name}`);
  assert.equal((html.match(/<aside\b[^>]+class="site-profile"/g) || []).length, 1, `Expected one academic profile in ${name}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `Expected one main heading in ${name}`);

  const nav = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i)?.[0] || '';
  const talksLink = (nav.match(/<a\b[^>]*>/gi) || []).find(tag => attribute(tag, 'href') === talksUrl);
  assert(talksLink, `Missing Talks navigation link in ${name}`);
  assert.equal(attribute(talksLink, 'aria-current'), name === talksPage ? 'page' : null,
    `Wrong active state for Talks navigation link in ${name}`);

  if (name === 'index.html') {
    const hrefs = (html.match(/<a\b[^>]*>/gi) || []).map(tag => attribute(tag, 'href'));
    const recentTalkLink = hrefs.find(href => href?.startsWith(talksUrl + '#'));
    assert(recentTalkLink, 'Missing recent talk link on the homepage');
    recentTalkId = new URL(recentTalkLink, 'https://example.test').hash.slice(1);
  }
  if (name === talksPage) {
    const talks = (html.match(/<article\b[^>]*>/gi) || []).filter(tag => hasClass(tag, 'talk'));
    assert(talks.some(tag => attribute(tag, 'id') === recentTalkId), 'The recent talk link must point to a published talk');
  }

  const visitorSection = (html.match(/<section\b[^>]*>/gi) || []).find(tag => hasClass(tag, 'visitor-section'));
  const visitorScripts = (html.match(/<script\b[^>]*>/gi) || [])
    .filter(tag => attribute(tag, 'src')?.startsWith(baseurl + '/assets/js/visitor-statistics.js?'));
  if (name === 'index.html') {
    assert(visitorSection, 'Missing homepage visitor statistics');
    assert.equal(visitorScripts.length, 1, 'Expected one homepage visitor statistics script');
    const stats = new URL(attribute(visitorSection, 'data-visitor-stats'));
    assert.equal(stats.origin, 'https://raw.githubusercontent.com', 'The visitor snapshot must use the public GitHub asset');
    assert(/\/visitor-stats\/visitor-stats\.json$/.test(stats.pathname), 'Wrong visitor snapshot path');
    localFile(attribute(visitorSection, 'data-visitor-map'));
  } else {
    assert(!visitorSection && !visitorScripts.length, `Visitor statistics must stay on the homepage: ${name}`);
  }

  const styles = (html.match(/<link\b[^>]*>/g) || []).filter(tag => /rel="stylesheet"/.test(tag));
  assert.equal(styles.length, 1, `Expected only the current layout stylesheet in ${name}`);
  const href = styles[0].match(/href="([^"]+)"/)[1];
  const url = new URL(href, 'https://example.test');
  assert.equal(url.pathname, baseurl + expectedStylesheet, `Legacy stylesheet URL in ${name}`);
  assert(/^\d{14}$/.test(url.searchParams.get('v') || ''), `Missing stylesheet build version in ${name}`);
  if (stylesheetUrl) assert.equal(href, stylesheetUrl, `Mixed layout versions in ${name}`);
  stylesheetUrl = href;
  localFile(href);

  for (const tag of html.match(/<(?:img|link|script)\b[^>]*>/g) || []) {
    const asset = attribute(tag, 'src') || attribute(tag, 'href');
    if (asset && asset.startsWith('/')) localFile(asset);
  }
  verifyAnalytics(html, name);
}

const stylesheet = localFile(stylesheetUrl);
const css = fs.readFileSync(stylesheet, 'utf8');
assert(css.includes('Academic layout v2'), 'The stylesheet contains a different layout');
for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (/^(?:data:|https?:)/.test(match[1])) continue;
  const asset = path.resolve(path.dirname(stylesheet), match[1]);
  assert(fs.existsSync(asset), `Missing stylesheet asset: ${match[1]}`);
}

assert(fs.readFileSync(localFile(baseurl + '/files/Fangfang-Xu-CV.pdf')).subarray(0, 5).toString() === '%PDF-', 'The published CV must be a PDF');
console.log(`Verified ${pages.length} generated pages, Talks navigation, versioned layout, portrait, CV, and ${analyticsEndpoint ? 'GoatCounter tracking' : 'disabled analytics'}.`);
