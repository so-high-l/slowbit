import type { SoundId, Visual } from "./types";
export const silentMix: Record<SoundId, number> = {
  rain: 0,
  fire: 0,
  wind: 0,
  forest: 0,
  brown: 0,
  night: 0,
  tones: 0,
};
export function sceneMix(
  visual: Pick<Visual, "defaultSounds">,
): Record<SoundId, number> {
  return { ...silentMix, ...visual.defaultSounds };
}
