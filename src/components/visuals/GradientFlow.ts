import { background, glow, type ScenePainter } from "./drawing";
export const paintAurora: ScenePainter = ({ ctx, w, h, t, particles }) => {
  background(ctx, w, h, "#0a1424", "#1a2832");
  glow(ctx, w * 0.7, h * 0.45, w * 0.55, "#52678040");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let band = 0; band < 4; band++) {
    const g = ctx.createLinearGradient(0, h * 0.05, 0, h * 0.75);
    g.addColorStop(0, "transparent");
    g.addColorStop(
      0.38,
      ["#527fa318", "#73b6a025", "#7773b425", "#488a9920"][band],
    );
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    for (let i = 0; i < 60; i++) {
      const x = (i / 59) * w;
      const y =
        h * (0.35 + Math.sin(i * 0.048 + t * 0.075 + band * 0.5) * 0.15) +
        Math.sin(i * 0.13 + t * 0.15) * h * 0.045;
      ctx.globalAlpha = 0.2 + Math.sin((i / 60) * Math.PI) * 0.7;
      ctx.fillRect(x, y - h * 0.3, w / 58, h * 0.55);
    }
  }
  ctx.restore();
  for (const p of particles.slice(0, 45)) {
    ctx.fillStyle = `rgba(207,222,231,${0.12 + p.s * 0.2})`;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h * 0.6, p.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
};
