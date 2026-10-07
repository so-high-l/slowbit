import { background, glow, type ScenePainter } from "./drawing";

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
  const pulse = 1 + Math.sin(t * 0.75 + phase) * 0.035;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale * pulse);

  glow(ctx, 0, 0, 72, `rgba(120, 205, 220, ${alpha * 0.28})`);

  const bell = ctx.createLinearGradient(0, -45, 0, 36);
  bell.addColorStop(0, `rgba(188, 234, 237, ${alpha * 0.62})`);
  bell.addColorStop(0.55, `rgba(89, 169, 183, ${alpha * 0.25})`);
  bell.addColorStop(1, "rgba(55,130,145,0)");

  ctx.beginPath();
  ctx.moveTo(-44, 4);
  ctx.bezierCurveTo(-42, -34, -20, -50, 0, -52);
  ctx.bezierCurveTo(20, -50, 42, -34, 44, 4);
  ctx.quadraticCurveTo(20, 28, 0, 17);
  ctx.quadraticCurveTo(-20, 28, -44, 4);
  ctx.closePath();
  ctx.fillStyle = bell;
  ctx.fill();

  ctx.strokeStyle = `rgba(215, 240, 242, ${alpha * 0.2})`;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 13, 16);
    const sway = Math.sin(t * 0.55 + phase + i) * 8;
    ctx.bezierCurveTo(
      i * 10 + sway,
      45,
      i * 15 - sway,
      75,
      i * 10 + sway * 0.4,
      105 + Math.abs(i) * 5,
    );
    ctx.strokeStyle = `rgba(143, 214, 220, ${alpha * 0.15})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  ctx.restore();
}

export const paintDeepBlue: ScenePainter = ({ ctx, w, h, t, particles }) => {
  background(ctx, w, h, "#020b15", "#0a3543");

  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, "#03101d");
  sea.addColorStop(0.35, "#073044");
  sea.addColorStop(0.75, "#072734");
  sea.addColorStop(1, "#020a10");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);

  // Light filtering down from the distant surface
  for (let i = 0; i < 5; i++) {
    const x = w * (0.18 + i * 0.17);
    ctx.beginPath();
    ctx.moveTo(x - 35, 0);
    ctx.lineTo(x + 90, h * 0.75);
    ctx.lineTo(x + 155, h * 0.75);
    ctx.lineTo(x + 20, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(92, 162, 177, ${0.018 + i * 0.004})`;
    ctx.fill();
  }

  // Fine drifting plankton
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const x = (p.x * w + Math.sin(t * 0.11 + i) * 10) % w;
    const y = ((p.y - t * p.s * 0.004 + 1) % 1) * h;
    const a = 0.025 + p.s * 0.03;

    ctx.beginPath();
    ctx.arc(x, y, 0.6 + p.r * 0.8, 0, TAU);
    ctx.fillStyle = `rgba(164, 225, 226, ${a})`;
    ctx.fill();
  }

  // Distant jellyfish
  jelly(ctx, w * 0.22, h * (0.5 + Math.sin(t * 0.12) * 0.025), 0.55, t, 1.7, 0.42);
  jelly(ctx, w * 0.78, h * (0.36 + Math.sin(t * 0.1 + 2) * 0.02), 0.72, t, 3.2, 0.48);

  // Main focal jellyfish
  jelly(ctx, w * 0.52 + Math.sin(t * 0.08) * 18, h * (0.56 + Math.sin(t * 0.1) * 0.035), 1.25, t, 0, 0.78);

  // Sea floor suggestion
  const floor = ctx.createLinearGradient(0, h * 0.82, 0, h);
  floor.addColorStop(0, "rgba(2, 10, 13, 0)");
  floor.addColorStop(1, "rgba(1, 6, 8, .72)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.47, 60, w * 0.5, h * 0.52, Math.max(w, h) * 0.76);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
