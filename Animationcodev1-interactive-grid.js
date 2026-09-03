/*
 * Heads in the Sky
 * Interactive Drone Grid — v2
 *
 * GRID ONLY
 *
 * Sequence:
 * 1. Drone grid rises from below
 * 2. Rows settle into formation
 * 3. Grid remains permanently visible
 * 4. Particles continuously flicker
 * 5. Grid responds to mouse movement
 *
 * Requires:
 * THREE.js r125
 * FontLoader is NOT required for this version
 *
 * Webflow must contain an element with:
 * ID="magic"
 */


/*
 * ============================================================
 * SHADERS
 * ============================================================
 */


const HITS_VERTEX_SHADER = `

attribute float size;
attribute vec3 customColor;
attribute float alpha;

varying vec3 vColor;
varying float vAlpha;

void main() {

  vColor =
    customColor;

  vAlpha =
    alpha;


  vec4 mvPosition =
    modelViewMatrix *
    vec4(
      position,
      1.0
    );


  gl_PointSize =
    size *
    (
      300.0 /
      -mvPosition.z
    );


  gl_Position =
    projectionMatrix *
    mvPosition;

}

`;



const HITS_FRAGMENT_SHADER = `

uniform sampler2D pointTexture;

varying vec3 vColor;
varying float vAlpha;

void main() {

  vec4 textureColor =
    texture2D(
      pointTexture,
      gl_PointCoord
    );


  gl_FragColor =
    vec4(
      vColor,
      vAlpha
    ) *
    textureColor;

}

`;



/*
 * ============================================================
 * GRID PARTICLE SYSTEM
 * ============================================================
 */


class CreateParticles {

  constructor(
    scene,
    font,
    particleImg,
    camera,
    renderer
  ) {

    /*
     * Keep the same constructor signature
     * as the existing HITS animation so the
     * current Webflow BODY code can remain
     * unchanged.
     *
     * "font" is intentionally unused.
     */

    this.scene =
      scene;

    this.font =
      font;

    this.particleImg =
      particleImg;

    this.camera =
      camera;

    this.renderer =
      renderer;


    /*
     * ========================================================
     * SETTINGS
     * ========================================================
     */


    this.data = {

      /*
       * Total visible drone count.
       *
       * This preserves the approximate density
       * of the intro grid from the word animation.
       */

      amount: 120,


      /*
       * Base particle size.
       */

      particleSize: 2.5,


      /*
       * Gold used throughout the HITS animation.
       */

      particleColor:
        0xf0c36e,


      /*
       * Mouse interaction radius / force.
       */

      area: 50,


      /*
       * How quickly disturbed drones return
       * to their original grid locations.
       */

      ease: 0.05

    };


    /*
     * ========================================================
     * INTRO TIMING
     * ========================================================
     */


    /*
     * Grid begins immediately.
     */

    this.introDelay =
      0;


    /*
     * Existing rise timing:
     * approximately 2.85 seconds.
     */

    this.introGridDuration =
      2850;


    /*
     * After introGridDuration there is NO
     * fade-out, black pause, word animation,
     * morph, or arrow.
     *
     * The grid becomes the permanent state.
     */


    /*
     * ========================================================
     * INTERACTION STATE
     * ========================================================
     */


    this.mouse =
      new THREE.Vector2(
        -200,
        200
      );


    this.raycaster =
      new THREE.Raycaster();


    this.buttom =
      false;


    /*
     * Preserve the original typo "buttom"
     * because the interaction logic historically
     * used this property for mouse-down state.
     */


    /*
     * ========================================================
     * PARTICLE REFERENCES
     * ========================================================
     */


    this.particles =
      null;


    this.geometryCopy =
      null;


    this.gridHomePositions =
      null;


    this.gridStartPositions =
      null;


    this.gridRows =
      null;


    this.gridColumns =
      null;


    this.planeArea =
      null;


    this.startTime =
      performance.now();


    /*
     * Build everything.
     */


    this.setup();

  }



  /*
   * ============================================================
   * BASIC HELPERS
   * ============================================================
   */


  visibleHeightAtZDepth(
    depth,
    camera
  ) {

    const cameraOffset =
      camera.position.z;


    if (
      depth <
      cameraOffset
    ) {

      depth -=
        cameraOffset;

    }

    else {

      depth +=
        cameraOffset;

    }


    const vFOV =
      camera.fov *
      Math.PI /
      180;


    return (
      2 *
      Math.tan(
        vFOV / 2
      ) *
      Math.abs(
        depth
      )
    );

  }



  visibleWidthAtZDepth(
    depth,
    camera
  ) {

    const height =
      this.visibleHeightAtZDepth(
        depth,
        camera
      );


    return (
      height *
      camera.aspect
    );

  }



  distance(
    x1,
    y1,
    x2,
    y2
  ) {

    return Math.sqrt(

      Math.pow(
        x1 - x2,
        2
      )

      +

      Math.pow(
        y1 - y2,
        2
      )

    );

  }



  /*
   * ============================================================
   * SETUP
   * ============================================================
   */


  setup() {

    /*
     * Invisible plane used to translate
     * screen mouse coordinates into the
     * Three.js world.
     */


    const visibleWidth =
      this.visibleWidthAtZDepth(
        100,
        this.camera
      );


    const visibleHeight =
      this.visibleHeightAtZDepth(
        100,
        this.camera
      );


    const planeGeometry =
      new THREE.PlaneGeometry(
        visibleWidth,
        visibleHeight
      );


    const planeMaterial =
      new THREE.MeshBasicMaterial({

        color:
          0x000000,

        transparent:
          true,

        opacity:
          0,

        depthWrite:
          false

      });


    this.planeArea =
      new THREE.Mesh(
        planeGeometry,
        planeMaterial
      );


    this.scene.add(
      this.planeArea
    );


    /*
     * Create the drone grid.
     */


    this.createGrid();


    /*
     * Mouse / touch listeners.
     */


    this.bindEvents();

  }



  /*
   * ============================================================
   * EVENT LISTENERS
   * ============================================================
   */


  bindEvents() {

    document.addEventListener(

      'mousemove',

      this.onMouseMove.bind(
        this
      )

    );


    document.addEventListener(

      'mousedown',

      this.onMouseDown.bind(
        this
      )

    );


    document.addEventListener(

      'mouseup',

      this.onMouseUp.bind(
        this
      )

    );


    document.addEventListener(

      'touchmove',

      this.onTouchMove.bind(
        this
      ),

      {
        passive: true
      }

    );


    document.addEventListener(

      'touchstart',

      this.onTouchStart.bind(
        this
      ),

      {
        passive: true
      }

    );


    document.addEventListener(

      'touchend',

      this.onTouchEnd.bind(
        this
      ),

      {
        passive: true
      }

    );

  }



  onMouseMove(
    event
  ) {

    const rect =
      this.renderer.domElement
        .getBoundingClientRect();


    this.mouse.x =
      (
        (
          event.clientX -
          rect.left
        ) /
        rect.width
      ) *
      2 -
      1;


    this.mouse.y =
      -(
        (
          event.clientY -
          rect.top
        ) /
        rect.height
      ) *
      2 +
      1;

  }



  onMouseDown() {

    this.buttom =
      true;

  }



  onMouseUp() {

    this.buttom =
      false;

  }



  onTouchMove(
    event
  ) {

    if (
      !event.touches ||
      !event.touches.length
    ) {

      return;

    }


    const touch =
      event.touches[0];


    const rect =
      this.renderer.domElement
        .getBoundingClientRect();


    this.mouse.x =
      (
        (
          touch.clientX -
          rect.left
        ) /
        rect.width
      ) *
      2 -
      1;


    this.mouse.y =
      -(
        (
          touch.clientY -
          rect.top
        ) /
        rect.height
      ) *
      2 +
      1;

  }



  onTouchStart(
    event
  ) {

    this.buttom =
      true;


    this.onTouchMove(
      event
    );

  }



  onTouchEnd() {

    this.buttom =
      false;

  }



  /*
   * ============================================================
   * CREATE GRID
   * ============================================================
   */


  createGrid() {

    const count =
      this.data.amount;


    /*
     * Determine grid dimensions from the
     * particle count.
     *
     * 120 drones gives us a 15 × 8 grid.
     */


    const columns =
      15;


    const rows =
      Math.ceil(
        count /
        columns
      );


    this.gridColumns =
      columns;


    this.gridRows =
      rows;


    /*
     * Calculate visible world dimensions
     * at the particle depth.
     */


    const visibleWidth =
      this.visibleWidthAtZDepth(
        0,
        this.camera
      );


    const visibleHeight =
      this.visibleHeightAtZDepth(
        0,
        this.camera
      );


    /*
     * Keep the grid narrower than the full
     * viewport. 0.78 matches the narrower
     * intro-grid direction we established.
     */


    const gridWidth =
      visibleWidth *
      0.78;


    const gridHeight =
      visibleHeight *
      0.72;


    const spacingX =
      gridWidth /
      Math.max(
        columns - 1,
        1
      );


    const spacingY =
      gridHeight /
      Math.max(
        rows - 1,
        1
      );


    /*
     * Attribute arrays.
     */


    const positions =
      new Float32Array(
        count * 3
      );


    const homePositions =
      new Float32Array(
        count * 3
      );


    const startPositions =
      new Float32Array(
        count * 3
      );


    const colors =
      new Float32Array(
        count * 3
      );


    const sizes =
      new Float32Array(
        count
      );


    const alphas =
      new Float32Array(
        count
      );


    const color =
      new THREE.Color(
        this.data.particleColor
      );


    /*
     * Build the permanent grid.
     */


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const column =
        i %
        columns;


      const row =
        Math.floor(
          i /
          columns
        );


      /*
       * Center grid around 0,0.
       */


      const x =
        -gridWidth / 2 +
        column *
        spacingX;


      const y =
        gridHeight / 2 -
        row *
        spacingY;


      /*
       * Very subtle depth variation keeps
       * the formation from looking completely
       * computer-flat.
       */


      const depthRandom =
        Math.sin(
          i * 17.231
        );


      const z =
        depthRandom *
        0.35;


      const i3 =
        i * 3;


      /*
       * Final/home position.
       */


      homePositions[i3] =
        x;


      homePositions[i3 + 1] =
        y;


      homePositions[i3 + 2] =
        z;


      /*
       * Start below the viewport.
       *
       * Individual row timing in render()
       * creates the rising formation effect.
       */


      const startY =
        -visibleHeight *
        0.72 -
        row *
        spacingY *
        0.35;


      startPositions[i3] =
        x;


      startPositions[i3 + 1] =
        startY;


      startPositions[i3 + 2] =
        z;


      /*
       * Initial rendered position.
       */


      positions[i3] =
        x;


      positions[i3 + 1] =
        startY;


      positions[i3 + 2] =
        z;


      /*
       * Initial color.
       *
       * Flicker modifies this continuously
       * during render().
       */


      colors[i3] =
        color.r;


      colors[i3 + 1] =
        color.g;


      colors[i3 + 2] =
        color.b;


      /*
       * Slightly varied drone sizes.
       */


      const sizeRandom =
        Math.sin(
          i * 78.233
        ) *
        43758.5453;


      const normalizedSize =
        sizeRandom -
        Math.floor(
          sizeRandom
        );


      sizes[i] =
        this.data.particleSize *
        (
          0.85 +
          normalizedSize *
          0.30
        );


      /*
       * Start invisible.
       */


      alphas[i] =
        0;

    }


    this.gridHomePositions =
      homePositions;


    this.gridStartPositions =
      startPositions;


    /*
     * Build Three.js geometry.
     */


    const geometry =
      new THREE.BufferGeometry();


    geometry.setAttribute(

      'position',

      new THREE.BufferAttribute(
        positions,
        3
      )

    );


    geometry.setAttribute(

      'customColor',

      new THREE.BufferAttribute(
        colors,
        3
      )

    );


    geometry.setAttribute(

      'size',

      new THREE.BufferAttribute(
        sizes,
        1
      )

    );


    geometry.setAttribute(

      'alpha',

      new THREE.BufferAttribute(
        alphas,
        1
      )

    );


    /*
     * Keep an untouched copy of the final
     * formation for interaction recovery.
     */


    this.geometryCopy =
      new THREE.BufferGeometry();


    this.geometryCopy.setAttribute(

      'position',

      new THREE.BufferAttribute(
        homePositions.slice(),
        3
      )

    );


    /*
     * Particle shader material.
     */


    const material =
      new THREE.ShaderMaterial({

        uniforms: {

          pointTexture: {
            value:
              this.particleImg
          }

        },

        vertexShader:
          HITS_VERTEX_SHADER,

        fragmentShader:
          HITS_FRAGMENT_SHADER,

        blending:
          THREE.AdditiveBlending,

        depthTest:
          false,

        transparent:
          true,

        vertexColors:
          true

      });


    this.particles =
      new THREE.Points(
        geometry,
        material
      );


    this.scene.add(
      this.particles
    );

  }
    /*
   * ============================================================
   * RISE ANIMATION
   * ============================================================
   */


  animateGridRise(
    elapsed
  ) {

    const pos =
      this.particles.geometry
        .attributes.position;


    const alpha =
      this.particles.geometry
        .attributes.alpha;


    const colors =
      this.particles.geometry
        .attributes.customColor;


    const count =
      pos.count;


    const time =
      performance.now();


    const color =
      new THREE.Color(
        this.data.particleColor
      );


    /*
     * Overall rise progress.
     */


    const overallProgress =
      THREE.MathUtils.clamp(

        (
          elapsed -
          this.introDelay
        ) /
        this.introGridDuration,

        0,
        1

      );


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const i3 =
        i * 3;


      const row =
        Math.floor(
          i /
          this.gridColumns
        );


      /*
       * Each row starts slightly later than
       * the row beneath it.
       *
       * This keeps the "rising into place"
       * feeling instead of having the entire
       * grid move upward as one flat block.
       */


      const rowDelay =
        (
          this.gridRows -
          1 -
          row
        ) *
        0.045;


      const rowDuration =
        0.72;


      let rowProgress =
        (
          overallProgress -
          rowDelay
        ) /
        rowDuration;


      rowProgress =
        THREE.MathUtils.clamp(
          rowProgress,
          0,
          1
        );


      /*
       * Smooth ease-in/out.
       */


      const eased =
        rowProgress *
        rowProgress *
        (
          3 -
          2 *
          rowProgress
        );


      const startX =
        this.gridStartPositions[i3];


      const startY =
        this.gridStartPositions[i3 + 1];


      const startZ =
        this.gridStartPositions[i3 + 2];


      const targetX =
        this.gridHomePositions[i3];


      const targetY =
        this.gridHomePositions[i3 + 1];


      const targetZ =
        this.gridHomePositions[i3 + 2];


      const x =
        THREE.MathUtils.lerp(
          startX,
          targetX,
          eased
        );


      const y =
        THREE.MathUtils.lerp(
          startY,
          targetY,
          eased
        );


      const z =
        THREE.MathUtils.lerp(
          startZ,
          targetZ,
          eased
        );


      pos.setXYZ(
        i,
        x,
        y,
        z
      );


      /*
       * Fade the drones in as they rise.
       *
       * Unlike the old intro, they never
       * begin fading back out.
       */


      alpha.array[i] =
        THREE.MathUtils.clamp(
          rowProgress *
          1.5,
          0,
          1
        );


      /*
       * Same basic flicker character used
       * in the word animation.
       */


      const randomValue =
        Math.sin(
          i *
          12.9898
        ) *
        43758.5453;


      const normalizedRandom =
        randomValue -
        Math.floor(
          randomValue
        );


      const baseBrightness =
        0.62 +
        normalizedRandom *
        0.16;


      const flicker =
        0.90 +

        Math.sin(
          time *
          0.010 +
          i *
          1.73
        ) *
        0.06 +

        Math.sin(
          time *
          0.023 +
          i *
          4.17
        ) *
        0.04;


      const brightness =
        baseBrightness *
        flicker;


      colors.setXYZ(

        i,

        color.r *
        brightness,

        color.g *
        brightness,

        color.b *
        brightness

      );

    }


    pos.needsUpdate =
      true;


    alpha.needsUpdate =
      true;


    colors.needsUpdate =
      true;

  }



  /*
   * ============================================================
   * PERMANENT INTERACTIVE GRID
   * ============================================================
   */


  updateInteractiveGrid() {

    const geometry =
      this.particles.geometry;


    const pos =
      geometry.attributes.position;


    const colors =
      geometry.attributes.customColor;


    const size =
      geometry.attributes.size;


    const alpha =
      geometry.attributes.alpha;


    const copy =
      this.geometryCopy
        .attributes.position;


    /*
     * Convert current mouse position into
     * world coordinates using the same
     * invisible plane approach as the
     * original word animation.
     */


    this.raycaster.setFromCamera(
      this.mouse,
      this.camera
    );


    const intersects =
      this.raycaster.intersectObject(
        this.planeArea
      );


    const hasMouseIntersection =
      intersects.length >
      0;


    const mx =
      hasMouseIntersection
      ? intersects[0].point.x
      : 100000;


    const my =
      hasMouseIntersection
      ? intersects[0].point.y
      : 100000;


    const color =
      new THREE.Color(
        this.data.particleColor
      );


    const time =
      performance.now();


    for (
      let i = 0;
      i < pos.count;
      i++
    ) {

      /*
       * Current position.
       */


      let px =
        pos.getX(i);


      let py =
        pos.getY(i);


      let pz =
        pos.getZ(i);


      /*
       * Permanent home position.
       */


      const initX =
        copy.getX(i);


      const initY =
        copy.getY(i);


      const initZ =
        copy.getZ(i);


      /*
       * ========================================================
       * FLICKER
       * ========================================================
       */


      const randomValue =
        Math.sin(
          i *
          12.9898
        ) *
        43758.5453;


      const normalizedRandom =
        randomValue -
        Math.floor(
          randomValue
        );


      const baseBrightness =
        0.62 +
        normalizedRandom *
        0.16;


      const flicker =
        0.90 +

        Math.sin(
          time *
          0.010 +
          i *
          1.73
        ) *
        0.06 +

        Math.sin(
          time *
          0.023 +
          i *
          4.17
        ) *
        0.04;


      const brightness =
        baseBrightness *
        flicker;


      colors.setXYZ(

        i,

        color.r *
        brightness,

        color.g *
        brightness,

        color.b *
        brightness

      );


      /*
       * Keep every particle visible.
       */


      alpha.array[i] =
        1;


      /*
       * ========================================================
       * MOUSE DISTANCE
       * ========================================================
       */


      const dx =
        mx -
        px;


      const dy =
        my -
        py;


      const mouseDistance =
        this.distance(
          mx,
          my,
          px,
          py
        );


      let d =
        dx *
        dx +
        dy *
        dy;


      d =
        Math.max(
          d,
          0.001
        );


      const force =
        -
        this.data.area /
        d;


      /*
       * ========================================================
       * CLICK / PRESS BEHAVIOR
       * ========================================================
       *
       * This preserves the more aggressive
       * displacement used when the mouse is
       * held down.
       */


      if (
        this.buttom &&
        hasMouseIntersection
      ) {

        const angle =
          Math.atan2(
            dy,
            dx
          );


        px -=
          force *
          Math.cos(
            angle
          );


        py -=
          force *
          Math.sin(
            angle
          );


        size.array[i] =
          this.data.particleSize *
          1.15;

      }


      /*
       * ========================================================
       * HOVER BEHAVIOR
       * ========================================================
       */


      else if (
        hasMouseIntersection &&
        mouseDistance <
        this.data.area
      ) {

        const angle =
          Math.atan2(
            dy,
            dx
          );


        px +=
          force *
          Math.cos(
            angle
          );


        py +=
          force *
          Math.sin(
            angle
          );


        size.array[i] =
          this.data.particleSize *
          1.30;

      }


      /*
       * ========================================================
       * NORMAL PARTICLE SIZE
       * ========================================================
       */


      else {

        const sizeRandomValue =
          Math.sin(
            i *
            78.233
          ) *
          43758.5453;


        const normalizedSizeRandom =
          sizeRandomValue -
          Math.floor(
            sizeRandomValue
          );


        const sizeVariation =
          0.85 +
          normalizedSizeRandom *
          0.30;


        size.array[i] =
          this.data.particleSize *
          sizeVariation;

      }


      /*
       * ========================================================
       * RETURN TO GRID
       * ========================================================
       *
       * This runs continuously, including
       * while particles are being disturbed.
       *
       * The interaction pushes them away;
       * this easing pulls them smoothly back.
       */


      px +=
        (
          initX -
          px
        ) *
        this.data.ease;


      py +=
        (
          initY -
          py
        ) *
        this.data.ease;


      pz +=
        (
          initZ -
          pz
        ) *
        this.data.ease;


      pos.setXYZ(
        i,
        px,
        py,
        pz
      );

    }


    /*
     * Tell Three.js that our CPU-side
     * attribute arrays changed.
     */


    pos.needsUpdate =
      true;


    colors.needsUpdate =
      true;


    size.needsUpdate =
      true;


    alpha.needsUpdate =
      true;

  }



  /*
   * ============================================================
   * RESIZE SUPPORT
   * ============================================================
   */


  rebuildGrid() {

    if (
      !this.particles
    ) {

      return;

    }


    /*
     * Remove old grid.
     */


    this.scene.remove(
      this.particles
    );


    if (
      this.particles.geometry
    ) {

      this.particles.geometry
        .dispose();

    }


    if (
      this.particles.material
    ) {

      this.particles.material
        .dispose();

    }


    this.particles =
      null;


    this.geometryCopy =
      null;


    /*
     * Rebuild the interaction plane so its
     * dimensions match the resized camera.
     */


    if (
      this.planeArea
    ) {

      this.scene.remove(
        this.planeArea
      );


      if (
        this.planeArea.geometry
      ) {

        this.planeArea.geometry
          .dispose();

      }


      if (
        this.planeArea.material
      ) {

        this.planeArea.material
          .dispose();

      }


      this.planeArea =
        null;

    }


    const visibleWidth =
      this.visibleWidthAtZDepth(
        100,
        this.camera
      );


    const visibleHeight =
      this.visibleHeightAtZDepth(
        100,
        this.camera
      );


    const planeGeometry =
      new THREE.PlaneGeometry(
        visibleWidth,
        visibleHeight
      );


    const planeMaterial =
      new THREE.MeshBasicMaterial({

        color:
          0x000000,

        transparent:
          true,

        opacity:
          0,

        depthWrite:
          false

      });


    this.planeArea =
      new THREE.Mesh(
        planeGeometry,
        planeMaterial
      );


    this.scene.add(
      this.planeArea
    );


    /*
     * Rebuild the particle formation.
     */


    this.createGrid();


    /*
     * The grid should remain in its completed
     * state after a resize rather than replaying
     * the intro.
     */


    const pos =
      this.particles.geometry
        .attributes.position;


    const alpha =
      this.particles.geometry
        .attributes.alpha;


    for (
      let i = 0;
      i < pos.count;
      i++
    ) {

      const i3 =
        i *
        3;


      pos.setXYZ(

        i,

        this.gridHomePositions[i3],

        this.gridHomePositions[i3 + 1],

        this.gridHomePositions[i3 + 2]

      );


      alpha.array[i] =
        1;

    }


    pos.needsUpdate =
      true;


    alpha.needsUpdate =
      true;


    /*
     * Mark the animation as already complete.
     */


    this.startTime =
      performance.now() -
      this.introGridDuration;

  }
    /*
   * ============================================================
   * MAIN RENDER LOOP
   * ============================================================
   */


  render() {

    if (
      !this.particles
    ) {

      return;

    }


    const now =
      performance.now();


    const elapsed =
      now -
      this.startTime;


    /*
     * Phase 1:
     * grid rises into place.
     */


    if (
      elapsed <
      this.introGridDuration
    ) {

      this.animateGridRise(
        elapsed
      );

      return;

    }


    /*
     * Phase 2:
     * permanent interactive grid.
     */


    this.updateInteractiveGrid();

  }

}



/*
 * ============================================================
 * GLOBAL EXPORT
 * ============================================================
 *
 * Keep the same global class name used by
 * the existing Webflow Environment code.
 */


window.CreateParticles =
  CreateParticles;
