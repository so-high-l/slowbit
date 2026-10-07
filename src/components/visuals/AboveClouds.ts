import { background, glow, type ScenePainter } from "./drawing";

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 119.1) * 43758.5453);

function cloudBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  seed: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const puffs = [
    [-52, 10, 45],
    [-20, -5, 52],
    [25, 0, 62],
    [70, 14, 44],
    [12, 30, 72],
  ] as const;

  for (let i = 0; i < puffs.length; i++) {
    const [px, py, pr] = puffs[i];
    const grad = ctx.createRadialGradient(px, py, 3, px, py, pr);
    grad.addColorStop(0, `rgba(220, 228, 233, ${alpha + rand(seed + i) * 0.025})`);
    grad.addColorStop(1, "rgba(220,228,233,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export const paintAboveClouds: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#071522", "#49667a");

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#071722");
  sky.addColorStop(0.5, "#45677f");
  sky.addColorStop(0.72, "#9baeb4");
  sky.addColorStop(1, "#566d76");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Calm opening in the clouds
  const lightX = w * 0.67;
  const lightY = h * 0.28;
  glow(ctx, lightX, lightY, Math.min(w, h) * 0.28, "#e8e1c627");
  glow(ctx, lightX, lightY, Math.min(w, h) * 0.12, "#fff2cd28");

  // Very distant cloud field
  for (let i = 0; i < 8; i++) {
    const x = ((rand(i + 5) * w + t * (1.3 + i * 0.08)) % (w * 1.25)) - w * 0.12;
    const y = h * (0.39 + rand(i + 30) * 0.18);
    cloudBlob(ctx, x, y, 1.2 + rand(i + 50) * 0.8, 0.06, i + 80);
  }

  // Main sea of clouds
  for (let i = 0; i < 10; i++) {
    const x = ((i / 9) * w + Math.sin(t * 0.025 + i) * 18) - 80;
    const y = h * (0.62 + Math.sin(i * 1.8) * 0.035);
    cloudBlob(ctx, x, y, 1.8 + (i % 3) * 0.22, 0.12, 120 + i);
  }

  // Foreground cloud layer
  for (let i = 0; i < 7; i++) {
    const x = (i / 6) * w - 90 + Math.sin(t * 0.02 + i) * 13;
    const y = h * (0.82 + Math.sin(i * 1.4) * 0.028);
    cloudBlob(ctx, x, y, 2.2 + (i % 2) * 0.35, 0.16, 180 + i);
  }

  // Slow, barely visible high-altitude specks
  for (let i = 0; i < 12; i++) {
    const x = (rand(i + 250) * w + t * (1 + rand(i + 260))) % w;
    const y = h * (0.14 + rand(i + 270) * 0.34);
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + rand(i + 280) * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(241, 244, 242, .035)";
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(w * 0.57, h * 0.42, 80, w * 0.5, h * 0.5, Math.max(w, h) * 0.77);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
