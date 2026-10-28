/* About gallery: existing Webflow photos, reusable drones, one centered image. */
(function () {
  'use strict';
  const root = document.querySelector('[data-hits-about-gallery]');
  if (!root || root.querySelector('.hits-about-drone-stage')) return;
  const sources = [];
  const seen = new Set();
  // Prefer CMS photos; retain the original gallery until the Designer binding is complete.
  const cmsPhotos = Array.from(root.querySelectorAll('[data-hits-about-cms-source] img[src]'))
    .filter(image => !/image-placeholder|placeholder\.svg/.test(image.getAttribute('src') || ''));
  const photos = cmsPhotos.length ? cmsPhotos : root.querySelectorAll('.gallery-slider img');
  photos.forEach(image => {
    const src = image.getAttribute('src');
    if (!src) return;
    const key = new URL(src, location.href).href;
    if (!seen.has(key)) { seen.add(key); sources.push({ src: key, alt: image.alt || '' }); }
  });
  if (!sources.length) return;
  const stage = document.createElement('div');
  stage.className = 'hits-about-drone-stage';
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-label', 'Heads in the Sky photo gallery');
  const drones = document.createElement('div');
  drones.className = 'hits-about-drones';
  Object.entries({ 'data-drone-grid': 'true', 'data-drone-columns': '12', 'data-drone-rows': '8',
    'data-drone-size': '4.5', 'data-drone-padding': '18', 'data-drone-color': 'inherit' })
    .forEach(([key, value]) => drones.setAttribute(key, value));
  const photo = document.createElement('figure'); photo.className = 'hits-about-photo';
  const image = document.createElement('img'); image.decoding = 'async'; image.draggable = false;
  photo.append(image);
  stage.append(drones, photo); root.prepend(stage);
  let current = -1, token = 0, ready = false, visible = false;
  let timer = null, callback = null, remaining = 0, deadline = 0;
  let phase = 'loading';
  const cache = new Map();
  function active() { return ready && visible && !document.hidden; }
  function stopClock() {
    if (timer != null) { clearTimeout(timer); timer = null; remaining = Math.max(0, deadline - performance.now()); }
  }
  function sync() {
    stopClock();
    if (active() && callback) {
      deadline = performance.now() + remaining;
      timer = setTimeout(() => { timer = null; const fn = callback; callback = null; if (fn) fn(); }, remaining);
    }
  }
  function arm(fn, ms) { stopClock(); callback = fn; remaining = ms; sync(); }
  function load(index) {
    if (!cache.has(index)) cache.set(index, new Promise(resolve => {
      const preloader = new Image();
      let settled = false;
      const done = ok => { if (!settled) { settled = true; clearTimeout(timeout); resolve(ok); } };
      const timeout = setTimeout(() => done(false), 10000);
      preloader.onload = () => done(preloader.naturalWidth > 0);
      preloader.onerror = () => done(false);
      preloader.src = sources[index].src;
      if (preloader.complete) done(preloader.naturalWidth > 0);
    }));
    return cache.get(index);
  }
  async function nextLoaded(from) {
    for (let offset = 1; offset <= sources.length; offset++) {
      const index = (from + offset) % sources.length;
      if (await load(index)) return index;
    }
    return -1;
  }
  function show(index) {
    current = index; image.src = sources[index].src; image.alt = sources[index].alt;
    phase = 'showing'; photo.classList.add('is-visible');
    arm(rotate, 5000);
    if (sources.length > 1) load((index + 1) % sources.length);
  }
  async function rotate() {
    if (!active() || sources.length < 2) return;
    const request = ++token;
    const next = await nextLoaded(current);
    if (request !== token || !active()) { if (request === token) arm(rotate, 500); return; }
    if (next < 0 || next === current) { arm(rotate, 5000); return; }
    phase = 'fading'; photo.classList.remove('is-visible');
    arm(() => { phase = 'gap'; arm(() => show(next), 100); }, 600);
  }
  let inViewport = false;
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver(entries => {
      inViewport = entries[0].isIntersecting;
      visible = inViewport; sync();
    }, { threshold: 0.05 });
    observer.observe(stage);
  } else { inViewport = visible = true; }
  document.addEventListener('visibilitychange', sync);
  function resizeGrid() {
    const width = stage.clientWidth;
    drones.setAttribute('data-drone-columns', width < 400 ? '6' : width < 650 ? '10' : '12');
    drones.setAttribute('data-drone-rows', width < 400 ? '6' : '8');
  }
  if (window.ResizeObserver) new ResizeObserver(resizeGrid).observe(stage);
  resizeGrid();
  nextLoaded(-1).then(index => {
    if (index < 0) { stage.remove(); return; }
    ready = true;
    root.classList.add('hits-about-gallery-ready');
    root.querySelectorAll('.gallery-slider').forEach(slider => {
      slider.setAttribute('aria-hidden', 'true'); slider.inert = true;
    });
    show(index);
    if (window.HITSDroneBlocks) window.HITSDroneBlocks.refresh();
  });
})();
