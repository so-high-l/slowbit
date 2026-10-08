import { background, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

const clamp = (v: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, v));

const mix = (a: number, b: number, t: number) =>
  a + (b - a) * t;

/*
 * We render the interference field at a deliberately lower
 * resolution and scale it smoothly to fullscreen.
 *
 * This gives us:
 * - soft fluid edges
 * - good performance
 * - a more atmospheric appearance
 */
let bufferCanvas: HTMLCanvasElement | null = null;
let bufferCtx: CanvasRenderingContext2D | null = null;
let bufferImage: ImageData | null = null;

let bufferW = 0;
let bufferH = 0;

function ensureBuffer(w: number, h: number) {
  /*
   * 190px wide is enough because this visual should
   * remain soft rather than pixel-sharp.
   */
  const targetW = 190;

  const targetH = Math.max(
    80,
    Math.round(targetW * (h / w)),
  );

  if (
    bufferCanvas &&
    bufferCtx &&
    bufferImage &&
    bufferW === targetW &&
    bufferH === targetH
  ) {
    return;
  }

  bufferW = targetW;
  bufferH = targetH;

  bufferCanvas = document.createElement("canvas");

  bufferCanvas.width = bufferW;
  bufferCanvas.height = bufferH;

  bufferCtx = bufferCanvas.getContext("2d", {
    alpha: false,
  });

  if (!bufferCtx) {
    bufferCanvas = null;
    return;
  }

  bufferImage = bufferCtx.createImageData(
    bufferW,
    bufferH,
  );
}

/*
 * Main scalar interference field.
 *
 * Four waves travel at unrelated angles, speeds,
 * frequencies and phases.
 *
 * Their angles themselves also change very slowly.
 *
 * This is what stops the visual from looking like
 * a simple repeating sine-wave animation.
 */
function fieldAt(
  x: number,
  y: number,
  t: number,
) {
  const a1 =
    0.22 +
    Math.sin(t * 0.0067) * 0.14;

  const a2 =
    1.48 +
    Math.sin(t * 0.0049 + 1.8) * 0.11;

  const a3 =
    -0.86 +
    Math.sin(t * 0.0083 + 3.2) * 0.10;

  const a4 =
    2.18 +
    Math.sin(t * 0.0039 + 0.7) * 0.13;

  const p1 =
    (
      x * Math.cos(a1) +
      y * Math.sin(a1)
    ) *
    4.05 +
    t * 0.105 +
    Math.sin(t * 0.013) * 0.65;

  const p2 =
    (
      x * Math.cos(a2) +
      y * Math.sin(a2)
    ) *
    5.15 -
    t * 0.078 +
    Math.sin(t * 0.009 + 1.4) * 0.72;

  const p3 =
    (
      x * Math.cos(a3) +
      y * Math.sin(a3)
    ) *
    3.18 +
    t * 0.059 +
    Math.sin(t * 0.016 + 2.3) * 0.5;

  const p4 =
    (
      x * Math.cos(a4) +
      y * Math.sin(a4)
    ) *
    6.35 -
    t * 0.044 +
    Math.sin(t * 0.006 + 4.1) * 0.82;

  /*
   * The fourth wave is also slightly modulated by the
   * first two systems.
   *
   * This produces moments where patterns suddenly become
   * more complicated before relaxing again.
   */
  const modulation =
    Math.sin(
      p4 +
      Math.sin(p1 * 0.55 + p2 * 0.31) *
      0.75,
    );

  return (
    Math.sin(p1) * 0.92 +
    Math.sin(p2) * 0.73 +
    Math.sin(p3) * 0.55 +
    modulation * 0.39
  );
}

/*
 * Render the interference texture.
 */
function renderField(
  t: number,
  screenW: number,
  screenH: number,
) {
  if (
    !bufferCtx ||
    !bufferImage
  ) {
    return;
  }

  const data =
    bufferImage.data;

  const aspect =
    screenW / screenH;

  let ptr = 0;

  for (
    let py = 0;
    py < bufferH;
    py++
  ) {
    const ny =
      (py / (bufferH - 1)) *
      2 -
      1;

    for (
      let px = 0;
      px < bufferW;
      px++
    ) {
      const nx =
        (
          (px / (bufferW - 1)) *
          2 -
          1
        ) *
        aspect;

      /*
       * Tiny additional distortion.
       *
       * This means the wave field isn't perfectly
       * mathematically straight.
       */
      const warpX =
        nx +
        Math.sin(
          ny * 2.4 +
          t * 0.009,
        ) *
        0.045 +
        Math.sin(
          ny * 5.2 -
          t * 0.006,
        ) *
        0.018;

      const warpY =
        ny +
        Math.sin(
          nx * 1.7 -
          t * 0.007,
        ) *
        0.038;

      const field =
        fieldAt(
          warpX,
          warpY,
          t,
        );

      /*
       * Convert the scalar field into contour-like
       * luminous bands.
       *
       * This is the key visual trick.
       */
      const q =
        field * 1.18 +
        Math.sin(
          nx * 1.3 +
          ny * 1.7 +
          t * 0.008,
        ) *
        0.16;

      /*
       * Narrow bright ridges.
       */
      const ridgeRaw =
        1 -
        Math.abs(
          Math.sin(
            q * Math.PI,
          ),
        );

      const ridge =
        Math.pow(
          clamp(ridgeRaw),
          5.8,
        );

      /*
       * Wider halo surrounding each ridge.
       */
      const haloRaw =
        1 -
        Math.abs(
          Math.sin(
            (
              q +
              0.035 *
              Math.sin(
                t * 0.017,
              )
            ) *
            Math.PI,
          ),
        );

      const halo =
        Math.pow(
          clamp(haloRaw),
          2.15,
        );

      /*
       * Slowly shift between slightly blue and
       * slightly teal sections.
       */
      const colorShift =
        0.5 +
        0.5 *
        Math.sin(
          field * 0.72 +
          t * 0.012 +
          nx * 0.8,
        );

      /*
       * Dark edge falloff.
       */
      const radial =
        Math.sqrt(
          Math.pow(
            nx / Math.max(aspect, 1),
            2,
          ) +
          Math.pow(ny, 2),
        );

      const vignette =
        1 -
        smoothVignette(radial);

      /*
       * Interference brightness.
       */
      const strength =
        (
          ridge * 0.76 +
          halo * 0.105
        ) *
        vignette;

      /*
       * Dark navy base.
       */
      const baseR = 2;
      const baseG = 6;
      const baseB = 12;

      /*
       * Alternate gently between:
       *
       * blue-grey
       * teal-grey
       */
      const tideR =
        mix(
          53,
          65,
          colorShift,
        );

      const tideG =
        mix(
          78,
          111,
          colorShift,
        );

      const tideB =
        mix(
          111,
          121,
          colorShift,
        );

      /*
       * A small atmospheric lift prevents the spaces
       * between lines from becoming completely flat.
       */
      const ambient =
        halo * 0.025;

      data[ptr++] =
        Math.round(
          baseR +
          tideR *
          (
            strength +
            ambient
          ),
        );

      data[ptr++] =
        Math.round(
          baseG +
          tideG *
          (
            strength +
            ambient
          ),
        );

      data[ptr++] =
        Math.round(
          baseB +
          tideB *
          (
            strength +
            ambient
          ),
        );

      data[ptr++] = 255;
    }
  }

  bufferCtx.putImageData(
    bufferImage,
    0,
    0,
  );
}

function smoothVignette(
  radius: number,
) {
  const start = 0.54;
  const end = 1.25;

  const x =
    clamp(
      (radius - start) /
      (end - start),
    );

  return (
    x *
    x *
    (3 - 2 * x)
  );
}

/*
 * A few extremely subtle large gradients move underneath
 * the interference pattern.
 *
 * They're not meant to be consciously noticed.
 */
function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const x1 =
    w *
    (
      0.35 +
      Math.sin(t * 0.008) *
      0.08
    );

  const y1 =
    h *
    (
      0.42 +
      Math.cos(t * 0.006) *
      0.07
    );

  const g1 =
    ctx.createRadialGradient(
      x1,
      y1,
      0,
      x1,
      y1,
      Math.min(w, h) *
      0.48,
    );

  g1.addColorStop(
    0,
    "rgba(36,67,86,0.065)",
  );

  g1.addColorStop(
    1,
    "rgba(0,0,0,0)",
  );

  ctx.fillStyle = g1;

  ctx.fillRect(
    0,
    0,
    w,
    h,
  );

  const x2 =
    w *
    (
      0.67 +
      Math.cos(t * 0.005) *
      0.07
    );

  const y2 =
    h *
    (
      0.55 +
      Math.sin(t * 0.007) *
      0.08
    );

  const g2 =
    ctx.createRadialGradient(
      x2,
      y2,
      0,
      x2,
      y2,
      Math.min(w, h) *
      0.38,
    );

  g2.addColorStop(
    0,
    "rgba(51,52,87,0.045)",
  );

  g2.addColorStop(
    1,
    "rgba(0,0,0,0)",
  );

  ctx.fillStyle = g2;

  ctx.fillRect(
    0,
    0,
    w,
    h,
  );
}

export const paintSlowInk: ScenePainter = ({
  ctx,
  w,
  h,
  t,
}) => {
  /*
   * Base.
   */
  background(
    ctx,
    w,
    h,
    "#01040a",
    "#06101a",
  );

  drawAtmosphere(
    ctx,
    w,
    h,
    t,
  );

  ensureBuffer(
    w,
    h,
  );

  if (
    !bufferCanvas ||
    !bufferCtx ||
    !bufferImage
  ) {
    return;
  }

  renderField(
    t,
    w,
    h,
  );

  /*
   * Scale the small field smoothly across the display.
   */
  ctx.save();

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  /*
   * A tiny blur gets rid of the low-res raster character
   * and makes the bands feel fluid.
   */
  ctx.filter =
    "blur(1.8px)";

  ctx.globalAlpha =
    0.96;

  ctx.globalCompositeOperation =
    "screen";

  ctx.drawImage(
    bufferCanvas,
    0,
    0,
    bufferW,
    bufferH,
    0,
    0,
    w,
    h,
  );

  ctx.restore();

  /*
   * Very faint second pass.
   *
   * Offset by a few pixels to give the bright ridges
   * soft depth rather than looking like perfectly flat lines.
   */
  ctx.save();

  ctx.globalCompositeOperation =
    "screen";

  ctx.globalAlpha =
    0.07;

  ctx.filter =
    "blur(8px)";

  ctx.drawImage(
    bufferCanvas,
    -w * 0.004,
    -h * 0.004,
    w * 1.008,
    h * 1.008,
  );

  ctx.restore();

  /*
   * Final dark vignette.
   */
  const vignette =
    ctx.createRadialGradient(
      w * 0.5,
      h * 0.48,
      Math.min(w, h) *
      0.15,

      w * 0.5,
      h * 0.5,
      Math.max(w, h) *
      0.72,
    );

  vignette.addColorStop(
    0,
    "rgba(0,0,0,0)",
  );

  vignette.addColorStop(
    0.68,
    "rgba(0,0,0,0.04)",
  );

  vignette.addColorStop(
    1,
    "rgba(0,2,6,0.42)",
  );

  ctx.fillStyle =
    vignette;

  ctx.fillRect(
    0,
    0,
    w,
    h,
  );
};