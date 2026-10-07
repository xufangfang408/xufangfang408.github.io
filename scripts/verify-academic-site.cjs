const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Run after Jekyll builds, so missing or mismatched published assets fail CI.
const output = path.resolve(process.argv[2] || '_site');
const baseurl = (process.argv[3] || '').replace(/\/$/, '');
const pages = ['index.html', 'publications/index.html', 'cv/index.html', 'sitemap/index.html', '404.html'];
const expectedStylesheet = '/assets/css/academic-v2.css';
let stylesheetUrl;

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
  assert(/<body[^>]+class="academic-v2\s/.test(html), `Wrong layout in ${name}`);
  assert(!/<aside\b[^>]+class="profile"/.test(html), `Legacy sidebar in ${name}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `Expected one main heading in ${name}`);

  const styles = (html.match(/<link\b[^>]*>/g) || []).filter(tag => /rel="stylesheet"/.test(tag));
  assert.equal(styles.length, 1, `Expected only the current layout stylesheet in ${name}`);
  const href = styles[0].match(/href="([^"]+)"/)[1];
  const url = new URL(href, 'https://example.test');
  assert.equal(url.pathname, baseurl + expectedStylesheet, `Legacy stylesheet URL in ${name}`);
  assert(/^\d{14}$/.test(url.searchParams.get('v') || ''), `Missing stylesheet build version in ${name}`);
  if (stylesheetUrl) assert.equal(href, stylesheetUrl, `Mixed layout versions in ${name}`);
  stylesheetUrl = href;
  localFile(href);

  for (const tag of html.match(/<(?:img|link)\b[^>]*>/g) || []) {
    const asset = tag.match(/(?:src|href)="([^"]+)"/);
    if (asset && asset[1].startsWith('/')) localFile(asset[1]);
  }
}

const stylesheet = localFile(stylesheetUrl);
const css = fs.readFileSync(stylesheet, 'utf8');
assert(css.includes('Academic layout v2'), 'The stylesheet contains a different layout');
assert(/\.site-shell\s*\{[^}]*display:\s*block/.test(css), 'The main shell must use the full page width');
assert(/\.main-content\s*\{[^}]*width:\s*100%/.test(css), 'Main content must not fall into the old sidebar column');
for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  if (/^(?:data:|https?:)/.test(match[1])) continue;
  const font = path.resolve(path.dirname(stylesheet), match[1]);
  assert(fs.existsSync(font), `Missing local font: ${match[1]}`);
}

assert(fs.readFileSync(localFile(baseurl + '/files/Fangfang-Xu-CV.pdf')).subarray(0, 5).toString() === '%PDF-', 'The published CV must be a PDF');
console.log(`Verified ${pages.length} generated pages, versioned layout CSS, local fonts, portrait, and CV.`);
