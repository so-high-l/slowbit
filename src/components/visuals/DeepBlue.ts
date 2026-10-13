import { glow, type ScenePainter } from "./drawing.ts";
import { followLightPosition, paintFollowLight } from "./follow-light.ts";

const TAU = Math.PI * 2;

function jelly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  t: number,
  phase: number,
  alpha: number,
) {
  const breath = Math.sin(t * 0.85 + phase);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.19 + phase) * 0.045);
  ctx.scale(scale * (1 - breath * 0.045), scale * (1 + breath * 0.065));

  glow(ctx, 0, -8, 80, `rgba(120, 205, 220, ${alpha * 0.18})`);

  // Trailing filaments sit behind the translucent bell.
  for (let i = -3; i <= 3; i++) {
    const sway = Math.sin(t * 0.48 + phase + i * 0.55) * 12;
    const length = 102 + Math.cos(i * 1.7) * 18;
    const filament = ctx.createLinearGradient(0, 10, 0, length);
    filament.addColorStop(0, `rgba(158, 219, 226, ${alpha * 0.32})`);
    filament.addColorStop(1, `rgba(100, 183, 201, ${alpha * 0.025})`);
    ctx.beginPath();
    ctx.moveTo(i * 10, 10);
    ctx.bezierCurveTo(i * 9 + sway, 40, i * 12 - sway, 76, i * 10 + sway * 1.4, length);
    ctx.strokeStyle = filament;
    ctx.lineWidth = i % 2 === 0 ? 1.5 : 0.8;
    ctx.stroke();
  }

  const bell = ctx.createRadialGradient(-12, -32, 2, 0, -9, 60);
  bell.addColorStop(0, `rgba(194, 236, 240, ${alpha * 0.65})`);
  bell.addColorStop(0.5, `rgba(102, 186, 203, ${alpha * 0.34})`);
  bell.addColorStop(1, `rgba(44, 112, 144, ${alpha * 0.07})`);
  ctx.beginPath();
  ctx.moveTo(-44, 4);
  ctx.bezierCurveTo(-42, -34, -20, -50, 0, -52);
  ctx.bezierCurveTo(20, -50, 42, -34, 44, 4);
  ctx.quadraticCurveTo(20, 28, 0, 17);
  ctx.quadraticCurveTo(-20, 28, -44, 4);
  ctx.closePath();
  ctx.fillStyle = bell;
  ctx.fill();
  ctx.strokeStyle = `rgba(215, 240, 242, ${alpha * 0.24})`;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Quiet internal ribs give the bell volume without a bright outline.
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.bezierCurveTo(i * 22, -37, i * 30, -10, i * 25, 13);
    ctx.strokeStyle = `rgba(196, 235, 239, ${alpha * 0.12})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 6, 40, 10, 0, 0, Math.PI);
  ctx.strokeStyle = `rgba(188, 233, 236, ${alpha * 0.3})`;
  ctx.stroke();
  ctx.restore();
}

export function deepBlueImmersion(focus: number, reducedMotion = false) {
  const strength = Math.max(0, Math.min(1, focus));
  return { strength, travel: reducedMotion ? 0 : strength, zoom: 1 + (reducedMotion ? 0 : strength * 0.12) };
}

export const paintDeepBlue: ScenePainter = ({ ctx, w, h, t, particles, focus = 0, reducedMotion = false }) => {
  if (w <= 0 || h <= 0) return;
  const { strength, travel, zoom } = deepBlueImmersion(focus, reducedMotion);
  const guide = followLightPosition("jelly", t, reducedMotion);
  // Light is absorbed as the water deepens, with no visible seabed or horizon.
  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, "#103c50");
  sea.addColorStop(0.24, "#092c40");
  sea.addColorStop(0.62, "#041a2c");
  sea.addColorStop(1, "#010812");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);

  // Soft shafts disappear into the water instead of ending in solid polygons.
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(w * (0.17 + i * 0.18) + Math.sin(t * 0.055 + i) * w * 0.012, -h * 0.12);
    ctx.rotate(-0.16 + i * 0.035);
    ctx.scale(w * (0.035 + (i % 2) * 0.018), h * (0.78 + (i % 3) * 0.08));
    const shaft = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    shaft.addColorStop(0, "rgba(119, 199, 218, 0.13)");
    shaft.addColorStop(0.45, "rgba(83, 161, 190, 0.045)");
    shaft.addColorStop(1, "rgba(55, 133, 171, 0)");
    ctx.fillStyle = shaft;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  // Descending leaves the surface light above us, while the animals stay luminous.
  ctx.fillStyle = `rgba(0,7,20,${strength * 0.34})`;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.5);
  ctx.scale(1 + travel * 0.025, 1 + travel * 0.025);
  ctx.translate(-w * 0.5, -h * (0.5 + travel * 0.018));

  // Very distant silhouettes establish scale behind the original three jellies.
  const fit = Math.min(1, w / 650, h / 550);
  jelly(ctx, w * 0.39 + Math.sin(t * 0.09) * 8 * fit, h * 0.24 + Math.sin(t * 0.16 + 1) * 14 * fit, 0.25 * fit, t, 4.5, 0.16);
  jelly(ctx, w * 0.88 + Math.sin(t * 0.1 + 1) * 9 * fit, h * 0.68 + Math.sin(t * 0.14) * 18 * fit, 0.32 * fit, t, 2.4, 0.19);

  ctx.restore();
  ctx.save();
  ctx.translate(w * 0.5 - (guide.x - 0.55) * w * travel * 0.12, h * 0.5);
  ctx.scale(zoom, zoom);
  ctx.translate(-w * 0.5, -h * (0.5 + travel * 0.04));

  // Smaller, slower specks read as distant suspended matter; larger ones drift nearby.
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const depth = 0.25 + p.s * 0.75;
    const x = ((p.x + Math.sin(t * 0.09 + p.phase) * 0.014 * depth) % 1 + 1) % 1 * w;
    const y = ((p.y - t * depth * 0.0025) % 1 + 1) % 1 * h;
    ctx.beginPath();
    ctx.arc(x, y, (0.35 + p.r * 0.42) * depth, 0, TAU);
    ctx.fillStyle = `rgba(164, 225, 236, ${0.025 + depth * 0.045})`;
    ctx.fill();
  }

  // Each jelly rides a different current, rising and settling over 25–35 seconds.
  jelly(ctx, w * 0.22 + Math.sin(t * 0.15 + 1.7) * 20 * fit, h * 0.50 + Math.sin(t * 0.22 + 1.7) * 32 * fit, 0.55 * fit, t, 1.7, 0.42 + strength * 0.07);
  jelly(ctx, w * 0.78 + Math.sin(t * 0.12 + 3.2) * 24 * fit, h * 0.36 + Math.sin(t * 0.18 + 3.2) * 38 * fit, 0.72 * fit, t, 3.2, 0.48 + strength * 0.08);
  jelly(ctx, w * 0.52 + Math.sin(t * 0.14) * 30 * fit, h * 0.56 + Math.sin(t * 0.20) * 46 * fit - Math.sin(t * 0.85) * 3 * fit, 1.25 * fit, t, 0, 0.78 + strength * 0.10);

  // The guide settles a little deeper as the camera follows it into the water.
  ctx.save();
  ctx.translate(0, h * travel * 0.09);
  paintFollowLight(ctx, "jelly", w, h, t, strength, reducedMotion);
  ctx.restore();
  ctx.restore();

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.38, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.76);
  vignette.addColorStop(0, "rgba(0,4,12,0)");
  vignette.addColorStop(1, "rgba(0,4,12,.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
