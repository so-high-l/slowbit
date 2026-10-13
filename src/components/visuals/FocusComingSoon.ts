import type { ScenePainter } from "./drawing";

export const paintFocusComingSoon: ScenePainter = ({ ctx, w, h }) => {
  const background = ctx.createLinearGradient(0, 0, 0, h);
  background.addColorStop(0, "#03070a");
  background.addColorStop(0.55, "#070d12");
  background.addColorStop(1, "#020406");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  const quietLight = ctx.createRadialGradient(w * 0.5, h * 0.47, 0, w * 0.5, h * 0.47, Math.min(w, h) * 0.42);
  quietLight.addColorStop(0, "rgba(151, 177, 188, 0.055)");
  quietLight.addColorStop(1, "rgba(151, 177, 188, 0)");
  ctx.fillStyle = quietLight;
  ctx.fillRect(0, 0, w, h);

  const unit = Math.min(w, h);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(224, 232, 232, 0.72)";
  ctx.font = `500 ${Math.max(13, unit * 0.018)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText("MORE FOCUS SCENES COMING SOON", w * 0.5, h * 0.5);
  ctx.restore();
};
