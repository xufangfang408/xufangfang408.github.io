(function () {
  'use strict';

  const section = document.getElementById('visitors');
  if (!section) return;

  const number = new Intl.NumberFormat('en');
  const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });
  const countries = new Intl.DisplayNames('en', { type: 'region' });

  function regionLabel({ country, name }) {
    return `${name}, ${countries.of(country)}`;
  }

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

    const regions = data.regions || [];
    const regionList = section.querySelector('[data-visitor-regions]');
    regionList.replaceChildren(...regions.map(region => row(regionLabel(region), region.count)));
    regionList.parentElement.hidden = !regions.length;

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
    const frame = canvas.parentElement;
    const controls = frame.querySelector('.visitor-map-controls');
    const zoomIn = controls.querySelector('[data-visitor-zoom="in"]');
    const zoomOut = controls.querySelector('[data-visitor-zoom="out"]');
    let zoom = 1;
    let left = 0;
    let top = 0;
    let drag;
    let dragged = false;
    const regions = data?.regions || [];
    const markers = regions.filter(region => region.coordinates).map(region => {
      const [longitude, latitude] = region.coordinates;
      return {
        ...region,
        x: (longitude + 180) / 360 * map.width,
        y: (84 - latitude) / 150 * map.height
      };
    }).sort((a, b) => b.count - a.count);
    const max = markers[0]?.count || 0;
    const label = section.querySelector('[data-visitor-place]');
    let labelDefault = 'Visits by region';
    if (markers.length) labelDefault = 'Hover or tap a dot for details.';
    else if (regions.length) labelDefault = 'Map coordinates are unavailable for these regions.';
    else if (data?.regions) labelDefault = 'No regional visits recorded in this period.';
    else if (data) labelDefault = 'Regional data will appear after the next update.';
    label.textContent = labelDefault;
    section.querySelector('.visitor-legend').hidden = !markers.length;

    canvas.width = map.width;
    canvas.height = map.height;
    const polygons = map.countries.map(([, rings]) => {
      const path = new Path2D();
      for (const points of rings) {
        path.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) path.lineTo(points[i], points[i + 1]);
        path.closePath();
      }
      return path;
    });

    function mapUnitsPerPixel() {
      return map.width / (canvas.clientWidth || map.width);
    }

    function radius(count, unitsPerPixel) {
      return (2.5 + Math.min(13, canvas.clientWidth / 40) * Math.sqrt(count / max)) * unitsPerPixel;
    }

    function paint() {
      const styles = getComputedStyle(section);
      const unitsPerPixel = mapUnitsPerPixel();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = styles.getPropertyValue('--map-land').trim();
      context.strokeStyle = styles.getPropertyValue('--map-border').trim();
      context.save();
      context.scale(zoom, zoom);
      context.translate(-left, -top);
      context.lineWidth = 0.7 * unitsPerPixel / zoom;
      for (const path of polygons) {
        context.fill(path, 'evenodd');
        context.stroke(path);
      }
      context.restore();

      context.fillStyle = styles.getPropertyValue('--map-marker').trim();
      context.strokeStyle = styles.getPropertyValue('--map-marker-outline').trim();
      context.lineWidth = unitsPerPixel;
      for (const { x, y, count } of markers) {
        context.beginPath();
        context.arc((x - left) * zoom, (y - top) * zoom, radius(count, unitsPerPixel), 0, 2 * Math.PI);
        context.fill();
        context.stroke();
      }
    }

    paint();
    new MutationObserver(paint).observe(document.documentElement, { attributeFilter: ['data-theme'] });
    if (!markers.length) return;
    controls.hidden = false;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'World map of visits by region. When zoomed, use the arrow keys to pan.');
    new ResizeObserver(paint).observe(canvas);

    function moveView(x, y) {
      left = Math.min(map.width * (1 - 1 / zoom), Math.max(0, x));
      top = Math.min(map.height * (1 - 1 / zoom), Math.max(0, y));
      label.textContent = labelDefault;
      paint();
    }

    function changeZoom(nextZoom) {
      const shift = (1 / zoom - 1 / nextZoom) / 2;
      zoom = nextZoom;
      zoomIn.disabled = zoom === 8;
      zoomOut.disabled = zoom === 1;
      frame.toggleAttribute('data-zoomed', zoom > 1);
      moveView(left + map.width * shift, top + map.height * shift);
    }

    function showPlace(event) {
      const bounds = canvas.getBoundingClientRect();
      const unitsPerPixel = mapUnitsPerPixel();
      const x = (event.clientX - bounds.left) * unitsPerPixel;
      const y = (event.clientY - bounds.top) * unitsPerPixel;
      let nearest;
      let nearestDistance = Infinity;
      for (const marker of markers) {
        const distance = Math.hypot(x - (marker.x - left) * zoom, y - (marker.y - top) * zoom);
        const hitRadius = Math.max(radius(marker.count, unitsPerPixel), 7 * unitsPerPixel);
        if (distance <= hitRadius && distance < nearestDistance) {
          nearest = marker;
          nearestDistance = distance;
        }
      }
      label.textContent = nearest
        ? `${regionLabel(nearest)} · ${number.format(nearest.count)} ${nearest.count === 1 ? 'visit' : 'visits'}`
        : labelDefault;
    }
    zoomIn.addEventListener('click', () => changeZoom(zoom * 2));
    zoomOut.addEventListener('click', () => changeZoom(zoom / 2));
    canvas.addEventListener('keydown', event => {
      const direction = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
      }[event.key];
      if (zoom === 1 || !direction) return;
      event.preventDefault();
      const step = 40 * mapUnitsPerPixel() / zoom;
      moveView(left + direction[0] * step, top + direction[1] * step);
    });
    canvas.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      dragged = false;
      if (zoom === 1) return;
      drag = { x: event.clientX, y: event.clientY, left, top };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!event.isPrimary) return;
      if (drag) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        dragged ||= Math.hypot(dx, dy) > 4;
        if (dragged) {
          const scale = mapUnitsPerPixel() / zoom;
          moveView(drag.left - dx * scale, drag.top - dy * scale);
        }
      } else if (event.pointerType !== 'touch') showPlace(event);
    });
    canvas.addEventListener('lostpointercapture', () => { drag = undefined; });
    canvas.addEventListener('click', event => { if (!dragged) showPlace(event); });
    canvas.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') label.textContent = labelDefault; });
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
