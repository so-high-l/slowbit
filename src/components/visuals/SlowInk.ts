import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

function inkBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  t: number,
  phase: number,
  color: string,
  alpha: number,
) {
  ctx.beginPath();

  const points = 64;
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * TAU;
    const wobble =
      Math.sin(a * 3 + t * 0.18 + phase) * 0.09 +
      Math.sin(a * 5 - t * 0.13 + phase * 1.7) * 0.045 +
      Math.sin(a * 2 + t * 0.08) * 0.03;

    const r = radius * (1 + wobble);
    const x = cx + Math.cos(a) * r * 1.2;
    const y = cy + Math.sin(a) * r * 0.82;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();

  const grad = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius * 1.45);
  grad.addColorStop(0, color.replace("ALPHA", String(alpha * 0.75)));
  grad.addColorStop(0.55, color.replace("ALPHA", String(alpha * 0.36)));
  grad.addColorStop(1, color.replace("ALPHA", "0"));

  ctx.fillStyle = grad;
  ctx.fill();
}

export const paintSlowInk: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#080d14", "#171728");

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#070d15");
  bg.addColorStop(0.5, "#151725");
  bg.addColorStop(1, "#0a1118");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Faint light behind the ink makes it feel suspended in water.
  glow(ctx, w * 0.5, h * 0.48, Math.min(w, h) * 0.32, "#7893b014");

  const driftX = Math.sin(t * 0.07) * w * 0.025;
  const driftY = Math.sin(t * 0.05) * h * 0.018;

  inkBlob(ctx, w * 0.45 + driftX, h * 0.46 + driftY, Math.min(w, h) * 0.18, t, 0.2, "rgba(66, 104, 137, ALPHA)", 0.45);
  inkBlob(ctx, w * 0.57 - driftX * 0.7, h * 0.52 - driftY * 0.6, Math.min(w, h) * 0.14, t, 2.1, "rgba(103, 72, 125, ALPHA)", 0.32);
  inkBlob(ctx, w * 0.50 + driftX * 0.4, h * 0.58, Math.min(w, h) * 0.10, t, 4.4, "rgba(49, 126, 125, ALPHA)", 0.26);

  // Thin tendrils drifting out of the main cloud
  for (let i = 0; i < 8; i++) {
    const sx = w * 0.5 + (i - 3.5) * 20;
    const sy = h * 0.56;
    const sway = Math.sin(t * 0.16 + i * 1.2) * 18;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(
      sx + sway * 0.3,
      sy + h * 0.08,
      sx - sway * 0.7,
      sy + h * 0.16,
      sx + sway,
      sy + h * 0.25,
    );
    ctx.strokeStyle = `rgba(102, 151, 160, ${0.025 + (i % 3) * 0.012})`;
    ctx.lineWidth = 1.2 + (i % 2) * 0.5;
    ctx.stroke();
  }

  // A few suspended micro bubbles / dust points
  for (let i = 0; i < 18; i++) {
    const x = w * (0.25 + ((i * 0.137) % 0.5)) + Math.sin(t * 0.11 + i) * 4;
    const y = h * (0.24 + ((i * 0.091) % 0.54)) - ((t * (0.5 + (i % 3) * 0.2)) % 30);
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + (i % 4) * 0.25, 0, TAU);
    ctx.fillStyle = "rgba(194, 215, 220, .035)";
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, 80, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.36)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
