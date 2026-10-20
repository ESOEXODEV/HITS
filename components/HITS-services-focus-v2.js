/* HITS Services focus — v1: native anchors and Lenis-compatible scroll emphasis. */
(function () {
  'use strict';
  const ids = ["tentpole-moments","skyad","hits-experiences","boots-on-the-ground","projection-stunts"];
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;
  let frame = 0, pending = null, pendingUntil = 0, active = null;
  function chooseSection(rects, height) {
    const line = height * 0.45;
    let best = -1, distance = Infinity;
    rects.forEach((rect, index) => {
      if (rect.bottom <= 0 || rect.top >= height || rect.height <= 0) return;
      const d = line < rect.top ? rect.top - line : line > rect.bottom ? line - rect.bottom : 0;
      if (d < distance) { best = index; distance = d; }
    });
    return best;
  }
  const navigationLinks = Array.from(document.querySelectorAll('.row-services.anchors a.service-block[href]'));
  function activate(section) {
    if (section === active) return;
    active = section;
    sections.forEach(item => item.classList.toggle('hits-service-current', item === section));
    navigationLinks.forEach(link => {
      const isCurrent = Boolean(section && anchorTarget(link.href) === section);
      link.classList.toggle('hits-service-nav-current', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
    });
  }
  function update() {
    frame = 0;
    const height = window.innerHeight;
    const rects = sections.map(section => section.getBoundingClientRect());
    if (pending && performance.now() < pendingUntil) {
      const rect = rects[sections.indexOf(pending)];
      activate(pending);
      if (rect && rect.top <= height * 0.45 && rect.bottom >= height * 0.45) pending = null;
    } else {
      pending = null;
      const index = chooseSection(rects, height);
      activate(index < 0 ? null : sections[index]);
    }
    document.documentElement.classList.add('hits-service-focus');
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function cancelPending() { pending = null; schedule(); }
  function anchorTarget(value) {
    try {
      const url = new URL(value, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return null;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      return sections.find(section => section === target || section.contains(target)) || null;
    } catch (_) { return null; }
  }
  function revealAnchor(target) {
    if (!target) return;
    pending = target;
    pendingUntil = performance.now() + 2000;
    activate(target);
    schedule();
    setTimeout(schedule, 2050);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (link && (!link.target || link.target === '_self')) revealAnchor(anchorTarget(link.href));
  });
  window.addEventListener('hashchange', () => revealAnchor(anchorTarget(location.href)));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('wheel', cancelPending, { passive: true });
  window.addEventListener('touchstart', cancelPending, { passive: true });
  document.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancelPending();
  });
  // Resize after CMS content, images, or responsive text changes.
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(schedule);
    sections.forEach(section => observer.observe(section));
  }
  update();
})();
