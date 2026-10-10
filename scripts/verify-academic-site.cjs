const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Run after Jekyll builds, so missing or mismatched published assets fail CI.
const output = path.resolve(process.argv[2] || '_site');
const baseurl = (process.argv[3] || '').replace(/\/$/, '');
const pages = ['index.html', 'publications/index.html', 'cv/index.html', 'sitemap/index.html', '404.html'];
const expectedStylesheet = '/assets/css/academic-v2.css';
const expectedMapScript = '/assets/js/visitor-map.js';
let stylesheetUrl;
let hasVisitorMap = false;

function attribute(tag, name) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2].replace(/&amp;/g, '&') : null;
}

function hasClass(tag, name) {
  return (attribute(tag, 'class') || '').split(/\s+/).includes(name);
}

function httpsUrl(value, description) {
  assert(value && /^https:\/\//i.test(value), `${description} must use an absolute HTTPS URL`);
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', `${description} must use HTTPS`);
  return url;
}

function verifyVisitorMap(html, name) {
  const sections = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/gi)]
    .map(match => match[0])
    .filter(section => hasClass(section.match(/^<section\b[^>]*>/i)[0], 'visitor-section'));
  const figures = (html.match(/<figure\b[^>]*>/gi) || [])
    .filter(tag => /\bdata-visitor-map(?:\s|=|>)/i.test(tag));
  const images = (html.match(/<img\b[^>]*>/gi) || [])
    .filter(tag => hasClass(tag, 'visitor-map-image'));
  const scripts = (html.match(/<script\b[^>]*>/gi) || [])
    .filter(tag => {
      const src = attribute(tag, 'src');
      return src && new URL(src, 'https://example.test').pathname.endsWith(expectedMapScript);
    });

  if (name !== 'index.html') {
    assert.equal(sections.length + figures.length + images.length + scripts.length, 0,
      `The visitor map must appear only on the homepage: ${name}`);
    return;
  }

  // Use the rendered setting so --config overrides and disabled builds are verified correctly.
  const settingTags = (html.match(/<meta\b[^>]*>/gi) || []).filter(tag => attribute(tag, 'name') === 'visitor-map-enabled');
  assert.equal(settingTags.length, 1, 'Expected one rendered visitor-map enabled setting on the homepage');
  const setting = attribute(settingTags[0], 'content');
  assert(['true', 'false'].includes(setting), 'Invalid rendered visitor-map enabled setting');
  hasVisitorMap = setting === 'true';
  const expectedCount = hasVisitorMap ? 1 : 0;
  assert.equal(sections.length, expectedCount, 'Expected one visitor section when enabled, and none when disabled');
  assert.equal(figures.length, expectedCount, 'Expected one visitor figure when enabled, and none when disabled');
  assert.equal(images.length, expectedCount, 'Expected one visitor image when enabled, and none when disabled');
  assert.equal(scripts.length, expectedCount, 'Expected one visitor-map script when enabled, and none when disabled');
  if (!hasVisitorMap) return;

  const section = sections[0];
  assert(section.includes(figures[0]) && section.includes(images[0]), 'The map figure and image must stay inside the visitor section');
  httpsUrl(attribute(images[0], 'src'), 'Visitor map image');
  for (const dimension of ['width', 'height']) {
    const value = attribute(images[0], dimension);
    assert(value && /^\d+$/.test(value) && Number(value) > 0, `Visitor map must reserve a positive ${dimension}`);
  }
  const links = (section.match(/<a\b[^>]*>/gi) || []).map(tag => attribute(tag, 'href'));
  assert(links.length > 0, 'The visitor map must link to its statistics');
  for (const href of links) httpsUrl(href, 'Visitor statistics link');

  const src = attribute(scripts[0], 'src');
  assert(src.startsWith(baseurl + '/') && !src.startsWith('//'), 'The visitor-map script must use a local asset URL');
  const scriptUrl = new URL(src, 'https://example.test');
  assert.equal(scriptUrl.pathname, baseurl + expectedMapScript, 'Wrong visitor-map script URL');
  assert(/^\d{14}$/.test(scriptUrl.searchParams.get('v') || ''), 'Missing visitor-map script build version');
  assert.equal(scriptUrl.searchParams.get('v'), new URL(stylesheetUrl, 'https://example.test').searchParams.get('v'),
    'The visitor-map script and stylesheet must use the same build version');
  localFile(src);
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

  for (const tag of html.match(/<(?:img|link|script)\b[^>]*>/g) || []) {
    const asset = attribute(tag, 'src') || attribute(tag, 'href');
    if (asset && asset.startsWith('/')) localFile(asset);
  }
  verifyVisitorMap(html, name);
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
console.log(`Verified ${pages.length} generated pages, versioned layout assets, local fonts, portrait, CV, and ${hasVisitorMap ? 'homepage visitor map' : 'disabled visitor map'}.`);
