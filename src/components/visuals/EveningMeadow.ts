import { background, glow, type ScenePainter } from "./drawing";

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 103.9) * 43758.5453);

export const paintEveningMeadow: ScenePainter = ({ ctx, w, h, t, focus = 0 }) => {
  background(ctx, w, h, "#111523", "#493b52");

  const tilt = focus * focus * (3 - 2 * focus);
  const offset = h * 0.34 * tilt;
  const sky = ctx.createLinearGradient(0, 0, 0, h + offset);
  sky.addColorStop(0, "#111528");
  sky.addColorStop(0.45, "#4c4059");
  sky.addColorStop(0.68, "#b06f69");
  sky.addColorStop(1, "#24342f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Last warm glow at the horizon
  glow(ctx, w * 0.68, h * 0.48 + offset, Math.min(w, h) * 0.24, "#df9a7620");

  // Distant hill
  ctx.fillStyle = "rgba(23, 34, 37, .62)";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.62 + offset);
  for (let x = 0; x <= w; x += 26) {
    ctx.lineTo(x, h * 0.61 + offset + Math.sin(x * 0.009) * 18 + Math.sin(x * 0.023) * 6);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Grass silhouettes in several depths
  for (let layer = 0; layer < 3; layer++) {
    const baseY = h * (0.77 + layer * 0.08) + offset;
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
    const baseY = h * (0.53 + rand(i + 40) * 0.30) + offset;
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

  // Looking upward reveals a quiet canopy of stars and nearby grass at the edges.
  for (let i = 0; i < 65; i++) {
    ctx.fillStyle = `rgba(222,229,241,${tilt * (0.12 + rand(i + 700) * 0.32)})`;
    ctx.beginPath();
    ctx.arc(rand(i + 500) * w, rand(i + 600) * h * 0.78, 0.5 + rand(i + 800) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.globalAlpha = tilt;
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 26; i++) {
      const edge = side ? w : 0;
      const direction = side ? -1 : 1;
      const rootX = edge + direction * rand(i + 900) * w * 0.17;
      const length = Math.min(h, w * 1.3) * (0.07 + rand(i + 1000) * 0.18);
      const sway = Math.sin(t * 0.14 + i * 0.73) * 2.5;
      ctx.fillStyle = `rgba(21,35,29,${0.35 + rand(i) * 0.3})`;
      const bend = direction * length * (0.22 + rand(i + 1100) * 0.28);
      const bladeWidth = 0.7 + rand(i + 30) * 1.2;
      ctx.beginPath();
      ctx.moveTo(rootX, h + 10);
      ctx.bezierCurveTo(rootX - bend * 0.12, h - length * 0.4, rootX + bend * 0.4, h - length * 0.9, rootX + bend + sway, h - length);
      ctx.bezierCurveTo(rootX + bend * 0.45, h - length * 0.8, rootX + bladeWidth - bend * 0.08, h - length * 0.35, rootX + bladeWidth, h + 10);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, 80, w * 0.5, h * 0.52, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.31)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
