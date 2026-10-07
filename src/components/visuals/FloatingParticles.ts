import { background, glow, type ScenePainter } from "./drawing";
export const paintDrift: ScenePainter = ({ ctx, w, h, t, particles }) => {
  background(ctx, w, h, "#102428", "#253936");
  glow(ctx, w * 0.3, h * 0.3, w * 0.5, "#758f6636");
  glow(ctx, w * 0.8, h * 0.7, w * 0.5, "#7faca22a");
  for (const p of particles.slice(0, 60)) {
    const x = ((p.x + Math.sin(t * 0.045 + p.phase) * 0.04 + 1) % 1) * w;
    const y = p.y * h;
    const distance = Math.hypot(p.x - 0.5, p.y - 0.5);
    const r = p.r * (3 + distance * 5);
    glow(ctx, x, y, r * 2, `rgba(195,217,176,${0.02 + p.s * 0.08})`);
    ctx.fillStyle = `rgba(184,215,193,${p.s * 0.04})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
};
