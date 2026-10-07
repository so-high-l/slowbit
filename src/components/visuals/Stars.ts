import { background, glow, type ScenePainter } from "./drawing";
export const paintStars: ScenePainter = ({ ctx, w, h, t, particles }) => {
  background(ctx, w, h, "#070e1d", "#172039");
  glow(ctx, w * 0.65, h * 0.35, w * 0.45, "#64729a22");
  glow(ctx, w * 0.4, h * 0.65, w * 0.35, "#463f7720");
  for (const p of particles) {
    const x = p.x * w;
    const distance = Math.hypot(p.x - 0.5, p.y - 0.5);
    const reveal = Math.min(1, distance / 0.08);
    const y = p.y * h;
    ctx.fillStyle = `rgba(210,226,244,${reveal * (0.35 + Math.sin(t * 0.35 + p.phase) * 0.2)})`;
    ctx.beginPath();
    ctx.arc(x, y, p.r * (0.3 + distance * 0.6), 0, Math.PI * 2);
    ctx.fill();
    if (p.r > 2.1) glow(ctx, x, y, p.r * 3, "#b8d7ff16");
  }
};
