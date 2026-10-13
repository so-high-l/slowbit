import { glow } from "./drawing.ts";

const TAU = Math.PI * 2;
const noise = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Fixed pools keep the field stable through toggles, resizing, and long sessions.
export const orbitStars = Array.from({ length: 420 }, (_, i) => ({
  x: noise(i), y: noise(i + 500), depth: 0.2 + noise(i + 1000) * 0.8,
  size: i % 29 === 0 ? 1.25 : 0.4 + noise(i + 1500) * 0.55,
  alpha: i % 29 === 0 ? 0.52 : 0.13 + noise(i + 2000) * 0.19,
  phase: noise(i + 2500) * TAU,
}));
export const orbitDust = Array.from({ length: 42 }, (_, i) => ({
  x: noise(i + 3000), y: noise(i + 3500), depth: 0.5 + noise(i + 4000) * 0.5,
  size: 0.6 + noise(i + 4500) * 0.9, phase: noise(i + 5000) * TAU,
}));

const wrap = (value: number, extent: number) => ((value % extent) + extent) % extent;
export function spacePoint(point: { x: number; y: number; depth: number; phase: number }, w: number, h: number, time: number, dust = false) {
  const speed = dust ? 1.5 : 0.85;
  // Wrap beyond the canvas edge so points never visibly pop in or out.
  return {
    x: wrap(point.x * (w + 24) + time * point.depth * speed, w + 24) - 12,
    y: wrap(point.y * (h + 24) - time * point.depth * speed * 0.3 + Math.sin(time * 0.07 + point.phase) * point.depth * 4, h + 24) - 12,
  };
}

export function distantComet(time: number, reducedMotion = false) {
  // A single quiet visitor, beginning after 18 seconds and returning every 74s.
  const progress = ((time % 74) - 18) / 14;
  if (reducedMotion || progress <= 0 || progress >= 1) return null;
  return { x: 0.16 + progress * 0.5, y: 0.14 + progress * 0.18, alpha: Math.sin(progress * Math.PI) ** 2 * 0.3 };
}

export function paintOrbitSpace(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, dx: number, dy: number, reducedMotion: boolean) {
  const clock = reducedMotion ? 0 : time;
  for (const star of orbitStars) {
    const point = spacePoint(star, w, h, clock);
    const shimmer = reducedMotion ? 1 : 0.84 + Math.sin(clock * (0.18 + star.depth * 0.14) + star.phase) * 0.16;
    const x = point.x - dx * star.depth * 0.4, y = point.y - dy * star.depth * 0.4;
    if (star.size > 1) glow(ctx, x, y, 5, `rgba(183,215,239,${star.alpha * shimmer * 0.16})`);
    ctx.fillStyle = `rgba(204,224,236,${star.alpha * shimmer})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, TAU);
    ctx.fill();
  }
  for (const dust of orbitDust) {
    const point = spacePoint(dust, w, h, clock, true);
    ctx.fillStyle = `rgba(140,177,200,${0.055 + dust.depth * 0.045})`;
    ctx.beginPath();
    ctx.arc(point.x - dx * 0.8, point.y - dy * 0.8, dust.size, 0, TAU);
    ctx.fill();
  }
  const comet = distantComet(clock, reducedMotion);
  if (!comet) return;
  const x = comet.x * w, y = comet.y * h;
  const tailX = x - w * 0.035, tailY = y - h * 0.0126;
  const trail = ctx.createLinearGradient(tailX, tailY, x, y);
  trail.addColorStop(0, "rgba(173,204,229,0)");
  trail.addColorStop(1, `rgba(173,204,229,${comet.alpha * 0.5})`);
  ctx.strokeStyle = trail;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.stroke();
  glow(ctx, x, y, 5, `rgba(196,222,242,${comet.alpha * 0.2})`);
  ctx.fillStyle = `rgba(210,231,244,${comet.alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, 1, 0, TAU);
  ctx.fill();
}
