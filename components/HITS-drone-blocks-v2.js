/* HITS reusable decorative drones — v2. Independent of the homepage / THREE.js. */
(function () {
  'use strict';
  if (window.HITSDroneBlocks) { window.HITSDroneBlocks.refresh(); return; }
  const selector = '[data-drone-grid]:not([data-drone-grid="false"])';
  // Baked from the homepage particle texture and its core/halo shader.
  const particleMask = new Image();
  particleMask.src = 'data:image/png;base64,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';
  const instances = new Map();
  particleMask.onload = () => {
    instances.forEach(item => { item.colorAt = -Infinity; item.dirty = true; });
    wake();
  };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, scanFrame = 0, lastFrame = 0;
  const number = (value, fallback, min, max) => {
    const parsed = value == null || value === '' ? NaN : Number(value);
    return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : fallback));
  };
  function points(width, height, columns, rows, padding) {
    const xPad = Math.min(padding, width / 2);
    const yPad = Math.min(padding, height / 2);
    return Array.from({ length: rows * columns }, (_, i) => ({
      x: columns === 1 ? width / 2 : xPad + (i % columns) * (width - 2 * xPad) / (columns - 1),
      y: rows === 1 ? height / 2 : yPad + Math.floor(i / columns) * (height - 2 * yPad) / (rows - 1)
    }));
  }
  function wake() {
    if (!frame && !document.hidden && [...instances.values()].some(i => i.visible && i.width && i.height)) {
      frame = requestAnimationFrame(tick);
    }
  }
  function tick(time) {
    frame = 0;
    if (document.hidden) return;
    if (time - lastFrame >= 30 || motion.matches) {
      for (const item of instances.values()) {
        if (item.visible && item.width && item.height) item.draw(time);
      }
      lastFrame = time;
    }
    if (!motion.matches) wake();
  }
  const visibility = window.IntersectionObserver ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const item = instances.get(entry.target);
      if (item) { item.visible = entry.isIntersecting; item.dirty = true; }
    }
    wake();
  }, { rootMargin: '100px' }) : null;
  class DroneBlock {
    constructor(host) {
      this.host = host;
      this.visible = !visibility;
      this.width = this.height = 0;
      this.colorAt = -Infinity;
      this.dirty = true;
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('data-hits-drone-canvas', '');
      this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
      this.originalPosition = host.style.position;
      this.positionAdded = getComputedStyle(host).position === 'static';
      if (this.positionAdded) host.style.position = 'relative';
      host.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(host);
      }
      this.configure();
    }
    configure() {
      const h = this.host;
      this.columns = Math.round(number(h.getAttribute('data-drone-columns'), 4, 1, 24));
      this.rows = Math.round(number(h.getAttribute('data-drone-rows'), 4, 1, 24));
      this.size = number(h.getAttribute('data-drone-size'), 4.5, 1, 24);
      this.padding = number(h.getAttribute('data-drone-padding'), 16, 0, 120);
      this.colorAt = -Infinity;
      this.dirty = true;
      this.resize();
    }
    resize() {
      this.width = this.host.clientWidth;
      this.height = this.host.clientHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.points = points(this.width, this.height, this.columns, this.rows, this.padding);
      this.dirty = true;
      wake();
    }
    updateColor(time) {
      if (!particleMask.complete || !particleMask.naturalWidth) return;
      if (time - this.colorAt < 500) return;
      this.colorAt = time;
      const style = getComputedStyle(this.host);
      const override = this.host.getAttribute('data-drone-color');
      let color = override && !['inherit', 'currentColor'].includes(override) ? override :
        style.getPropertyValue('--hits-drone-color').trim() || style.color || '#f0c36e';
      if (!CSS.supports('color', color)) color = '#f0c36e';
      if (color === this.color && this.sprite) return;
      this.color = color;
      // Tint the same core/halo alpha mask as the homepage shader.
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
      const ctx = sprite.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(particleMask, 0, 0, 128, 128);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      this.sprite = sprite;
    }
    draw(time) {
      if (!this.ctx) return;
      this.updateColor(time);
      if (!this.sprite) return;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.globalCompositeOperation = 'lighter';
      // Homepage shader: size × 2 × (300 / camera distance 100).
      // gl_PointSize is in device pixels, so convert to CSS pixels here.
      const diameter = this.size * 6 / this.dpr;
      this.points.forEach((point, i) => {
        const random = Math.sin(i * 12.9898) * 43758.5453;
        const base = 0.62 + (random - Math.floor(random)) * 0.16;
        const flicker = motion.matches ? 0.90 : 0.90 +
          Math.sin(time * 0.006 + i * 1.73) * 0.06 + Math.sin(time * 0.014 + i * 4.17) * 0.04;
        this.ctx.globalAlpha = base * flicker;
        this.ctx.drawImage(this.sprite, point.x - diameter / 2, point.y - diameter / 2, diameter, diameter);
      });
      this.dirty = false;
    }
    destroy() {
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (visibility) visibility.unobserve(this.host);
      this.canvas.remove();
      if (this.positionAdded && this.host.style.position === 'relative') this.host.style.position = this.originalPosition;
    }
  }
  function refresh() {
    for (const [host, item] of instances) {
      if (!host.isConnected || !host.matches(selector)) { item.destroy(); instances.delete(host); }
    }
    document.querySelectorAll(selector).forEach(host => {
      if (!instances.has(host)) {
        const item = new DroneBlock(host); instances.set(host, item);
        if (visibility) visibility.observe(host);
      } else instances.get(host).configure();
    });
    wake();
  }
  function scheduleRefresh() {
    if (!scanFrame) scanFrame = requestAnimationFrame(() => { scanFrame = 0; refresh(); });
  }
  const observer = new MutationObserver(records => {
    // Ignore our own canvas insertion/removal to avoid refresh loops.
    if (records.some(record => record.type === 'attributes' ||
      [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 &&
        !node.hasAttribute('data-hits-drone-canvas')))) scheduleRefresh();
  });
  function start() {
    refresh();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-drone-grid', 'data-drone-columns', 'data-drone-rows', 'data-drone-size',
        'data-drone-color', 'data-drone-padding'] });
  }
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('resize', () => { instances.forEach(item => item.resize()); wake(); }, { passive: true });
  const onMotion = () => { instances.forEach(item => { item.dirty = true; }); wake(); };
  if (motion.addEventListener) motion.addEventListener('change', onMotion);
  window.HITSDroneBlocks = { version: '2.0.0', refresh, points };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
