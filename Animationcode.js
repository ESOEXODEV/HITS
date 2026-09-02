<script type="x-shader/x-vertex" id="vertexshader">
  attribute float size;
  attribute vec3 customColor;
  attribute float customAlpha;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = customColor;
    vAlpha = customAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
</script>

<script type="x-shader/x-fragment" id="fragmentshader">
 uniform vec3 color;
  uniform sampler2D pointTexture;
  uniform float opacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {

    vec2 center = gl_PointCoord - vec2(0.5);
    float distanceFromCenter = length(center);

    /*
     * Original particle texture
     */
    vec4 textureColor =
      texture2D(
        pointTexture,
        gl_PointCoord
      );

    /*
     * Very subtle outer haze
     */
    float halo =
      smoothstep(
        0.50,
        0.15,
        distanceFromCenter
      ) * 0.20;

    /*
     * Keep the original bright dot
     * and add the halo around it.
     */
    float particleAlpha =
      max(
        textureColor.a,
        halo
      );

    gl_FragColor =
      vec4(
        color * vColor,
        particleAlpha * opacity * vAlpha
      );
  }
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r125/three.min.js"></script>

<script>

window.AnimateTexts = [
  'FORGET\nADS',
  'DREAM\nBIG',
  'TAKE\nFLIGHT',
  'JUST\nLOOK UP'
];

window.AnimateTextIndex = 0;
window.AnimateText = window.AnimateTexts[0];


class CreateParticles {

  constructor(scene, font, particleImg, camera, renderer) {

    this.scene = scene;
    this.font = font;
    this.particleImg = particleImg;
    this.camera = camera;
    this.renderer = renderer;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-200, 200);
    this.colorChange = new THREE.Color();

this.buttom = false;

this.holdProgress = 0;

this.lastHoldUpdate =
  performance.now();

this.data = {

      text: window.AnimateText,

      textColor: 0xffffff,
      
amount: 120,

particleSize: 2.5,

      textSize: 16,

      area: 50,

      ease: .05,

      /*
       * TIMING
       *
       * 8500ms total cycle
       * 2500ms transition
       * ≈ 6 seconds settled
       */

      wordDuration: 9000,

      morphDuration: 2475,

      morphScatter: 10,

      /*
       * COLORS
       */

      behindColor: 0xf0c36e,

      frontColor: 0xf0c36e,

    };


this.isMorphing = false;

this.morphStart = 0;

this.startPositions = null;

this.targetPositions = null;

this.randomDirections = null;


/*
 * FINAL CTA ARROW
 *
 * After JUST LOOK UP finishes forming,
 * a small drone arrow fades into the
 * upper-right and remains there.
 *
 * The arrow is generated from the uploaded
 * SVG's three path segments, so it does not
 * require the font system.
 */

this.finalArrow = null;

this.finalArrowRevealStart = null;

this.finalArrowDelay = 350;

this.finalArrowFadeDuration = 650;


/*
 * ONE-TIME OPENING DRONE INTRO
 *
 * 0 - 3.5 sec:
 * hidden behind the page preload
 *
 * 3.5 - 6.5 sec:
 * drones rise into layered rows,
 * then settle into the first phrase
 *
 * After that:
 * the existing word loop takes over
 */

this.introDelay = 0;

/*
 * INTRO TIMING
 *
 * 2.85 sec = complete layered grid loop
 *            behind the transparent preload
 * 1.25 sec = fully dark pause
 * 0.45 sec = first phrase fades on
 */

this.introGridDuration = 2850;

this.introGridHold = 1250;

this.introFormDuration = 450;

this.introCreatedAt =
  performance.now();

this.introComplete = false;

this.introStartPositions = null;

this.introGridPositions = null;

this.introTextPositions = null;

this.introScatterDirections = null;


this.setup();

this.bindEvents();

  }



  setup() {

    const geometry =
      new THREE.PlaneGeometry(

        this.visibleWidthAtZDepth(
          100,
          this.camera
        ),

        this.visibleHeightAtZDepth(
          100,
          this.camera
        )

      );


    const material =
      new THREE.MeshBasicMaterial({

        color: 0x00ff00,

        transparent: true

      });


    this.planeArea =
      new THREE.Mesh(
        geometry,
        material
      );


    this.planeArea.visible = false;


    this.createText();

    this.createFinalArrow();

  }



  bindEvents() {

    document.addEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );


    document.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );


    document.addEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );

  }



  startWordCycle() {

    /*
     * Play the phrase sequence ONCE.
     *
     * FORGET ADS
     * DREAM BIG
     * TAKE FLIGHT
     * JUST LOOK UP
     *
     * The sequence stops permanently on
     * JUST LOOK UP instead of looping.
     */

    const advanceWord = () => {

      if (
        window.AnimateTextIndex >=
        window.AnimateTexts.length - 1
      ) {

        return;

      }


      window.AnimateTextIndex += 1;


      const nextText =
        window.AnimateTexts[
          window.AnimateTextIndex
        ];


      this.morphToText(
        nextText
      );


      if (
        window.AnimateTextIndex <
        window.AnimateTexts.length - 1
      ) {

        setTimeout(
          advanceWord,
          this.data.wordDuration
        );

      }

    };


    setTimeout(
      advanceWord,
      this.data.wordDuration
    );

  }



  morphToText(text) {

    /*
     * Ask getTextPoints() for exactly one
     * complete layer's worth of uniformly
     * distributed points.
     */

    const newPoints =
      this.getTextPoints(
        text,
        this.wordLayerSize
      );


    const current =
      this.particles
        .geometry
        .attributes
        .position;


    const count =
      current.count;


    /*
     * Normalize ONE complete word layer,
     * then duplicate those exact target
     * positions for the rear/front copies.
     */

    const layerCount =
      this.wordLayerSize;


    /*
     * getTextPoints already returned the
     * exact count with contour-aware spacing,
     * so no second normalization pass is
     * needed here.
     */

    const normalizedLayer =
      newPoints;


    this.startPositions =
      new Float32Array(
        count * 3
      );


    this.targetPositions =
      new Float32Array(
        count * 3
      );


    this.randomDirections =
      new Float32Array(
        count * 2
      );


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const i3 = i * 3;
      const i2 = i * 2;


      this.startPositions[i3] =
        current.getX(i);

      this.startPositions[i3 + 1] =
        current.getY(i);

      this.startPositions[i3 + 2] =
        current.getZ(i);


      const layerIndex =
        i % layerCount;


      this.targetPositions[i3] =
        normalizedLayer[layerIndex].x;

      this.targetPositions[i3 + 1] =
        normalizedLayer[layerIndex].y;

      this.targetPositions[i3 + 2] =
        normalizedLayer[layerIndex].z;


      const angle =
        Math.random() *
        Math.PI *
        2;


      this.randomDirections[i2] =
        Math.cos(angle);


      this.randomDirections[i2 + 1] =
        Math.sin(angle);

    }


    this.data.text = text;


    this.morphStart =
      performance.now();


    this.isMorphing = true;

  }



getTextPoints(
  text,
  desiredCount = null
) {

  /*
   * UNIFORM WORD SAMPLING
   *
   * The old system gave every contour roughly
   * the same number of drones, regardless of
   * how long that contour actually was.
   *
   * That could make one section of a letter
   * extremely dense while another section had
   * a large visible gap.
   *
   * This version measures every contour and
   * distributes the available drones according
   * to actual contour length.
   *
   * Result:
   * - long strokes receive more drones
   * - short strokes receive fewer drones
   * - spacing stays much more consistent
   * - disconnected letters do not steal density
   *   from one another during morphs
   */

  const lines =
    text.split('\n');


  const scale =
    this.data.textSize /
    this.font.data.resolution;


  const lineHeight =
    (
      this.font.data.boundingBox.yMax -
      this.font.data.boundingBox.yMin +
      this.font.data.underlineThickness
    ) *
    scale;


  const contours = [];


  lines.forEach(
    (line, lineIndex) => {

      const shapes =
        this.font.generateShapes(
          line,
          this.data.textSize
        );


      const geometry =
        new THREE.ShapeGeometry(
          shapes
        );


      geometry.computeBoundingBox();


      const xMid =
        -0.5 *
        (
          geometry.boundingBox.max.x +
          geometry.boundingBox.min.x
        );


      const lineYOffset =
        -lineIndex *
        lineHeight;


      shapes.forEach(
        shape => {

          contours.push({
            path: shape,
            xMid,
            lineYOffset,
            isHole: false
          });


          if (
            shape.holes &&
            shape.holes.length
          ) {

            shape.holes.forEach(
              hole => {

                contours.push({
                  path: hole,
                  xMid,
                  lineYOffset,
                  isHole: true
                });

              }
            );

          }

        }
      );

    }
  );


  if (
    contours.length === 0
  ) {

    return [];

  }


  /*
   * Measure every contour at high enough
   * resolution to estimate its true length.
   */

  let totalLength = 0;


  contours.forEach(
    contour => {

      const measurePoints =
        contour.path.getSpacedPoints(
          Math.max(
            80,
            Math.round(
              this.data.amount * 1.5
            )
          )
        );


      let length = 0;


      for (
        let i = 1;
        i < measurePoints.length;
        i++
      ) {

        const dx =
          measurePoints[i].x -
          measurePoints[i - 1].x;


        const dy =
          measurePoints[i].y -
          measurePoints[i - 1].y;


        length +=
          Math.sqrt(
            dx * dx +
            dy * dy
          );

      }


      contour.length =
        Math.max(
          length,
          0.0001
        );


      totalLength +=
        contour.length;

    }
  );


  /*
   * Keep approximately the same overall
   * particle count as the original system
   * when creating the first word.
   *
   * During later morphs, desiredCount is
   * supplied so every phrase uses exactly
   * the same number of drones.
   */

  let targetCount;


  if (
    desiredCount !== null
  ) {

    targetCount =
      Math.max(
        desiredCount,
        contours.length * 4
      );

  }

  else {

    targetCount =
      contours.reduce(
        (sum, contour) => {

          return sum +
            (
              contour.isHole
              ?
              Math.round(
                this.data.amount / 2
              )
              :
              this.data.amount
            );

        },
        0
      );

  }


  /*
   * Guarantee a small baseline population
   * on every contour, then distribute all
   * remaining drones by contour length.
   */

  const minimumPerContour =
    6;


  const guaranteed =
    minimumPerContour *
    contours.length;


  const distributable =
    Math.max(
      targetCount -
      guaranteed,
      0
    );


  let assigned =
    0;


  contours.forEach(
    contour => {

      const exactShare =
        distributable *
        (
          contour.length /
          totalLength
        );


      contour.count =
        minimumPerContour +
        Math.floor(
          exactShare
        );


      contour.remainder =
        exactShare -
        Math.floor(
          exactShare
        );


      assigned +=
        contour.count;

    }
  );


  /*
   * Rounding can leave a few drones
   * unassigned. Give those to contours
   * with the largest fractional shares.
   */

  let remaining =
    targetCount -
    assigned;


  const remainderOrder =
    [...contours].sort(
      (a, b) =>
        b.remainder -
        a.remainder
    );


  let remainderIndex = 0;


  while (
    remaining > 0
  ) {

    remainderOrder[
      remainderIndex %
      remainderOrder.length
    ].count++;


    remainderIndex++;
    remaining--;

  }


  const thePoints = [];


  contours.forEach(
    contour => {

      const divisions =
        Math.max(
          contour.count - 1,
          1
        );


      let points =
        contour.path.getSpacedPoints(
          divisions
        );


      /*
       * getSpacedPoints can include one
       * extra endpoint depending on the
       * contour. Enforce the exact count.
       */

      if (
        points.length >
        contour.count
      ) {

        points =
          points.slice(
            0,
            contour.count
          );

      }


      while (
        points.length <
        contour.count
      ) {

        points.push(
          points[
            points.length - 1
          ].clone()
        );

      }


      points.forEach(
        element => {

          thePoints.push({

            x:
              element.x +
              contour.xMid,

            y:
              element.y +
              contour.lineYOffset,

            z: 0

          });

        }
      );

    }
  );


  /*
   * Preserve the vertical positioning
   * used by the existing animation.
   */

  let minY = Infinity;
  let maxY = -Infinity;


  thePoints.forEach(
    point => {

      minY =
        Math.min(
          minY,
          point.y
        );


      maxY =
        Math.max(
          maxY,
          point.y
        );

    }
  );


  const yMid =
    (
      maxY -
      minY
    ) /
    2.85;


  thePoints.forEach(
    point => {

      point.y +=
        yMid;

    }
  );


  return thePoints;

}

normalizePoints(
  points,
  desiredCount
) {

  const result = [];


  if (
    !points ||
    points.length === 0
  ) {

    return result;

  }


  if (
    points.length >=
    desiredCount
  ) {

    for (
      let i = 0;
      i < desiredCount;
      i++
    ) {

      const index =
        Math.floor(
          (
            i /
            desiredCount
          ) *
          points.length
        );


      result.push(
        points[index]
      );

    }


    return result;

  }


  for (
    let i = 0;
    i < desiredCount;
    i++
  ) {

    const index =
      Math.floor(
        (
          i /
          desiredCount
        ) *
        points.length
      );


    result.push(
      points[
        Math.min(
          index,
          points.length - 1
        )
      ]
    );

  }


  return result;

}


updateMorph() {

  if (!this.isMorphing) return;


  const now =
    performance.now();


  let progress =
    (
      now -
      this.morphStart
    ) /
    this.data.morphDuration;


  progress =
    Math.min(
      progress,
      1
    );


  /*
   * WORD TRANSITION
   *
   * 0.00 - 0.10
   * Current word scatters outward
   * while fading completely away.
   *
   * 0.10 - 0.655556
   * Completely dark for exactly
   * 1.25 seconds. The particles are
   * already sitting in the next
   * word's finished positions.
   *
   * 0.655556 - 1.00
   * Next word softly fades in.
   * A very small reverse scatter settles
   * during the first instant of the fade.
   */

  /*
   * Give the outgoing drones more time
   * to visibly scatter before vanishing.
   *
   * morphDuration = 2475ms
   * fadeOutEnd = ~18.18% = ~450ms
   * full blackout remains ~1250ms
   * incoming fade remains ~775ms
   */

  const fadeOutEnd =
    0.181818;


  const fadeInStart =
    0.686869;


  let opacity;


  if (
    progress < fadeOutEnd
  ) {

    const fadeProgress =
      progress /
      fadeOutEnd;


    opacity =
      1 - fadeProgress;

  }

  else if (
    progress >= fadeInStart
  ) {

    const fadeProgress =
      (
        progress -
        fadeInStart
      ) /
      (
        1 -
        fadeInStart
      );


    /*
     * Soft fade-in. The position loop
     * below adds only a tiny initial
     * reverse-scatter movement.
     */

    opacity =
      fadeProgress *
      fadeProgress *
      (
        3 -
        2 * fadeProgress
      );

  }

  else {

    opacity = 0;

  }


  this.particles.material.uniforms.opacity.value =
    opacity;


  const pos =
    this.particles
      .geometry
      .attributes
      .position;


  /*
   * Scatter ONLY the outgoing word.
   */

  const exitProgress =
    THREE.MathUtils.clamp(
      progress /
      fadeOutEnd,
      0,
      1
    );


  const scatter =
    Math.pow(
      exitProgress,
      1.35
    ) *
    this.data.morphScatter;


  for (
    let i = 0;
    i < pos.count;
    i++
  ) {

    const i3 = i * 3;
    const i2 = i * 2;


    if (
      progress < fadeOutEnd
    ) {

      /*
       * Visible outgoing word:
       * scatter while fading out.
       */

      pos.setXYZ(

        i,

        this.startPositions[i3] +
          this.randomDirections[i2] *
          scatter,

        this.startPositions[i3 + 1] +
          this.randomDirections[i2 + 1] *
          scatter,

        0

      );

    }

    else {

      /*
       * Keep the next word fully assembled
       * during the blackout.
       *
       * At the very beginning of the
       * fade-in, add a tiny reverse scatter
       * that settles almost immediately.
       */

      let incomingX =
        this.targetPositions[i3];

      let incomingY =
        this.targetPositions[i3 + 1];


      if (
        progress >= fadeInStart
      ) {

        const fadeProgress =
          (
            progress -
            fadeInStart
          ) /
          (
            1 -
            fadeInStart
          );


        /*
         * Only the first 18% of the fade-in
         * contains movement.
         */

        const reverseScatterEnd =
          0.42;


        const reverseScatterProgress =
          THREE.MathUtils.clamp(
            fadeProgress /
            reverseScatterEnd,
            0,
            1
          );


        const reverseScatterStrength =
          Math.pow(
            1 -
            reverseScatterProgress,
            2
          );


        const reverseScatter =
          4.0 *
          reverseScatterStrength;


        incomingX +=
          this.randomDirections[i2] *
          reverseScatter;

        incomingY +=
          this.randomDirections[i2 + 1] *
          reverseScatter;

      }


      pos.setXYZ(

        i,

        incomingX,

        incomingY,

        0

      );

    }

  }


  pos.needsUpdate = true;


  if (
    progress >= 1
  ) {

    /*
     * New word becomes the home
     * position for mouse interaction.
     */

    this.geometryCopy.copy(
      this.particles.geometry
    );


    this.particles.material.uniforms.opacity.value =
      1.0;


    this.isMorphing = false;


    /*
     * JUST LOOK UP is the final phrase.
     * Once it is fully assembled, begin
     * the delayed CTA-arrow reveal.
     */

    if (
      window.AnimateTextIndex ===
      window.AnimateTexts.length - 1 &&
      this.finalArrowRevealStart === null
    ) {

      this.finalArrowRevealStart =
        performance.now();

    }

  }

}


  /*
   * Build the uploaded top-right SVG arrow
   * as its own small two-layer drone shape.
   *
   * SVG source path:
   * M4.343 15.657 L15.657 4.343
   * M15.657 4.343 V14.243
   * M15.657 4.343 H5.757
   */

  createFinalArrow() {

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


    /*
     * Arrow size and placement.
     *
     * Keep it small and tucked toward the
     * upper-right so it visually points
     * toward the Webflow menu.
     */

    const arrowSize =
      Math.min(
        visibleWidth,
        visibleHeight
      ) * 0.115;


    const centerX =
      visibleWidth * 0.34;


    const centerY =
      visibleHeight * 0.32;


    const svgMin =
      4.343;


    const svgMax =
      15.657;


    const svgSpan =
      svgMax - svgMin;


    const convertPoint = (
      svgX,
      svgY
    ) => {

      const normalizedX =
        (
          svgX -
          svgMin
        ) /
        svgSpan -
        0.5;


      /*
       * SVG Y increases downward.
       * Three.js Y increases upward.
       */

      const normalizedY =
        -(
          (
            svgY -
            svgMin
          ) /
          svgSpan -
          0.5
        );


      return new THREE.Vector3(

        centerX +
          normalizedX *
          arrowSize,

        centerY +
          normalizedY *
          arrowSize,

        0

      );

    };


    const segments = [

      /*
       * Long diagonal stem.
       */

      {
        from: [4.343, 15.657],
        to: [15.657, 4.343],
        count: 24
      },

      /*
       * Arrowhead vertical leg.
       */

      {
        from: [15.657, 4.343],
        to: [15.657, 14.243],
        count: 18
      },

      /*
       * Arrowhead horizontal leg.
       */

      {
        from: [15.657, 4.343],
        to: [5.757, 4.343],
        count: 18
      }

    ];


    const basePoints = [];


    segments.forEach(
      segment => {

        for (
          let i = 0;
          i < segment.count;
          i++
        ) {

          const t =
            segment.count === 1
            ? 0
            : i /
              (
                segment.count - 1
              );


          const svgX =
            THREE.MathUtils.lerp(
              segment.from[0],
              segment.to[0],
              t
            );


          const svgY =
            THREE.MathUtils.lerp(
              segment.from[1],
              segment.to[1],
              t
            );


          basePoints.push(
            convertPoint(
              svgX,
              svgY
            )
          );

        }

      }
    );


    /*
     * Match the word treatment:
     * two complete overlapping layers.
     */

    const arrowPoints = [
      ...basePoints.map(
        point =>
          point.clone()
      ),
      ...basePoints.map(
        point =>
          point.clone()
      )
    ];


    const colors = [];

    const sizes = [];

    const alphas = [];


    const arrowColor =
      new THREE.Color(
        this.data.frontColor
      );


    arrowPoints.forEach(
      (point, i) => {

        const layerIndex =
          i % basePoints.length;


        const randomValue =
          Math.sin(
            layerIndex * 12.9898
          ) *
          43758.5453;


        const normalizedRandom =
          randomValue -
          Math.floor(
            randomValue
          );


        /*
         * Slightly quieter than the final word.
         */

        const brightness =
          0.52 +
          normalizedRandom * 0.14;


        colors.push(
          arrowColor.r * brightness,
          arrowColor.g * brightness,
          arrowColor.b * brightness
        );


        const sizeRandomValue =
          Math.sin(
            layerIndex * 78.233
          ) *
          43758.5453;


        const normalizedSizeRandom =
          sizeRandomValue -
          Math.floor(
            sizeRandomValue
          );


        const sizeVariation =
          0.85 +
          normalizedSizeRandom * 0.30;


        sizes.push(
          this.data.particleSize *
          0.92 *
          sizeVariation
        );


        alphas.push(1);

      }
    );


    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(
          arrowPoints
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


    const material =
      new THREE.ShaderMaterial({

        uniforms: {

          color: {
            value:
              new THREE.Color(
                this.data.textColor
              )
          },

          pointTexture: {
            value:
              this.particleImg
          },

          opacity: {
            value: 0
          }

        },

        vertexShader:
          document
            .getElementById(
              'vertexshader'
            )
            .textContent,

        fragmentShader:
          document
            .getElementById(
              'fragmentshader'
            )
            .textContent,

        blending:
          THREE.AdditiveBlending,

        depthTest: false,

        transparent: true

      });


    this.finalArrow =
      new THREE.Points(
        geometry,
        material
      );


    this.scene.add(
      this.finalArrow
    );

  }



  updateFinalArrow() {

    if (
      !this.finalArrow ||
      this.finalArrowRevealStart === null
    ) {

      return;

    }


    const elapsed =
      performance.now() -
      this.finalArrowRevealStart;


    if (
      elapsed <
      this.finalArrowDelay
    ) {

      this.finalArrow.material
        .uniforms.opacity.value =
        0;

      return;

    }


    const fadeProgress =
      THREE.MathUtils.clamp(

        (
          elapsed -
          this.finalArrowDelay
        ) /
        this.finalArrowFadeDuration,

        0,

        1

      );


    const smoothFade =
      fadeProgress *
      fadeProgress *
      (
        3 -
        2 * fadeProgress
      );


    this.finalArrow.material
      .uniforms.opacity.value =
      smoothFade;

  }


  onMouseDown(event) {

    this.mouse.x =
      (
        event.clientX /
        window.innerWidth
      ) *
      2 -
      1;


    this.mouse.y =
      -(
        event.clientY /
        window.innerHeight
      ) *
      2 +
      1;


    const vector =
      new THREE.Vector3(
        this.mouse.x,
        this.mouse.y,
        .5
      );


    vector.unproject(
      this.camera
    );


    const dir =
      vector
        .sub(
          this.camera.position
        )
        .normalize();


    const distance =
      -
      this.camera.position.z /
      dir.z;


    this.currenPosition =
      this.camera
        .position
        .clone()
        .add(
          dir.multiplyScalar(
            distance
          )
        );


this.buttom = true;

this.holdStartTime =
  performance.now();

this.data.ease = .01;

  }



  onMouseUp() {

    this.buttom = false;

    this.data.ease = .05;

  }



  onMouseMove(event) {

    this.mouse.x =
      (
        event.clientX /
        window.innerWidth
      ) *
      2 -
      1;


    this.mouse.y =
      -(
        event.clientY /
        window.innerHeight
      ) *
      2 +
      1;

  }



render() {

  /*
   * ONE-TIME OPENING DRONE INTRO
   *
   * The grid behaves like a wave:
   *
   * bottom rows fade in first,
   * upper rows follow,
   * then the bottom rows are already
   * fading away in place while
   * the final upper rows are arriving.
   *
   * Once every row is gone, the drones
   * reposition invisibly and the first
   * phrase fades on already assembled.
   */

  if (
    !this.introComplete
  ) {

    const now =
      performance.now();

    const elapsed =
      now -
      this.introCreatedAt;


    /*
     * The Webflow preload is transparent,
     * so the grid begins immediately
     * behind it.
     *
     * introDelay is intentionally 0.
     */

    if (
      elapsed <
      this.introDelay
    ) {

      return;

    }


    const introElapsed =
      elapsed -
      this.introDelay;


    const pos =
      this.particles.geometry
        .attributes.position;


    const alpha =
      this.particles.geometry
        .attributes.customAlpha;


    /*
     * PHASE 1:
     * overlapping reveal + disappearance.
     */

    if (
      introElapsed <
      this.introGridDuration
    ) {

      const phaseProgress =
        THREE.MathUtils.clamp(
          introElapsed /
          this.introGridDuration,
          0,
          1
        );


      for (
        let i = 0;
        i < pos.count;
        i++
      ) {

        const i3 =
          i * 3;

        const i2 =
          i * 2;


        const row =
          Math.floor(
            i / 3
          ) % 8;


        /*
         * Bottom row starts first.
         * Top row starts last.
         */

        const revealDelay =
          (
            (7 - row) / 7
          ) * 0.34;


        const revealProgress =
          THREE.MathUtils.clamp(
            (
              phaseProgress -
              revealDelay
            ) /
            (
              1 -
              revealDelay
            ),
            0,
            1
          );


        const easedReveal =
          revealProgress *
          revealProgress *
          revealProgress *
          (
            revealProgress *
            (
              revealProgress * 6 -
              15
            )
            +
            10
          );


        /*
         * Each row begins exiting before
         * the full grid has finished.
         *
         * Bottom begins around 55%.
         * Top does not begin until ~90%.
         */

        const exitStart =
          0.55 +
          (
            (7 - row) / 7
          ) * 0.35;


        const exitProgress =
          THREE.MathUtils.clamp(
            (
              phaseProgress -
              exitStart
            ) /
            0.18,
            0,
            1
          );


        const easedExit =
          exitProgress *
          exitProgress *
          (
            3 -
            2 * exitProgress
          );


        /*
         * Settle only a short distance
         * into the layered grid.
         */

        const settledX =
          THREE.MathUtils.lerp(
            this.introStartPositions[i3],
            this.introGridPositions[i3],
            easedReveal
          );


        const settledY =
          THREE.MathUtils.lerp(
            this.introStartPositions[i3 + 1],
            this.introGridPositions[i3 + 1],
            easedReveal
          );


        const settledZ =
          THREE.MathUtils.lerp(
            this.introStartPositions[i3 + 2],
            this.introGridPositions[i3 + 2],
            easedReveal
          );


        /*
         * As a row exits, keep every drone
         * locked in its settled grid position
         * and simply fade the row away.
         */

        pos.array[i3] =
          settledX;


        pos.array[i3 + 1] =
          settledY;


        pos.array[i3 + 2] =
          settledZ;


        /*
         * Fade in quickly during settling,
         * then fade out in place.
         */

        const fadeIn =
          THREE.MathUtils.smoothstep(
            revealProgress,
            0.02,
            0.48
          );


        const fadeOut =
          1 -
          easedExit;


        /*
         * The word now contains two complete
         * particle copies. For the preload grid,
         * display only one copy so its density
         * remains essentially unchanged.
         */

        alpha.array[i] =
          i < this.wordLayerSize
          ?
          fadeIn * fadeOut
          :
          0;

      }


      pos.needsUpdate =
        true;

      alpha.needsUpdate =
        true;

      return;

    }


    /*
     * PHASE 2:
     * everything is completely dark.
     * Reposition invisibly into the
     * first word formation.
     */

    if (
      introElapsed <
      this.introGridDuration +
      this.introGridHold
    ) {

      pos.array.set(
        this.introTextPositions
      );


      for (
        let i = 0;
        i < alpha.count;
        i++
      ) {

        alpha.array[i] =
          0;

      }


      pos.needsUpdate =
        true;

      alpha.needsUpdate =
        true;

      return;

    }


    /*
     * PHASE 3:
     * first phrase appears already formed.
     */

    const formElapsed =
      introElapsed -
      this.introGridDuration -
      this.introGridHold;


    const formProgress =
      THREE.MathUtils.clamp(
        formElapsed /
        this.introFormDuration,
        0,
        1
      );


    const smoothReveal =
      formProgress *
      formProgress *
      (
        3 -
        2 * formProgress
      );


    pos.array.set(
      this.introTextPositions
    );


    for (
      let i = 0;
      i < alpha.count;
      i++
    ) {

      alpha.array[i] =
        smoothReveal;

    }


    pos.needsUpdate =
      true;

    alpha.needsUpdate =
      true;


    if (
      formProgress >= 1
    ) {

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


      this.geometryCopy.copy(
        this.particles.geometry
      );


      this.introComplete =
        true;


      this.lastHoldUpdate =
        performance.now();


      this.startWordCycle();

    }


    return;

  }


  /*
   * During a word transition,
   * the morph animation takes control.
   */

  if (this.isMorphing) {

    this.updateMorph();

    return;

  }

  /*
   * If the final phrase has completed,
   * softly reveal and then hold the
   * upper-right CTA arrow.
   */

  this.updateFinalArrow();


  /*
   * Mouse hold color transition.
   *
   * Hold = 3 seconds to white
   * Release = 1 second back to gold
   */

  const currentTime =
    performance.now();

  const deltaTime =
    currentTime -
    this.lastHoldUpdate;

  this.lastHoldUpdate =
    currentTime;

  if (this.buttom) {

    this.holdProgress +=
      deltaTime / 3000;

  }

  else {

    this.holdProgress -=
      deltaTime / 1000;

  }

  this.holdProgress =
    THREE.MathUtils.clamp(
      this.holdProgress,
      0,
      1
    );


    this.raycaster.setFromCamera(
      this.mouse,
      this.camera
    );


    const intersects =
      this.raycaster.intersectObject(
        this.planeArea
      );


    /*
     * Always update the particles so the
     * drone flicker continues even when
     * the mouse is outside the animation.
     *
     * Mouse interaction itself still only
     * applies when the raycaster actually
     * hits the interaction plane.
     */

    {

      const pos =
        this.particles
          .geometry
          .attributes
          .position;


      const copy =
        this.geometryCopy
          .attributes
          .position;


      const colors =
        this.particles
          .geometry
          .attributes
          .customColor;


      const size =
        this.particles
          .geometry
          .attributes
          .size;


      const hasMouseIntersection =
        intersects.length > 0;


      const mx =
        hasMouseIntersection
        ? intersects[0].point.x
        : 100000;


      const my =
        hasMouseIntersection
        ? intersects[0].point.y
        : 100000;


      /*
       * Settled/front word color
       */

      const frontColor =
        new THREE.Color(
          this.data.frontColor
        );


      for (
        let i = 0,
        l = pos.count;
        i < l;
        i++
      ) {

        const initX =
          copy.getX(i);


        const initY =
          copy.getY(i);


        const initZ =
          copy.getZ(i);


        let px =
          pos.getX(i);


        let py =
          pos.getY(i);


        let pz =
          pos.getZ(i);


        /*
         * Keep settled particles gold
         */

/*
 * Fixed brightness variation
 * for each individual drone.
 */

/*
 * The front/back word layers are complete
 * copies occupying the same letter points.
 *
 * Use the SAME flicker seed for matching
 * particles in both layers. If each copy
 * flickers independently, their brightness
 * averages together and the flicker becomes
 * almost invisible.
 */

const flickerIndex =
  i % this.wordLayerSize;


const randomValue =
  Math.sin(
    flickerIndex * 12.9898
  ) *
  43758.5453;


const normalizedRandom =
  randomValue -
  Math.floor(randomValue);


/*
 * The front/back word layers now overlap,
 * which visually compounds their brightness.
 *
 * Lower the individual drone brightness so
 * the combined word is closer to the original
 * single-layer appearance.
 */

const baseBrightness =
  0.62 +
  normalizedRandom * 0.16;


/*
 * Subtle animated drone flicker.
 * Matching front/back particles flicker
 * together so the effect remains visible
 * even while the two layers overlap.
 */

const time =
  performance.now();


const flicker =
  0.90 +
  Math.sin(
    time * 0.010 +
    flickerIndex * 1.73
  ) * 0.06 +
  Math.sin(
    time * 0.023 +
    flickerIndex * 4.17
  ) * 0.04;


const brightness =
  baseBrightness *
  flicker;


/*
 * Restore the original
 * two-layer color treatment.
 */

const behindColor =
  new THREE.Color(
    this.data.behindColor
  );

/*
 * WORD DEPTH LAYERS
 *
 * First complete copy = rear layer.
 * Second complete copy = front layer.
 */

const isBackLayer =
  i < this.wordLayerSize;

const normalColor =
  isBackLayer
  ? behindColor
  : frontColor;


/*
 * Holding the mouse no longer changes
 * the drones to white.
 */

const particleColor =
  normalColor;


colors.setXYZ(
  i,
  particleColor.r * brightness,
  particleColor.g * brightness,
  particleColor.b * brightness
);


const sizeRandomValue =
  Math.sin(
    i * 78.233
  ) *
  43758.5453;

const normalizedSizeRandom =
  sizeRandomValue -
  Math.floor(
    sizeRandomValue
  );

const sizeVariation =
  0.85 +
  normalizedSizeRandom * 0.30;


size.array[i] =
  this.data.particleSize *
  sizeVariation;


        let dx =
          mx - px;


        let dy =
          my - py;


        const mouseDistance =
          this.distance(
            mx,
            my,
            px,
            py
          );


        let d =
          dx * dx +
          dy * dy;


        /*
         * Avoid division by zero
         */

        d =
          Math.max(
            d,
            0.001
          );


        const f =
          -
          this.data.area /
          d;


        if (this.buttom) {

          const t =
            Math.atan2(
              dy,
              dx
            );


          px -=
            f *
            Math.cos(t);


          py -=
            f *
            Math.sin(t);

        }

        else if (
          mouseDistance <
          this.data.area
        ) {

if (
  i < this.wordLayerSize
) {

  const t =
    Math.atan2(
      dy,
      dx
    );


  px -=
    .03 *
    Math.cos(t);


  py -=
    .03 *
    Math.sin(t);


  size.array[i] =
    this.data.particleSize /
    1.2;

}

          else {

            const t =
              Math.atan2(
                dy,
                dx
              );


            px +=
              f *
              Math.cos(t);


            py +=
              f *
              Math.sin(t);


            size.array[i] =
              this.data.particleSize *
              1.3;

          }

        }


        /*
         * Return particles home
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


      pos.needsUpdate = true;

      colors.needsUpdate = true;

      size.needsUpdate = true;

    }

  }



  createText() {

    const points =
      this.getTextPoints(
        this.data.text
      );


    let colors = [];

    let sizes = [];

    let alphas = [];


    const frontColor =
      new THREE.Color(
        this.data.frontColor
      );


    /*
     * Build TWO COMPLETE copies of the word.
     *
     * Previously the rear/front layers split
     * one point set between them, so each
     * individual layer contained visible gaps.
     *
     * Now:
     *   first half  = complete rear word
     *   second half = complete front word
     *
     * When they overlap, the word still reads
     * normally. When interaction separates them,
     * BOTH layers remain complete letters.
     */

    const baseVectorPoints =
      points.map(
        point =>
          new THREE.Vector3(
            point.x,
            point.y,
            point.z
          )
      );


    this.wordLayerSize =
      baseVectorPoints.length;


    let vectorPoints = [
      ...baseVectorPoints.map(
        point =>
          point.clone()
      ),
      ...baseVectorPoints.map(
        point =>
          point.clone()
      )
    ];


vectorPoints.forEach((point, i) => {

/*
 * Give every drone a fixed
 * brightness variation.
 *
 * 65% - 100% brightness.
 */

const randomValue =
  Math.sin(i * 12.9898) *
  43758.5453;

const normalizedRandom =
  randomValue -
  Math.floor(randomValue);

const brightness =
  0.65 +
  normalizedRandom * 0.35;


const behindColor =
  new THREE.Color(
    this.data.behindColor
  );

/*
 * WORD DEPTH LAYERS
 *
 * Each layer is now a COMPLETE copy
 * of the letter formation.
 */

const isBackLayer =
  i < this.wordLayerSize;

const normalColor =
  isBackLayer
  ? behindColor
  : frontColor;


/*
 * Holding the mouse no longer changes
 * the drones to white.
 */

const particleColor =
  normalColor;

colors.push(
  particleColor.r * brightness,
  particleColor.g * brightness,
  particleColor.b * brightness
);


/*
 * Give every drone a fixed
 * size variation.
 *
 * 85% - 115% of normal size.
 */

const sizeRandomValue =
  Math.sin(
    i * 78.233
  ) *
  43758.5453;

const normalizedSizeRandom =
  sizeRandomValue -
  Math.floor(
    sizeRandomValue
  );

const sizeVariation =
  0.85 +
  normalizedSizeRandom * 0.30;


sizes.push(
  this.data.particleSize *
  sizeVariation
);

/*
 * Intro begins with every drone
 * individually invisible.
 */

alphas.push(0);

    });


    let geoParticles =
      new THREE.BufferGeometry()
        .setFromPoints(
          vectorPoints
        );


    geoParticles.setAttribute(

      'customColor',

      new THREE.Float32BufferAttribute(
        colors,
        3
      )

    );


    geoParticles.setAttribute(

      'size',

      new THREE.Float32BufferAttribute(
        sizes,
        1
      )

    );


    geoParticles.setAttribute(

      'customAlpha',

      new THREE.Float32BufferAttribute(
        alphas,
        1
      )

    );


    const material =
      new THREE.ShaderMaterial({

uniforms: {

  color: {
    value:
      new THREE.Color(
        this.data.textColor
      )
  },

  pointTexture: {
    value:
      this.particleImg
  },

  opacity: {
    value: 1.0
  }

},

        vertexShader:
          document
            .getElementById(
              'vertexshader'
            )
            .textContent,

        fragmentShader:
          document
            .getElementById(
              'fragmentshader'
            )
            .textContent,

        blending:
          THREE.AdditiveBlending,

        depthTest: false,

        transparent: true

      });


    this.particles =
      new THREE.Points(
        geoParticles,
        material
      );


this.scene.add(
  this.particles
);


this.geometryCopy =
  new THREE.BufferGeometry();


this.geometryCopy.copy(
  this.particles.geometry
);


/*
 * PREPARE OPENING INTRO POSITIONS
 *
 * Each drone begins only a short
 * distance beneath its final grid
 * resting position.
 */

const introPosition =
  this.particles.geometry
    .attributes.position;


this.introTextPositions =
  new Float32Array(
    introPosition.array
  );


this.introStartPositions =
  new Float32Array(
    introPosition.array.length
  );


this.introGridPositions =
  new Float32Array(
    introPosition.array.length
  );


this.introScatterDirections =
  new Float32Array(
    introPosition.count * 2
  );


/*
 * The word geometry contains two complete
 * copies for its depth layers, but the
 * preload grid only displays one copy.
 *
 * Build the grid from the visible copy's
 * particle count so it spans the full
 * viewport again.
 */

const introCount =
  this.wordLayerSize;


const introRows =
  8;


const introLayers =
  3;


const introWidth =
  this.visibleWidthAtZDepth(
    0,
    this.camera
  );


const introHeight =
  this.visibleHeightAtZDepth(
    0,
    this.camera
  );


/*
 * THREE INDEPENDENT OVERLAPPING GRIDS
 *
 * Each depth layer gets its own complete
 * row/column structure instead of placing
 * three neighboring drones almost on top
 * of one another.
 *
 * This creates three sparse grids that
 * overlap visually, which should read as
 * depth rather than repeated dot clusters.
 */

const particlesPerLayer =
  Math.ceil(
    introCount /
    introLayers
  );


const columnsPerLayer =
  Math.ceil(
    particlesPerLayer /
    introRows
  );


for (
  let i = 0;
  i < introCount;
  i++
) {

  const i3 =
    i * 3;

  const i2 =
    i * 2;


  const layer =
    i % introLayers;


  const layerIndex =
    Math.floor(
      i /
      introLayers
    );


  const row =
    layerIndex %
    introRows;


  const column =
    Math.floor(
      layerIndex /
      introRows
    );


  const columnProgress =
    columnsPerLayer > 1
    ?
    column /
    (
      columnsPerLayer -
      1
    )
    :
    0.5;


  const rowProgress =
    introRows > 1
    ?
    row /
    (
      introRows -
      1
    )
    :
    0.5;


  /*
   * Front layer is the widest.
   * Deeper layers become slightly
   * smaller and shift against each
   * other to create parallax.
   */

  const layerScale =
    layer === 0
    ?
    1.00
    :
    layer === 1
    ?
    0.91
    :
    0.83;


  const gridWidth =
    introWidth *
    0.78 *
    layerScale;


  const gridHeight =
    introHeight *
    0.58 *
    layerScale;


  /*
   * Offset alternating rows by half
   * a cell, then offset the whole depth
   * layer independently.
   */

  const cellWidth =
    gridWidth /
    Math.max(
      columnsPerLayer - 1,
      1
    );


  const rowOffset =
    row % 2 === 0
    ?
    0
    :
    cellWidth *
    0.50;


  const layerXOffset =
    layer === 0
    ?
    0
    :
    layer === 1
    ?
    -1.15
    :
    1.15;


  const layerYOffset =
    layer === 0
    ?
    0
    :
    layer === 1
    ?
    -0.90
    :
    0.90;


  /*
   * A tiny deterministic jitter keeps
   * the formation from reading as rigid
   * perfectly straight horizontal rules.
   */

  const jitterSeed =
    Math.sin(
      i * 91.173
    ) *
    43758.5453;


  const jitter =
    jitterSeed -
    Math.floor(
      jitterSeed
    );


  const jitterSeed2 =
    Math.sin(
      i * 37.719
    ) *
    24634.6345;


  const jitter2 =
    jitterSeed2 -
    Math.floor(
      jitterSeed2
    );


  const jitterX =
    (
      jitter -
      0.5
    ) *
    0.38;


  const jitterY =
    (
      jitter2 -
      0.5
    ) *
    0.30;


  const gridX =
    (
      columnProgress -
      0.5
    ) *
    gridWidth
    +
    rowOffset
    +
    layerXOffset
    +
    jitterX;


  const gridY =
    (
      0.5 -
      rowProgress
    ) *
    gridHeight
    +
    layerYOffset
    +
    jitterY;


  const gridZ =
    layer === 0
    ?
    0
    :
    layer === 1
    ?
    -1.10
    :
    -2.20;


  /*
   * Every drone still appears only a
   * short distance beneath its own final
   * resting point.
   */

  const startY =
    gridY -
    2.25;


  this.introStartPositions[i3] =
    gridX;


  this.introStartPositions[i3 + 1] =
    startY;


  this.introStartPositions[i3 + 2] =
    gridZ;


  this.introGridPositions[i3] =
    gridX;


  this.introGridPositions[i3 + 1] =
    gridY;


  this.introGridPositions[i3 + 2] =
    gridZ;


  /*
   * Fixed random scatter direction
   * for the grid -> text transition.
   */

  const angle =
    (
      Math.sin(
        i * 17.231
      ) *
      43758.5453
    );


  const normalizedAngle =
    angle -
    Math.floor(
      angle
    );


  const radians =
    normalizedAngle *
    Math.PI *
    2;


  this.introScatterDirections[i2] =
    Math.cos(
      radians
    );


  this.introScatterDirections[i2 + 1] =
    Math.sin(
      radians
    );


  introPosition.array[i3] =
    this.introStartPositions[i3];


  introPosition.array[i3 + 1] =
    this.introStartPositions[
      i3 + 1
    ];


  introPosition.array[i3 + 2] =
    this.introStartPositions[
      i3 + 2
    ];

}


introPosition.needsUpdate =
  true;


/*
 * The ShaderMaterial stays globally
 * visible. Individual customAlpha
 * values control the soft row fade.
 */

this.particles.material
  .uniforms.opacity.value =
    1;

}


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
      Math.abs(depth)
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

}

</script>
