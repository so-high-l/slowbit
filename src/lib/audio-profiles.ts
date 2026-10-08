import type { SoundId, VisualId } from "./types";
export type RecordedChannel = Exclude<SoundId, "brown" | "tones">;
export type RecordingProfile = { file: string; level: number; cutoff: number };
const files = {
  rain: "mixkit-light-rain-looping-1249.wav",
  forestRain: "mixkit-forest-rain-loop-1225.wav",
  water: "mixkit-water-flowing-ambience-loop-3126.wav",
  wind: "mixkit-wind-howl-exterior-1276.wav",
  forest: "mixkit-forest-ambience-loop-1228.wav",
  birds: "mixkit-birds-in-forest-loop-1239.wav",
};
const woodland: VisualId[] = ["meadow", "pond", "drift", "embers", "nightSky"];
const water: VisualId[] = ["ocean", "pond", "mist", "jelly"];

// Variants live beneath the existing sliders; scene changes never add controls.
export function recordingProfile(scene: VisualId, channel: RecordedChannel): RecordingProfile {
  if (channel === "night") return { file: "night-crickets.wav", level: 1, cutoff: 12000 };
  if (channel === "fire") return { file: "mixkit-campfire-crackles-1330.wav", level: 1, cutoff: 12000 };
  if (channel === "rain") {
    if (water.includes(scene)) return { file: files.water, level: 0.4, cutoff: scene === "jelly" ? 700 : 4500 };
    if (woodland.includes(scene)) return { file: files.forestRain, level: 0.5, cutoff: 5500 };
    return { file: files.rain, level: 1, cutoff: scene === "vinyl" ? 2200 : 10000 };
  }
  if (channel === "forest") return {
    file: ["meadow", "drift", "pond"].includes(scene) ? files.birds : files.forest,
    level: 0.45, cutoff: 6500,
  };
  if (woodland.includes(scene)) return { file: files.forest, level: 0.3, cutoff: 2600 };
  if (water.includes(scene)) return { file: files.water, level: 0.2, cutoff: scene === "jelly" ? 450 : 1800 };
  const sheltered = ["rain", "vinyl", "lantern", "ink"].includes(scene);
  return { file: files.wind, level: sheltered ? 0.12 : 0.22, cutoff: sheltered ? 700 : scene === "snow" ? 1200 : 2200 };
}
