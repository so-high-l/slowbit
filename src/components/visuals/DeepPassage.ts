import { background, glow, type ScenePainter } from "./drawing.ts";

const TAU = Math.PI * 2;
const fract = (value: number) => value - Math.floor(value);

export function deepPassagePoint(depth: number, side: -1 | 1, w: number, h: number) {
  const d = Math.max(0, Math.min(1, depth));
  const perspective = Math.pow(d, 2.15);
  const vanishX = w * 0.5;
  const vanishY = h * 0.43;
  return {
    x: vanishX + side * (w * 0.025 + w * 0.54 * perspective),
    y: vanishY + h * (0.012 + 0.67 * perspective),
    perspective,
  };
}

function passageDepth(index: number, count: number, t: number) {
  return fract(index / count + t * 0.075);
}

function drawRail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  side: -1 | 1,
  offset: number,
  alpha: number,
) {
  const vx = w * 0.5;
  const vy = h * 0.43;
  ctx.beginPath();
  ctx.moveTo(vx + side * w * (0.012 + offset * 0.008), vy);
  ctx.bezierCurveTo(
    vx + side * w * (0.03 + offset * 0.03), h * 0.58,
    vx + side * w * (0.28 + offset * 0.12), h * 0.82,
    vx + side * w * (0.58 + offset * 0.10), h * 1.04,
  );
  ctx.strokeStyle = `rgba(79,151,231,${alpha})`;
  ctx.lineWidth = Math.max(0.7, Math.min(w, h) * 0.0012);
  ctx.stroke();
}

export const paintDeepPassage: ScenePainter = ({ ctx, w, h, t, focus = 0, reducedMotion = false }) => {
  background(ctx, w, h, "#01030a", "#070b19");
  const vx = w * 0.5;
  const vy = h * 0.43;
  const motion = reducedMotion ? 0 : Math.max(0, Math.min(1, focus));

  const sky = ctx.createRadialGradient(vx, vy, 0, vx, vy, Math.max(w, h) * 0.72);
  sky.addColorStop(0, "rgba(18,43,76,0.30)");
  sky.addColorStop(0.36, "rgba(7,19,42,0.17)");
  sky.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const floor = ctx.createLinearGradient(0, vy, 0, h);
  floor.addColorStop(0, "rgba(4,11,27,0.06)");
  floor.addColorStop(1, "rgba(1,3,11,0.88)");
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.moveTo(vx - w * 0.018, vy);
  ctx.lineTo(w * 0.03, h);
  ctx.lineTo(w * 0.97, h);
  ctx.lineTo(vx + w * 0.018, vy);
  ctx.closePath();
  ctx.fill();

  glow(ctx, vx, vy, Math.min(w, h) * 0.18, "rgba(74,151,224,0.085)");
  glow(ctx, vx, vy, Math.min(w, h) * 0.035, "rgba(174,222,255,0.12)");

  for (const side of [-1, 1] as const) {
    drawRail(ctx, w, h, side, 0, 0.30);
    drawRail(ctx, w, h, side, 0.72, 0.12);
    drawRail(ctx, w, h, side, 1.48, 0.055);
  }

  const gateCount = 16;
  for (let i = 0; i < gateCount; i++) {
    const depth = passageDepth(i, gateCount, t);
    const left = deepPassagePoint(depth, -1, w, h);
    const right = deepPassagePoint(depth, 1, w, h);
    const fade = Math.min(1, depth * 7) * (0.08 + left.perspective * 0.31);
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.strokeStyle = `rgba(62,126,199,${fade})`;
    ctx.lineWidth = 0.55 + left.perspective * 1.15;
    ctx.stroke();
  }

  const palettes = [
    [91, 194, 255],
    [92, 135, 255],
    [157, 185, 255],
    [118, 225, 244],
  ] as const;
  const markerCount = 30;
  for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
    const side = (sideIndex === 0 ? -1 : 1) as -1 | 1;
    for (let i = 0; i < markerCount; i++) {
      const depth = passageDepth(i + sideIndex * 0.43, markerCount, t * (0.93 + sideIndex * 0.05));
      const point = deepPassagePoint(depth, side, w, h);
      const color = palettes[(i * 3 + sideIndex) % palettes.length];
      const near = Math.pow(point.perspective, 0.72);
      const width = 1.1 + near * Math.min(w, h) * 0.018;
      const tail = width * (0.5 + motion * 2.8);
      const alpha = Math.min(0.82, 0.10 + near * 0.65);

      ctx.save();
      ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},0.62)`;
      ctx.shadowBlur = 3 + near * 12;
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
      ctx.lineWidth = 0.8 + near * 2.1;
      ctx.beginPath();
      ctx.moveTo(point.x - side * tail * 0.14, point.y - tail * 0.46);
      ctx.lineTo(point.x + side * tail, point.y + tail * 0.22);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Sparse fixed points stop the upper half from reading as an empty road scene.
  for (let i = 0; i < 44; i++) {
    const angle = i * 2.399963 + 0.7;
    const radius = Math.sqrt((i + 2) / 46);
    const x = vx + Math.cos(angle) * w * 0.53 * radius;
    const y = h * 0.06 + Math.abs(Math.sin(angle * 0.83)) * h * 0.35 * radius;
    const pulse = 0.58 + Math.sin(t * 0.22 + i * 1.7) * 0.14 * motion;
    ctx.beginPath();
    ctx.arc(x, y, 0.35 + (i % 5 === 0 ? 0.65 : 0.2), 0, TAU);
    ctx.fillStyle = `rgba(151,198,235,${0.08 + pulse * 0.16})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(vx, vy, 1.25, 0, TAU);
  ctx.fillStyle = "rgba(214,239,255,0.72)";
  ctx.fill();

  const vignette = ctx.createRadialGradient(vx, vy, Math.min(w, h) * 0.08, vx, vy, Math.max(w, h) * 0.76);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.7, "rgba(0,0,0,0.12)");
  vignette.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
