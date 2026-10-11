import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Persistent dust follows a changing field rather than restarting on each frame.
type Dust = { x: number; y: number; depth: number; seed: number };
type Field = { points: Dust[]; last: number; clock: number; release: number };
const fields = new WeakMap<CanvasRenderingContext2D, Field>();

export const paintMagneticField: ScenePainter = ({ ctx, w, h, t, focus = 0 }) => {
  if (w <= 0 || h <= 0) return;
  let state = fields.get(ctx);
  if (!state || t < state.last) {
    state = {
      points: Array.from({ length: 1200 }, (_, i) => ({
        x: random(i + 1), y: random(i + 2000),
        depth: random(i + 4000), seed: i,
      })),
      last: t, clock: 0, release: focus,
    };
    fields.set(ctx, state);
  }
  const dt = Math.min(0.08, Math.max(0, t - state.last));
  state.last = t;
  state.clock += dt * (1 + focus * 0.45);
  state.release = focus;
  const clock = state.clock;
  const release = focus * focus * (3 - 2 * focus);
  const unit = Math.min(w, h);
  background(ctx, w, h, "#03080e", "#09151d");

  const poles = [
    { x: 0.35 + Math.sin(clock * 0.047) * 0.12, y: 0.48 + Math.cos(clock * 0.031) * 0.15, spin: 1 },
    { x: 0.65 + Math.cos(clock * 0.039 + 1) * 0.12, y: 0.52 + Math.sin(clock * 0.027) * 0.17, spin: -1 },
  ];
  for (const [i, pole] of poles.entries()) {
    glow(ctx, pole.x * w, pole.y * h, unit * 0.29,
      i ? `rgba(104,124,165,${0.045 * (1 - release)})` : `rgba(67,145,147,${0.055 * (1 - release)})`);
  }

  // Bounded, low-speed flow: curl around diffuse poles, then loose currents on release.
  for (const point of state.points) {
    const oldX = point.x;
    const oldY = point.y;
    const driftX = Math.sin(point.y * 7 + clock * 0.09 + point.seed * 0.03) * 0.006;
    const driftY = Math.cos(point.x * 6 - clock * 0.07 + point.seed * 0.02) * 0.004;
    let vx = driftX;
    let vy = driftY;
    for (const pole of poles) {
      const dx = (point.x - pole.x) * w / unit;
      const dy = (point.y - pole.y) * h / unit;
      const distance = Math.hypot(dx, dy);
      const strength = (1 - release) * 0.012 / (0.12 + distance);
      vx += (-dy * pole.spin - dx * 0.12) * strength * unit / w;
      vy += (dx * pole.spin - dy * 0.12) * strength * unit / h;
    }
    const speed = 0.45 + point.depth * 0.65;
    point.x += vx * dt * speed;
    point.y += vy * dt * speed;
    // Recycle offscreen with no growing particle pools or trail buffers.
    if (point.x < -0.04) point.x = 1.04;
    if (point.x > 1.04) point.x = -0.04;
    if (point.y < -0.04) point.y = 1.04;
    if (point.y > 1.04) point.y = -0.04;
    const edge = Math.min(1, Math.max(0, Math.min(point.x, 1 - point.x, point.y, 1 - point.y) * 12));
    const alpha = (0.09 + point.depth * 0.32) * edge;
    const x = point.x * w;
    const y = point.y * h;
    const radius = 0.35 + point.depth * 0.8;
    if (point.depth > 0.88) glow(ctx, x, y, 4, `rgba(146,210,218,${alpha * 0.14})`);
    ctx.fillStyle = point.seed % 3 ? `rgba(140,195,199,${alpha})` : `rgba(203,212,227,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    if (dt > 0 && Math.abs(point.x - oldX) < 0.1 && Math.abs(point.y - oldY) < 0.1) {
      ctx.strokeStyle = `rgba(139,201,209,${alpha * 0.32 * (1 - release)})`;
      ctx.lineWidth = radius * 0.65;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - vx * w * 1.4, y - vy * h * 1.4);
      ctx.stroke();
    }
  }
};
