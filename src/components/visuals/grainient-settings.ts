export type GrainientSceneSettingsInput = {
  paused?: boolean;
  immersive?: boolean;
  motionScale?: number;
  reducedMotion?: boolean;
};

export function grainientSceneSettings({
  paused = false,
  immersive = false,
  motionScale = 1,
  reducedMotion = false,
}: GrainientSceneSettingsInput) {
  const still = paused || reducedMotion;
  return {
    speed: still ? 0 : (immersive ? 0.78 : 0.52) * Math.max(0, Math.min(2, motionScale)),
    bloom: reducedMotion ? 0 : immersive ? 1 : 0,
    frozen: still,
    grainAnimated: !still,
  };
}
