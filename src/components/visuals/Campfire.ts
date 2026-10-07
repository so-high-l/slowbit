import { background, glow, type ScenePainter } from "./drawing";
export const paintEmbers: ScenePainter = ({ ctx, w, h, t, particles }) => {
  background(ctx, w, h, "#110f15", "#291b1c");
  glow(ctx, w * 0.5, h * 1.03, w * 0.52, "#b65c303d");
  glow(ctx, w * 0.5, h * 1.03, h * 0.58, "#e58d394a");
  for (let i = 0; i < 6; i++)
    glow(
      ctx,
      w * (0.37 + i * 0.055),
      h * (0.94 + Math.sin(t * 0.6 + i) * 0.017),
      w * 0.1,
      ["#e3984940", "#b6533230"][i % 2],
    );
  for (const p of particles) {
    const progress = (p.y + t * p.s * 0.027) % 1;
    const x =
      (0.5 + (p.x - 0.5) * 0.7) * w +
      Math.sin(t * 0.5 + p.phase + progress * 5) * 25;
    const y = h * (1 - progress);
    const opacity = Math.sin(progress * Math.PI) * 0.65;
    ctx.fillStyle = `rgba(231,159,89,${opacity})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      p.r * 0.65,
      p.r * 1.05,
      Math.sin(t + p.phase) * 0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    if (p.r > 1.8)
      glow(ctx, x, y, p.r * 5, `rgba(219,114,44,${opacity * 0.15})`);
  }
};
