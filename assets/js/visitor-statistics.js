(function () {
  'use strict';

  const section = document.getElementById('visitors');
  if (!section) return;

  const label = section.querySelector('[data-visitor-place]');
  const number = new Intl.NumberFormat('en');
  const countries = new Intl.DisplayNames('en', { type: 'region' });

  function regionLabel({ country, name }) {
    return `${name}, ${countries.of(country)}`;
  }

  function formatVisits(count) {
    return `${number.format(count)} ${count === 1 ? 'visit' : 'visits'}`;
  }

  function renderSummary({ total, days, regions }) {
    if (Number.isSafeInteger(total) && total >= 0) {
      const period = section.querySelector('[data-visitor-period]');
      const count = document.createElement('strong');
      count.textContent = formatVisits(total);
      period.replaceChildren(count, Number.isSafeInteger(days) && days > 0 ? ` in the last ${days} days` : '');
      period.hidden = false;
    }

    if (!regions?.length) return;
    const list = section.querySelector('[data-visitor-regions]');
    for (const region of regions) {
      const item = document.createElement('li');
      const place = document.createElement('span');
      const count = document.createElement('span');
      place.textContent = regionLabel(region);
      count.textContent = number.format(region.count);
      item.append(place, count);
      list.append(item);
    }
    list.parentElement.hidden = false;
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
    const markers = regions.filter(region => region.coordinates && region.count > 0).map(region => {
      const [longitude, latitude] = region.coordinates;
      return {
        ...region,
        x: (longitude + 180) / 360 * map.width,
        y: (84 - latitude) / 150 * map.height
      };
    }).sort((a, b) => b.count - a.count);
    // Keep low-traffic snapshots from making their largest dot full size.
    const scalePeak = Math.max(25, markers[0]?.count || 0);
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
      const minRadius = 2;
      const maxRadius = Math.max(minRadius, Math.min(10, canvas.clientWidth * 0.018));
      const share = (count - 1) / (scalePeak - 1);
      return Math.sqrt(minRadius ** 2 + (maxRadius ** 2 - minRadius ** 2) * share) * unitsPerPixel;
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
        ? `${regionLabel(nearest)} · ${formatVisits(nearest.count)}`
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
    const data = stats.status === 'fulfilled' ? stats.value : undefined;
    if (data) renderSummary(data);
    if (map.status === 'rejected') {
      label.textContent = 'The map is temporarily unavailable.';
      return;
    }
    drawMap(map.value, data);
    if (stats.status === 'rejected') {
      label.textContent = stats.reason.message === '404'
        ? 'Regional visits will appear after the first update.'
        : 'Regional visits are temporarily unavailable.';
    }
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    load().catch(() => {
      label.textContent = 'The map is temporarily unavailable.';
    });
  }, { rootMargin: '250px' });
  observer.observe(section);
})();
