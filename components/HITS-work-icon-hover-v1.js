/* Match the existing icon's hover glow to its CMS project color. */
(function () {
  function colorProjectIcons() {
    document.querySelectorAll('[data-hits-project-drones]').forEach(wrapper => {
      const grid = wrapper.querySelector('[data-drone-color]');
      const color = grid && grid.getAttribute('data-drone-color');
      if (color && CSS.supports('color', color)) wrapper.style.setProperty('--hits-project-glow', color);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', colorProjectIcons, { once: true });
  else colorProjectIcons();
})();
