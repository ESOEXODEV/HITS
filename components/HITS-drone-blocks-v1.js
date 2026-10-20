/* HITS reusable decorative drones — v1. Independent of the homepage / THREE.js. */
(function () {
  'use strict';
  if (window.HITSDroneBlocks) { window.HITSDroneBlocks.refresh(); return; }
  const selector = '[data-drone-grid]:not([data-drone-grid="false"])';
  const instances = new Map();
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
      if (time - this.colorAt < 500) return;
      this.colorAt = time;
      const style = getComputedStyle(this.host);
      const override = this.host.getAttribute('data-drone-color');
      let color = override && !['inherit', 'currentColor'].includes(override) ? override :
        style.getPropertyValue('--hits-drone-color').trim() || style.color || '#f0c36e';
      if (!CSS.supports('color', color)) color = '#f0c36e';
      if (color === this.color && this.sprite) return;
      this.color = color;
      // Resolve CSS colors to a browser-normalized color for the reusable sprite.
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
      const ctx = sprite.getContext('2d');
      if (!ctx) return;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      ctx.fillStyle = color;
      const resolved = ctx.fillStyle;
      gradient.addColorStop(0, resolved);
      gradient.addColorStop(0.18, resolved);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
      this.sprite = sprite;
    }
    draw(time) {
      if (!this.ctx) return;
      this.updateColor(time);
      if (!this.sprite) return;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.globalCompositeOperation = 'lighter';
      const diameter = this.size * 3;
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
  window.HITSDroneBlocks = { version: '1.0.0', refresh, points };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
