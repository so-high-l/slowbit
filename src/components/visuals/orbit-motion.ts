// Suggested angular increments at a 60 Hz reference rate, integrated in seconds.
export const orbitSpeeds = {
  mercury: 0.00032, venus: 0.00024, earth: 0.00019, mars: 0.00015,
  jupiter: 0.00008, saturn: 0.00006, uranus: 0.00004, neptune: 0.00003,
};
const orbitSpeedMultiplier = 1.25;
export function createOrbitMotion() {
  return { strength: 0, elapsed: 0, mercury: 0, venus: 0, earth: 0, mars: 0, jupiter: 0, saturn: 0, uranus: 0, neptune: 0 };
}
export type OrbitMotion = ReturnType<typeof createOrbitMotion>;
/** Project positions only: planet textures stay round in the tilted plane. */
export function projectOrbit(radius: number, angle: number, strength: number) {
  const rotation = -Math.PI / 30 * strength;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * (1 - 0.26 * strength);
  return {
    x: x * Math.cos(rotation) - y * Math.sin(rotation),
    y: x * Math.sin(rotation) + y * Math.cos(rotation),
    depth: Math.sin(angle) * radius,
    sizeScale: 1 + Math.sin(angle) * 0.07 * strength,
  };
}
export function advanceOrbitMotion(state: OrbitMotion, seconds: number) {
  state.elapsed += seconds;
  const speed = 0.3 + state.strength * 0.7;
  for (const key of Object.keys(orbitSpeeds) as (keyof typeof orbitSpeeds)[]) {
    const angle = state[key] + orbitSpeeds[key] * orbitSpeedMultiplier * 60 * seconds * speed;
    // Equivalent angles keep long sessions bounded without visible jumps.
    state[key] = Math.atan2(Math.sin(angle), Math.cos(angle));
  }
}
export function orbitEffects(state?: OrbitMotion, reduced = false) {
  const strength = state?.strength ?? 0;
  const motion = reduced ? 0 : strength;
  const elapsed = state?.elapsed ?? 0;
  return {
    planeStrength: motion,
    planeY: 1 - motion * 0.26,
    rotation: -Math.PI / 30 * motion,
    scale: 1 + motion * 0.75,
    lineAlpha: 0.20 + strength * 0.07,
    pulse: 1 + motion * 0.04 * Math.sin(elapsed * Math.PI / 4),
    x: Math.sin(elapsed * Math.PI / 20) * motion * 0.002,
    y: Math.sin(elapsed * Math.PI / 26) * motion * 0.0015,
  };
}
