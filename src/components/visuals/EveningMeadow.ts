import { background, glow, type ScenePainter } from "./drawing";

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 103.9) * 43758.5453);

export const paintEveningMeadow: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#111523", "#493b52");

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#111528");
  sky.addColorStop(0.45, "#4c4059");
  sky.addColorStop(0.68, "#b06f69");
  sky.addColorStop(1, "#24342f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Last warm glow at the horizon
  glow(ctx, w * 0.68, h * 0.48, Math.min(w, h) * 0.24, "#df9a7620");

  // Distant hill
  ctx.fillStyle = "rgba(23, 34, 37, .62)";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.62);
  for (let x = 0; x <= w; x += 26) {
    ctx.lineTo(x, h * 0.61 + Math.sin(x * 0.009) * 18 + Math.sin(x * 0.023) * 6);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Grass silhouettes in several depths
  for (let layer = 0; layer < 3; layer++) {
    const baseY = h * (0.77 + layer * 0.08);
    const count = 100 - layer * 18;
    const alpha = 0.20 + layer * 0.18;

    for (let i = 0; i < count; i++) {
      const x = (i / count) * w + (rand(i + layer * 100) - 0.5) * 12;
      const len = 18 + rand(i + 200 + layer * 100) * (34 + layer * 16);
      const sway = Math.sin(t * (0.16 + layer * 0.03) + i * 0.35) * (1.5 + layer);

      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x + sway, baseY - len * 0.55, x + sway * 1.7, baseY - len);
      ctx.strokeStyle = `rgba(18, 30, 24, ${alpha})`;
      ctx.lineWidth = 0.8 + layer * 0.35;
      ctx.stroke();
    }
  }

  // Sparse fireflies. Their timing is intentionally asynchronous.
  for (let i = 0; i < 11; i++) {
    const baseX = w * (0.12 + rand(i + 20) * 0.76);
    const baseY = h * (0.53 + rand(i + 40) * 0.30);
    const x = baseX + Math.sin(t * 0.23 + i * 2.4) * (8 + rand(i + 60) * 8);
    const y = baseY + Math.sin(t * 0.17 + i * 1.1) * (5 + rand(i + 80) * 7);
    const pulse = Math.pow(Math.max(0, Math.sin(t * 0.65 + i * 1.91)), 5);

    if (pulse > 0.02) {
      glow(ctx, x, y, 18 + pulse * 10, `rgba(238, 220, 126, ${0.08 + pulse * 0.15})`);
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + pulse * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 234, 144, ${0.18 + pulse * 0.46})`;
      ctx.fill();
    }
  }

  // One tiny distant star
  const starPulse = 0.65 + Math.sin(t * 0.35) * 0.15;
  glow(ctx, w * 0.23, h * 0.22, 9, `rgba(236,238,225,${0.06 * starPulse})`);
  ctx.beginPath();
  ctx.arc(w * 0.23, h * 0.22, 1, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(238,240,228,${0.32 * starPulse})`;
  ctx.fill();

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, 80, w * 0.5, h * 0.52, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.31)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
