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
    speed: still ? 0 : (immersive ? 0.72 : 0.24) * Math.max(0, Math.min(2, motionScale)),
    grainAnimated: !still,
  };
}
