/*
 * Heads in the Sky
 * Sub-page Box Animation V1
 *
 * Contained Three.js drone animation for Webflow.
 *
 * Webflow target:
 * #magic2
 *
 * Dependency:
 * Three.js r125 / 0.125.2
 */


/* =========================================
   PARTICLE VERTEX SHADER
========================================= */

const HITS_VERTEX_SHADER = `

attribute float size;
attribute vec3 customColor;
attribute float customAlpha;

varying vec3 vColor;
varying float vAlpha;

void main() {

  vColor = customColor;
  vAlpha = customAlpha;

  vec4 mvPosition =
    modelViewMatrix *
    vec4(position, 1.0);

  gl_PointSize =
    size *
    (300.0 / -mvPosition.z);

  gl_Position =
    projectionMatrix *
    mvPosition;

}

`;


/* =========================================
   PARTICLE FRAGMENT SHADER
========================================= */

const HITS_FRAGMENT_SHADER = `

uniform vec3 color;
uniform sampler2D pointTexture;
uniform float opacity;

varying vec3 vColor;
varying float vAlpha;

void main() {

  vec2 center =
    gl_PointCoord -
    vec2(0.5);

  float distanceFromCenter =
    length(center);

  vec4 textureColor =
    texture2D(
      pointTexture,
      gl_PointCoord
    );

  float halo =
    smoothstep(
      0.50,
      0.15,
      distanceFromCenter
    ) *
    0.20;

  float particleAlpha =
    max(
      textureColor.a,
      halo
    );

  gl_FragColor =
    vec4(
      color * vColor,
      particleAlpha *
      opacity *
      vAlpha
    );

}

`;


/* =========================================
   SUB-PAGE PARTICLE SYSTEM
========================================= */

class SubPageBoxParticles {

  constructor(
    scene,
    particleImg,
    camera,
    renderer
  ) {

    this.scene =
      scene;

    this.particleImg =
      particleImg;

    this.camera =
      camera;

    this.renderer =
      renderer;


    /* -------------------------------------
       INTERACTION
    ------------------------------------- */

    this.raycaster =
      new THREE.Raycaster();

    this.mouse =
      new THREE.Vector2(
        -200,
        200
      );

    this.mouseInside =
      false;

    this.buttom =
      false;

    this.currenPosition =
      new THREE.Vector3();

    this.holdProgress =
      0;

    this.lastHoldUpdate =
      performance.now();


    /* -------------------------------------
       VISUAL SETTINGS
    ------------------------------------- */

    this.data = {

      particleSize: 2.5,

      area: 18,

      ease: 0.05,

      behindColor:
        0xf0c36e,

      frontColor:
        0xf0c36e,

      fadeDuration:
        900

    };


    /* -------------------------------------
       PARTICLE STATE
    ------------------------------------- */

    this.particles =
      null;

    this.geometryCopy =
      null;

    this.layerSize =
      0;


    /* -------------------------------------
       FADE-IN
    ------------------------------------- */

    this.fadeStart =
      performance.now();

    this.fadeComplete =
      false;


    /* -------------------------------------
       START
    ------------------------------------- */

    this.setup();

    this.bindEvents();

  }
  /* =========================================
     SETUP
  ========================================= */

  setup() {

    /*
     * Invisible plane used for
     * mouse interaction.
     */

    const planeGeometry =
      new THREE.PlaneGeometry(
        this.visibleWidthAtZDepth(
          0,
          this.camera
        ),
        this.visibleHeightAtZDepth(
          0,
          this.camera
        )
      );


    const planeMaterial =
      new THREE.MeshBasicMaterial({

        color:
          0x00ff00,

        transparent:
          true,

        opacity:
          0

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
     * Build the actual drone formation.
     */

    this.createBoxFormation();

  }


  /* =========================================
     CREATE ! BOX FORMATION
  ========================================= */

  createBoxFormation() {

    const points = [];


    /*
     * Overall dimensions of the formation.
     *
     * These are Three.js world units,
     * not CSS pixels.
     */

    const boxWidth =
      24;

    const boxHeight =
      30;


    const halfWidth =
      boxWidth / 2;

    const halfHeight =
      boxHeight / 2;


    /*
     * Drone spacing around the box.
     *
     * Smaller number =
     * more drones.
     */

    const spacing =
      2.4;


    /* -------------------------------------
       HELPER:
       CREATE LINE OF DRONES
    ------------------------------------- */

    const addLine = (
      x1,
      y1,
      x2,
      y2,
      requestedSpacing = spacing
    ) => {

      const dx =
        x2 - x1;

      const dy =
        y2 - y1;


      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );


      const count =
        Math.max(
          2,
          Math.round(
            distance /
            requestedSpacing
          ) + 1
        );


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const progress =
          i /
          (count - 1);


        points.push(

          new THREE.Vector3(

            THREE.MathUtils.lerp(
              x1,
              x2,
              progress
            ),

            THREE.MathUtils.lerp(
              y1,
              y2,
              progress
            ),

            0

          )

        );

      }

    };


    /* -------------------------------------
       OUTER BOX
    ------------------------------------- */


    /*
     * Top
     */

    addLine(
      -halfWidth,
      halfHeight,
      halfWidth,
      halfHeight
    );


    /*
     * Right
     */

    addLine(
      halfWidth,
      halfHeight - spacing,
      halfWidth,
      -halfHeight + spacing
    );


    /*
     * Bottom
     */

    addLine(
      halfWidth,
      -halfHeight,
      -halfWidth,
      -halfHeight
    );


    /*
     * Left
     */

    addLine(
      -halfWidth,
      -halfHeight + spacing,
      -halfWidth,
      halfHeight - spacing
    );


    /* -------------------------------------
       EXCLAMATION MARK
    ------------------------------------- */


    /*
     * Main vertical stroke.
     *
     * We use two close vertical lines
     * instead of one so the ! has some
     * visual weight.
     */

    const markHalfWidth =
      1.35;

    const markTop =
      9;

    const markBottom =
      -3;


    addLine(
      -markHalfWidth,
      markTop,
      -markHalfWidth,
      markBottom,
      2
    );


    addLine(
      markHalfWidth,
      markTop,
      markHalfWidth,
      markBottom,
      2
    );


    /*
     * Top and bottom connections make
     * the main stroke feel like a
     * narrow rectangular shape.
     */

    addLine(
      -markHalfWidth,
      markTop,
      markHalfWidth,
      markTop,
      1.35
    );


    addLine(
      -markHalfWidth,
      markBottom,
      markHalfWidth,
      markBottom,
      1.35
    );


    /* -------------------------------------
       EXCLAMATION DOT
    ------------------------------------- */

    const dotCenterY =
      -8;


    const dotRadius =
      1.65;


    const dotCount =
      6;


    for (
      let i = 0;
      i < dotCount;
      i++
    ) {

      const angle =
        (
          i /
          dotCount
        ) *
        Math.PI *
        2;


      points.push(

        new THREE.Vector3(

          Math.cos(angle) *
          dotRadius,

          dotCenterY +
          Math.sin(angle) *
          dotRadius,

          0

        )

      );

    }


    /*
     * Center drone gives the dot
     * a little more visual density.
     */

    points.push(

      new THREE.Vector3(
        0,
        dotCenterY,
        0
      )

    );


    /* -------------------------------------
       TWO-LAYER SYSTEM
    ------------------------------------- */

    /*
     * Store the number of drones in
     * one complete formation.
     */

    this.layerSize =
      points.length;


    /*
     * As with the original HITS animation,
     * create two overlapping copies.
     *
     * These will react differently to
     * the cursor in a later section.
     */

    const formationPoints = [

      ...points.map(
        point =>
          point.clone()
      ),

      ...points.map(
        point =>
          point.clone()
      )

    ];


    /*
     * Hand the finished formation to
     * our particle builder.
     *
     * We create this function in
     * Section 3.
     */

    this.createParticles(
      formationPoints
    );

  }

  /* =========================================
     CREATE PARTICLES
  ========================================= */

  createParticles(
    formationPoints
  ) {

    const colors = [];

    const sizes = [];

    const alphas = [];


    const frontColor =
      new THREE.Color(
        this.data.frontColor
      );


    const behindColor =
      new THREE.Color(
        this.data.behindColor
      );


    /* -------------------------------------
       PARTICLE APPEARANCE
    ------------------------------------- */

    formationPoints.forEach(
      (
        point,
        index
      ) => {

        /*
         * Matching particles in the
         * front/back layers use the
         * same variation seed.
         */

        const baseIndex =
          index %
          this.layerSize;


        /*
         * Deterministic brightness
         * variation.
         */

        const randomValue =
          Math.sin(
            baseIndex *
            12.9898
          ) *
          43758.5453;


        const normalizedRandom =
          randomValue -
          Math.floor(
            randomValue
          );


        const brightness =
          0.65 +
          normalizedRandom *
          0.35;


        /*
         * First complete formation =
         * rear layer.
         *
         * Second complete formation =
         * front layer.
         */

        const isBackLayer =
          index <
          this.layerSize;


        const normalColor =
          isBackLayer
            ? behindColor
            : frontColor;


        colors.push(

          normalColor.r *
          brightness,

          normalColor.g *
          brightness,

          normalColor.b *
          brightness

        );


        /* ---------------------------------
           SIZE VARIATION
        --------------------------------- */

        const sizeRandomValue =
          Math.sin(
            baseIndex *
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


        /*
         * Rear layer is slightly smaller.
         */

        const layerScale =
          isBackLayer
            ? 0.92
            : 1.0;


        sizes.push(

          this.data.particleSize *
          sizeVariation *
          layerScale

        );


        /*
         * Formation begins invisible.
         *
         * Section 4 will fade these
         * particles into view.
         */

        alphas.push(
          0
        );

      }
    );


    /* =====================================
       BUFFER GEOMETRY
    ===================================== */

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(
          formationPoints
        );


    geometry.setAttribute(

      'customColor',

      new THREE.Float32BufferAttribute(
        colors,
        3
      )

    );


    geometry.setAttribute(

      'size',

      new THREE.Float32BufferAttribute(
        sizes,
        1
      )

    );


    geometry.setAttribute(

      'customAlpha',

      new THREE.Float32BufferAttribute(
        alphas,
        1
      )

    );


    /* =====================================
       SHADER MATERIAL
    ===================================== */

    const material =
      new THREE.ShaderMaterial({

        uniforms: {

          color: {

            value:
              new THREE.Color(
                0xffffff
              )

          },

          pointTexture: {

            value:
              this.particleImg

          },

          opacity: {

            value:
              1.0

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
          true

      });


    /* =====================================
       PARTICLE OBJECT
    ===================================== */

    this.particles =
      new THREE.Points(
        geometry,
        material
      );


    this.scene.add(
      this.particles
    );


    /* =====================================
       HOME POSITIONS
    ===================================== */

    /*
     * This untouched copy is critical.
     *
     * When the mouse or click pushes a
     * drone away from the formation,
     * geometryCopy tells that drone
     * exactly where "home" is.
     */

    this.geometryCopy =
      new THREE.BufferGeometry();


    this.geometryCopy.copy(
      this.particles.geometry
    );


    /* =====================================
       FADE TIMER
    ===================================== */

    this.fadeStart =
      performance.now();


    this.fadeComplete =
      false;

  }
  /* =========================================
     FADE-IN
  ========================================= */

  updateFade() {

    if (
      !this.particles ||
      this.fadeComplete
    ) {

      return;

    }


    const elapsed =
      performance.now() -
      this.fadeStart;


    const progress =
      THREE.MathUtils.clamp(

        elapsed /
        this.data.fadeDuration,

        0,
        1

      );


    /*
     * Smoothstep easing.
     *
     * This gives us a softer fade than
     * a perfectly linear 0 → 1 transition.
     */

    const smoothFade =
      progress *
      progress *
      (
        3 -
        2 * progress
      );


    const alpha =
      this.particles
        .geometry
        .attributes
        .customAlpha;


    for (
      let i = 0;
      i < alpha.count;
      i++
    ) {

      alpha.array[i] =
        smoothFade;

    }


    alpha.needsUpdate =
      true;


    if (
      progress >= 1
    ) {

      this.fadeComplete =
        true;


      /*
       * Make absolutely sure every
       * drone finishes fully visible.
       */

      for (
        let i = 0;
        i < alpha.count;
        i++
      ) {

        alpha.array[i] =
          1;

      }


      alpha.needsUpdate =
        true;

    }

  }


  /* =========================================
     SUBTLE DRONE FLICKER
  ========================================= */

  updateFlicker() {

    if (
      !this.particles
    ) {

      return;

    }


    const colors =
      this.particles
        .geometry
        .attributes
        .customColor;


    const time =
      performance.now() *
      0.001;


    const frontColor =
      new THREE.Color(
        this.data.frontColor
      );


    const behindColor =
      new THREE.Color(
        this.data.behindColor
      );


    for (
      let i = 0;
      i < colors.count;
      i++
    ) {

      /*
       * Both overlapping particles use
       * the same base drone index.
       */

      const baseIndex =
        i %
        this.layerSize;


      const isBackLayer =
        i <
        this.layerSize;


      const normalColor =
        isBackLayer
          ? behindColor
          : frontColor;


      /* ---------------------------------
         BASE BRIGHTNESS
      --------------------------------- */

      const randomValue =
        Math.sin(
          baseIndex *
          12.9898
        ) *
        43758.5453;


      const normalizedRandom =
        randomValue -
        Math.floor(
          randomValue
        );


      const baseBrightness =
        0.65 +
        normalizedRandom *
        0.35;


      /* ---------------------------------
         FLICKER
      --------------------------------- */

      /*
       * Each drone flickers at a
       * slightly different rhythm.
       *
       * The range is deliberately small
       * so this feels atmospheric rather
       * than like blinking lights.
       */

      const flicker =
        0.94 +
        Math.sin(
          time *
          (
            1.3 +
            normalizedRandom *
            1.7
          ) +
          baseIndex *
          2.17
        ) *
        0.06;


      const brightness =
        baseBrightness *
        flicker;


      colors.setXYZ(

        i,

        normalColor.r *
        brightness,

        normalColor.g *
        brightness,

        normalColor.b *
        brightness

      );

    }


    colors.needsUpdate =
      true;

  }
  /* =========================================
     BIND INTERACTION EVENTS
  ========================================= */

  bindEvents() {

    const canvas =
      this.renderer.domElement;


    canvas.addEventListener(
      'mouseenter',
      () => {

        this.mouseInside =
          true;

      }
    );


    canvas.addEventListener(
      'mouseleave',
      () => {

        this.mouseInside =
          false;


        this.mouse.set(
          -200,
          200
        );


        this.buttom =
          false;


        this.data.ease =
          0.05;

      }
    );


    canvas.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );


    canvas.addEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );


    window.addEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );

  }


  /* =========================================
     UPDATE MOUSE POSITION
  ========================================= */

  updateMousePosition(
    event
  ) {

    const rect =
      this.renderer
        .domElement
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


  /* =========================================
     MOUSE MOVE
  ========================================= */

  onMouseMove(
    event
  ) {

    this.updateMousePosition(
      event
    );

  }


  /* =========================================
     MOUSE DOWN
  ========================================= */

  onMouseDown(
    event
  ) {

    this.updateMousePosition(
      event
    );


    const vector =
      new THREE.Vector3(

        this.mouse.x,

        this.mouse.y,

        0.5

      );


    vector.unproject(
      this.camera
    );


    const direction =
      vector
        .sub(
          this.camera.position
        )
        .normalize();


    const distance =
      -this.camera.position.z /
      direction.z;


    this.currenPosition =
      this.camera
        .position
        .clone()
        .add(

          direction.multiplyScalar(
            distance
          )

        );


    this.buttom =
      true;


    this.holdStartTime =
      performance.now();


    /*
     * Slower return while clicking
     * gives the particles more freedom
     * to move away from the pointer.
     */

    this.data.ease =
      0.01;

  }


  /* =========================================
     MOUSE UP
  ========================================= */

  onMouseUp() {

    this.buttom =
      false;


    this.data.ease =
      0.05;

  }


  /* =========================================
     PARTICLE INTERACTION
  ========================================= */

  updateInteraction() {

    if (
      !this.particles ||
      !this.geometryCopy
    ) {

      return;

    }


    const currentTime =
      performance.now();


    const deltaTime =
      currentTime -
      this.lastHoldUpdate;


    this.lastHoldUpdate =
      currentTime;


    /* -------------------------------------
       CLICK / HOLD STRENGTH
    ------------------------------------- */

    if (
      this.buttom
    ) {

      this.holdProgress +=
        deltaTime /
        3000;

    }

    else {

      this.holdProgress -=
        deltaTime /
        1000;

    }


    this.holdProgress =
      THREE.MathUtils.clamp(

        this.holdProgress,

        0,

        1

      );


    /* -------------------------------------
       FIND MOUSE IN 3D SPACE
    ------------------------------------- */

    this.raycaster.setFromCamera(
      this.mouse,
      this.camera
    );


    const intersects =
      this.raycaster.intersectObject(
        this.planeArea
      );


    const hasMouseIntersection =
      this.mouseInside &&
      intersects.length > 0;


    const mx =
      hasMouseIntersection
        ? intersects[0].point.x
        : 100000;


    const my =
      hasMouseIntersection
        ? intersects[0].point.y
        : 100000;


    /* -------------------------------------
       PARTICLE DATA
    ------------------------------------- */

    const position =
      this.particles
        .geometry
        .attributes
        .position;


    const homePosition =
      this.geometryCopy
        .attributes
        .position;


    const size =
      this.particles
        .geometry
        .attributes
        .size;


    /* -------------------------------------
       UPDATE EACH DRONE
    ------------------------------------- */

    for (
      let i = 0;
      i < position.count;
      i++
    ) {

      const initX =
        homePosition.getX(
          i
        );


      const initY =
        homePosition.getY(
          i
        );


      const initZ =
        homePosition.getZ(
          i
        );


      let px =
        position.getX(
          i
        );


      let py =
        position.getY(
          i
        );


      let pz =
        position.getZ(
          i
        );


      const dx =
        mx -
        px;


      const dy =
        my -
        py;


      const mouseDistance =
        Math.sqrt(

          dx * dx +
          dy * dy

        );


      /*
       * Direction between mouse
       * and particle.
       */

      const angle =
        Math.atan2(
          dy,
          dx
        );


      const isBackLayer =
        i <
        this.layerSize;


      /* ---------------------------------
         CLICK / HOLD REPULSION
      --------------------------------- */

      if (
        this.buttom &&
        mouseDistance <
        this.data.area * 1.35
      ) {

        /*
         * Strongest near the pointer,
         * gradually weaker farther away.
         */

        const proximity =
          1 -
          THREE.MathUtils.clamp(

            mouseDistance /
            (
              this.data.area *
              1.35
            ),

            0,

            1

          );


        const force =
          (
            0.18 +
            this.holdProgress *
            0.42
          ) *
          proximity;


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
          (
            isBackLayer
              ? 0.95
              : 1.25
          );

      }


      /* ---------------------------------
         NORMAL MOUSE REPULSION
      --------------------------------- */

      else if (
        mouseDistance <
        this.data.area
      ) {

        const proximity =
          1 -
          THREE.MathUtils.clamp(

            mouseDistance /
            this.data.area,

            0,

            1

          );


        /*
         * Rear layer barely moves.
         *
         * This creates the subtle depth
         * effect from the original.
         */

        if (
          isBackLayer
        ) {

          const force =
            0.035 *
            proximity;


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
            0.90;

        }


        /*
         * Front layer reacts more
         * noticeably.
         */

        else {

          const force =
            0.16 *
            proximity;


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
            1.18;

        }

      }


      /* ---------------------------------
         NORMAL SIZE
      --------------------------------- */

      else {

        size.array[i] =
          this.data.particleSize *
          (
            isBackLayer
              ? 0.92
              : 1.0
          );

      }


      /* ---------------------------------
         RETURN HOME
      --------------------------------- */

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


      position.setXYZ(

        i,

        px,

        py,

        pz

      );

    }


    position.needsUpdate =
      true;


    size.needsUpdate =
      true;

  }
  /* =========================================
     VISIBLE CAMERA AREA
  ========================================= */

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


  /* =========================================
     RENDER PARTICLE SYSTEM
  ========================================= */

  render() {

    /*
     * Formation is already in its
     * permanent position.
     *
     * We only fade it in once.
     */

    this.updateFade();


    /*
     * Subtle continuous light variation.
     */

    this.updateFlicker();


    /*
     * Mouse + click interaction.
     */

    this.updateInteraction();

  }

}


/* =========================================
   THREE.JS ENVIRONMENT
========================================= */

class SubPageBoxEnvironment {

  constructor() {

    /*
     * Find ONLY the new sub-page
     * animation container.
     */

    this.container =
      document.getElementById(
        'magic2'
      );


    /*
     * If #magic2 is not on this page,
     * stop immediately.
     *
     * This makes the JS safe to load
     * elsewhere without creating errors.
     */

    if (
      !this.container
    ) {

      return;

    }


    this.scene =
      new THREE.Scene();


    this.camera =
      null;


    this.renderer =
      null;


    this.particles =
      null;


    this.particleTexture =
      null;


    this.init();

  }


  /* =========================================
     INITIALIZE
  ========================================= */

  init() {

    const width =
      this.container.clientWidth;


    const height =
      this.container.clientHeight;


    /* -------------------------------------
       CAMERA
    ------------------------------------- */

    this.camera =
      new THREE.PerspectiveCamera(

        65,

        width /
        height,

        1,

        10000

      );


    this.camera.position.z =
      50;


    /* -------------------------------------
       RENDERER
    ------------------------------------- */

    this.renderer =
      new THREE.WebGLRenderer({

        antialias:
          true,

        alpha:
          true

      });


    this.renderer.setPixelRatio(

      Math.min(
        window.devicePixelRatio,
        2
      )

    );


    this.renderer.setSize(

      width,

      height,

      false

    );


    /*
     * Keep the canvas transparent.
     */

    this.renderer.setClearColor(
      0x000000,
      0
    );


    this.container.appendChild(
      this.renderer.domElement
    );


    /* -------------------------------------
       PARTICLE TEXTURE
    ------------------------------------- */

    this.createParticleTexture();


    /* -------------------------------------
       PARTICLE FORMATION
    ------------------------------------- */

    this.particles =
      new SubPageBoxParticles(

        this.scene,

        this.particleTexture,

        this.camera,

        this.renderer

      );


    /* -------------------------------------
       RESIZE
    ------------------------------------- */

    window.addEventListener(

      'resize',

      this.onResize.bind(
        this
      )

    );


    /*
     * ResizeObserver catches changes to
     * the Webflow column itself, even if
     * the browser window hasn't changed.
     */

    if (
      window.ResizeObserver
    ) {

      this.resizeObserver =
        new ResizeObserver(
          () => {

            this.onResize();

          }
        );


      this.resizeObserver.observe(
        this.container
      );

    }


    /* -------------------------------------
       START LOOP
    ------------------------------------- */

    this.animate();

  }


  /* =========================================
     CREATE DRONE TEXTURE
  ========================================= */

  createParticleTexture() {

    /*
     * Generate the small glowing drone
     * texture directly in JavaScript.
     *
     * This means V1 does not require
     * an external PNG asset.
     */

    const textureCanvas =
      document.createElement(
        'canvas'
      );


    textureCanvas.width =
      64;


    textureCanvas.height =
      64;


    const context =
      textureCanvas.getContext(
        '2d'
      );


    const gradient =
      context.createRadialGradient(

        32,
        32,
        0,

        32,
        32,
        32

      );


    gradient.addColorStop(
      0,
      'rgba(255,255,255,1)'
    );


    gradient.addColorStop(
      0.18,
      'rgba(255,255,255,1)'
    );


    gradient.addColorStop(
      0.42,
      'rgba(255,255,255,0.65)'
    );


    gradient.addColorStop(
      0.72,
      'rgba(255,255,255,0.18)'
    );


    gradient.addColorStop(
      1,
      'rgba(255,255,255,0)'
    );


    context.fillStyle =
      gradient;


    context.fillRect(
      0,
      0,
      64,
      64
    );


    this.particleTexture =
      new THREE.CanvasTexture(
        textureCanvas
      );


    this.particleTexture.needsUpdate =
      true;

  }


  /* =========================================
     RESPONSIVE RESIZE
  ========================================= */

  onResize() {

    if (
      !this.container ||
      !this.renderer ||
      !this.camera
    ) {

      return;

    }


    const width =
      this.container.clientWidth;


    const height =
      this.container.clientHeight;


    /*
     * Avoid attempting to render a
     * zero-size Webflow element.
     */

    if (
      width === 0 ||
      height === 0
    ) {

      return;

    }


    this.camera.aspect =
      width /
      height;


    this.camera.updateProjectionMatrix();


    this.renderer.setSize(

      width,

      height,

      false

    );

  }


  /* =========================================
     ANIMATION LOOP
  ========================================= */

  animate() {

    requestAnimationFrame(

      this.animate.bind(
        this
      )

    );


    if (
      this.particles
    ) {

      this.particles.render();

    }


    this.renderer.render(

      this.scene,

      this.camera

    );

  }

}


/* =========================================
   START SUB-PAGE ANIMATION
========================================= */

function startSubPageBoxAnimation() {

  const container =
    document.getElementById(
      'magic2'
    );


  if (
    !container
  ) {

    return;

  }


  /*
   * Prevent accidental duplicate
   * initialization.
   */

  if (
    container.dataset
      .hitsAnimationLoaded ===
    'true'
  ) {

    return;

  }


  container.dataset
    .hitsAnimationLoaded =
    'true';


  new SubPageBoxEnvironment();

}


/* =========================================
   WEBFLOW / DOM READY
========================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(

    'DOMContentLoaded',

    startSubPageBoxAnimation

  );

}

else {

  startSubPageBoxAnimation();

}
