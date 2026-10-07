import { background, glow, type ScenePainter } from "./drawing";

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 91.7) * 43758.5453);

function treeLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  baseY: number,
  count: number,
  minH: number,
  maxH: number,
  alpha: number,
  drift: number,
  seed: number,
) {
  ctx.save();
  ctx.translate(Math.sin(t * 0.03 + seed) * drift, 0);

  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1)) * w + (rand(i + seed) - 0.5) * 35;
    const th = minH + rand(i + seed * 3) * (maxH - minH);
    const tw = 16 + rand(i + seed * 5) * 22;

    ctx.fillStyle = `rgba(8, 24, 22, ${alpha})`;

    ctx.beginPath();
    ctx.moveTo(x, baseY - th);
    ctx.lineTo(x - tw * 0.28, baseY - th * 0.7);
    ctx.lineTo(x - tw * 0.08, baseY - th * 0.7);
    ctx.lineTo(x - tw * 0.44, baseY - th * 0.42);
    ctx.lineTo(x - tw * 0.12, baseY - th * 0.42);
    ctx.lineTo(x - tw * 0.58, baseY - th * 0.08);
    ctx.lineTo(x + tw * 0.58, baseY - th * 0.08);
    ctx.lineTo(x + tw * 0.12, baseY - th * 0.42);
    ctx.lineTo(x + tw * 0.44, baseY - th * 0.42);
    ctx.lineTo(x + tw * 0.08, baseY - th * 0.7);
    ctx.lineTo(x + tw * 0.28, baseY - th * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(x - 1.5, baseY - th * 0.2, 3, th * 0.24);
  }

  ctx.restore();
}

export const paintMistForest: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#0a1719", "#51655d");

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#122328");
  sky.addColorStop(0.45, "#4e625d");
  sky.addColorStop(0.7, "#314b45");
  sky.addColorStop(1, "#10221f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Soft distant light behind the mist
  glow(ctx, w * 0.7, h * 0.25, Math.min(w, h) * 0.26, "#d7e1cf18");

  treeLayer(ctx, w, h, t, h * 0.61, 18, h * 0.16, h * 0.30, 0.14, 2, 20);
  treeLayer(ctx, w, h, t, h * 0.73, 22, h * 0.21, h * 0.38, 0.25, 4, 50);

  // Moving fog between forest layers
  for (let i = 0; i < 5; i++) {
    const offset = ((t * (3 + i * 0.45) + i * w * 0.23) % (w * 1.5)) - w * 0.25;
    const y = h * (0.43 + i * 0.055);
    const fog = ctx.createRadialGradient(offset, y, 5, offset, y, w * 0.35);
    fog.addColorStop(0, `rgba(205, 220, 211, ${0.06 - i * 0.006})`);
    fog.addColorStop(1, "rgba(205,220,211,0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, y - h * 0.15, w, h * 0.3);
  }

  treeLayer(ctx, w, h, t, h * 0.88, 26, h * 0.26, h * 0.46, 0.5, 6, 80);

  // Foreground ridge
  ctx.fillStyle = "rgba(3, 12, 11, .62)";
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 30) {
    ctx.lineTo(x, h * 0.88 + Math.sin(x * 0.014) * 8);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Sparse floating moisture specks
  for (let i = 0; i < 18; i++) {
    const x = (rand(i + 200) * w + t * (2 + rand(i + 300) * 2)) % w;
    const y = h * (0.22 + rand(i + 400) * 0.48);
    const a = 0.02 + 0.025 * (0.5 + 0.5 * Math.sin(t * 0.45 + i));
    ctx.beginPath();
    ctx.arc(x, y, 1 + rand(i + 500) * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(226, 236, 229, ${a})`;
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(w * 0.52, h * 0.44, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
