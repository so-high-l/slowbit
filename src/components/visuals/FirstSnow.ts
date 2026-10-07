import { background, glow, type ScenePainter } from "./drawing";

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 122.3) * 43758.5453);

export const paintFirstSnow: ScenePainter = ({ ctx, w, h, t, particles }) => {
  background(ctx, w, h, "#071018", "#263541");

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#07111b");
  sky.addColorStop(0.55, "#1f2e39");
  sky.addColorStop(1, "#0b171d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Moon glow behind thin winter clouds
  const moonX = w * 0.73;
  const moonY = h * 0.21;
  glow(ctx, moonX, moonY, Math.min(w, h) * 0.18, "#dfe9ed22");
  ctx.beginPath();
  ctx.arc(moonX, moonY, Math.min(w, h) * 0.026, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(225, 234, 235, .58)";
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const cx = ((w * (0.18 + i * 0.2) + t * (2 + i * 0.2)) % (w * 1.25)) - w * 0.12;
    const cy = h * (0.15 + i * 0.035);
    const cloud = ctx.createRadialGradient(cx, cy, 5, cx, cy, w * 0.16);
    cloud.addColorStop(0, "rgba(178,193,201,.045)");
    cloud.addColorStop(1, "rgba(178,193,201,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(0, cy - 90, w, 180);
  }

  // Snowy village / treeline silhouettes
  ctx.fillStyle = "rgba(4, 11, 16, .7)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.68);
  for (let x = 0; x <= w; x += 50) {
    const y = h * 0.64 + Math.sin(x * 0.013) * 15;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // A few warm cabin windows in the distance
  for (let i = 0; i < 8; i++) {
    const x = w * (0.12 + rand(i + 5) * 0.76);
    const y = h * (0.64 + rand(i + 15) * 0.12);
    glow(ctx, x, y, 20 + rand(i + 20) * 10, "#e6b16b2b");
    ctx.fillStyle = "rgba(238, 184, 106, .45)";
    ctx.fillRect(x - 2, y - 2, 4, 3);
  }

  // Snow bank
  const snow = ctx.createLinearGradient(0, h * 0.78, 0, h);
  snow.addColorStop(0, "rgba(176, 195, 201, .14)");
  snow.addColorStop(1, "rgba(55, 70, 78, .28)");
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.82);
  ctx.quadraticCurveTo(w * 0.25, h * 0.76, w * 0.48, h * 0.84);
  ctx.quadraticCurveTo(w * 0.72, h * 0.89, w, h * 0.79);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Fine snowfall using your reusable particle pool.
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const speed = 0.008 + p.s * 0.012;
    const y = ((p.y + t * speed) % 1) * h;
    const drift = Math.sin(t * 0.22 + i * 1.7) * (4 + p.s * 5);
    const x = p.x * w + drift;
    const r = 0.7 + p.r * 1.2;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232, 240, 242, ${0.18 + p.s * 0.14})`;
    ctx.fill();
  }

  // Larger, soft foreground flakes - very sparse.
  for (let i = 0; i < 9; i++) {
    const y = ((rand(i + 100) + t * (0.006 + rand(i + 200) * 0.005)) % 1) * h;
    const x = (rand(i + 300) * w + Math.sin(t * 0.17 + i) * 22);
    const r = 2.2 + rand(i + 400) * 4.5;
    glow(ctx, x, y, r * 3.8, "rgba(240,246,247,.08)");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(240,246,247,.10)";
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.4, 80, w * 0.5, h * 0.5, Math.max(w, h) * 0.76);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.36)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
