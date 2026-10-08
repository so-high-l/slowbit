export interface InkPoint { x: number; y: number; pressure: number }
export interface InkTrail {
  points: InkPoint[];
  seed: number;
  time: number;
  remainder: number;
  angle: number;
  x: number;
  y: number;
}
const STEP = 1 / 20;
export const INK_TRAIL_LENGTH = 360;

function noise(t: number, seed: number) {
  const hash = (i: number) => {
    let n = Math.imul(i ^ seed, 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return ((n ^ (n >>> 16)) >>> 0) / 0xffffffff * 2 - 1;
  };
  const i = Math.floor(t);
  const f = t - i;
  const blend = f * f * f * (f * (f * 6 - 15) + 10);
  return hash(i) * (1 - blend) + hash(i + 1) * blend;
}

function step(trail: InkTrail) {
  trail.time += STEP;
  const t = trail.time;
  const curl = noise(t * 0.19, trail.seed) * 1.3 + noise(t * 0.47, trail.seed + 71) * 0.48;
  const radius = Math.hypot(trail.x, trail.y);
  // Turn gently toward the centre before reaching the edge, without bouncing.
  const home = Math.atan2(-trail.y, -trail.x);
  const difference = Math.atan2(Math.sin(home - trail.angle), Math.cos(home - trail.angle));
  const inward = Math.max(0, (radius - 0.55) / 0.35);
  trail.angle += (curl + difference * inward * inward * 2) * STEP;
  trail.angle = Math.atan2(Math.sin(trail.angle), Math.cos(trail.angle));
  const speed = 0.125 + noise(t * 0.13, trail.seed + 193) * 0.027;
  trail.x += Math.cos(trail.angle) * speed * STEP;
  trail.y += Math.sin(trail.angle) * speed * STEP;
  trail.points.push({ x: trail.x, y: trail.y, pressure: 0.65 + noise(t * 0.24, trail.seed + 37) * 0.35 });
  if (trail.points.length > INK_TRAIL_LENGTH) trail.points.shift();
}

export function createInkTrail(seed: number): InkTrail {
  const trail: InkTrail = { points: [], seed: seed | 0, time: 0, remainder: 0, angle: seed % (Math.PI * 2), x: 0.1, y: 0 };
  // An established stroke is visible immediately, including with reduced motion.
  for (let i = 0; i < INK_TRAIL_LENGTH; i++) step(trail);
  return trail;
}

export function advanceInkTrail(trail: InkTrail, delta: number) {
  // Do not fast-forward after a hidden tab or a stalled frame.
  trail.remainder += Math.max(0, Math.min(delta, 0.1));
  while (trail.remainder >= STEP - 1e-9) {
    step(trail);
    trail.remainder -= STEP;
  }
}
