// Recycle points near the vanishing point so forward motion has no zoom limit
// and never grows the particle pool or canvas resolution.
export function advanceDepth<T extends { x: number; y: number }>(
  points: T[],
  delta: number,
  strength: number,
  speed: number,
  random = Math.random,
) {
  const scale = Math.exp(Math.min(delta, 0.1) * strength * speed);
  for (const point of points) {
    point.x = 0.5 + (point.x - 0.5) * scale;
    point.y = 0.5 + (point.y - 0.5) * scale;
    if (
      point.x < -0.08 ||
      point.x > 1.08 ||
      point.y < -0.08 ||
      point.y > 1.08
    ) {
      const angle = random() * Math.PI * 2;
      const radius = 0.012 + random() * 0.045;
      point.x = 0.5 + Math.cos(angle) * radius;
      point.y = 0.5 + Math.sin(angle) * radius;
    }
  }
}
