# HITS reusable drone blocks

The Webflow component **HITS Drone Grid** is saved in the HITS site. A draft page named **Drone Components** contains 4×4, 3×3, 2×2 and 8×1 examples. The animation is separate from the homepage Three.js grid.

## Use the saved component

1. Insert **HITS Drone Grid** from Webflow's Components panel.
2. Set its **Columns**, **Rows**, **Drone size**, **Padding**, and **Color** properties. For a line use Rows = 1. Counts are whole numbers from 1 to 24.
3. Give its containing div the desired dimensions. The component's default class is 100% wide and 180px tall; change the class height or add a combo class for your placement. Drone size and padding use CSS pixels. Use padding at least 1.5× the drone size to prevent glow clipping.
4. Publish to see the Canvas animation. Custom scripts do not normally execute on Webflow's editing canvas.

## CMS colors

For either a Collection List item or a CMS template page:

1. Place the component in a div inside that CMS context.
2. Bind that outer div's **text color** to the desired CMS Color field using Webflow's dynamic style binding.
3. Set the component **Color** property to `inherit`.

Each item reads its own inherited color. The default component color is gold (`#f0c36e`). Explicit CSS colors also work. `--hits-drone-color` can supply an inherited CSS variable when Color is `inherit`. CMS data is rendered by Webflow; the component does not call the CMS API. No CMS collection or field was modified by this installation. The draft's cyan line demonstrates inherited color, not a live CMS binding.

## Use any div directly

```html
<div style="position:relative;width:240px;height:180px;color:#f0c36e"
     data-drone-grid="true"
     data-drone-columns="4"
     data-drone-rows="4"
     data-drone-size="4.5"
     data-drone-padding="16"
     data-drone-color="inherit"></div>
```

The shared loader is installed once in the site's footer code. No per-instance script is needed. Set `data-drone-grid="false"` to disable a block. `window.HITSDroneBlocks.refresh()` manually rescans blocks after custom integrations change styles; normal CMS-rendered instances initialize automatically.

## Behavior

- Canvas 2D rendering with the homepage flicker formula; no thumbnails or cursor movement.
- The fixed row/column counts stretch evenly inside each block as its dimensions change. A single row/column is centered on that axis.
- One animation loop for all instances, capped near 30fps, with device-pixel ratio capped at 2.
- Off-screen instances pause; hidden tabs pause; reduced motion shows static drones.
- ResizeObserver handles container changes. Added, removed, copied and attribute-updated blocks are detected.
- Canvas is decorative, hidden from screen readers and transparent to pointer events.

## Validation

`node test-runtime.cjs` tests geometry, actual Canvas pixel colors, flicker, reduced motion, resizing, duplication, cleanup and idempotent refresh using the native Canvas runtime and a controlled DOM harness.

`node test-drone-blocks.cjs` provides the full Playwright browser checks when Chromium is installed. Browser checks were not run in this environment because the Chromium download failed. Review the published/staging page before placing components throughout the site.
