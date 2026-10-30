import type { SoundId, Visual } from "./types";
export const silentMix: Record<SoundId, number> = {
  ambience: 0,
  texture: 0,
  textureTone: 0,
  pondDrops: 0,
  binaural: 0,
  orbitalPad: 0,
  rain: 0,
  fire: 0,
  wind: 0,
  forest: 0,
  seaBirds: 0,
  brown: 0,
  night: 0,
  tones: 0,
  train: 0,
  piano: 0,
  lofi: 0,
  vinylMusic: 0,
};
export function sceneMix(
  visual: Pick<Visual, "defaultSounds">,
): Record<SoundId, number> {
  return { ...silentMix, ...visual.defaultSounds };
}
