import type { SoundId, VisualId } from "./types";
export type RecordedChannel = Exclude<SoundId, "tones">;
export type RecordingProfile = { file: string; level: number; cutoff: number; highpass?: number };
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
  if (channel === "brown") return { file: "soft-brown-noise.flac", level: 0.12, cutoff: 1800, highpass: 60 };
  if (channel === "night") return { file: "night-crickets.wav", level: 1, cutoff: 12000 };
  if (channel === "fire") return { file: "mixkit-campfire-crackles-1330.wav", level: 1, cutoff: 12000 };
  if (channel === "rain") {
    if (water.includes(scene)) return { file: files.water, level: scene === "jelly" ? 0.24 : 0.4, cutoff: scene === "jelly" ? 650 : 4500, highpass: 90 };
    if (woodland.includes(scene)) return { file: files.forestRain, level: 0.35, cutoff: 4500, highpass: 80 };
    return { file: files.rain, level: 0.55, cutoff: scene === "vinyl" ? 2200 : 6000, highpass: 80 };
  }
  if (channel === "forest") return {
    file: ["meadow", "drift", "pond"].includes(scene) ? files.birds : files.forest,
    level: 0.45, cutoff: 6500,
  };
  if (scene === "pond") return { file: files.wind, level: 0.08, cutoff: 700, highpass: 100 };
  if (woodland.includes(scene)) return { file: files.forest, level: 0.3, cutoff: 2600 };
  // Open water keeps its existing R2 recording until a surface loop is approved.
  // Surface detail stays audible in Open water. Deep blue loses the splashing
  // highs, but also removes sub-bass so "depth" does not mean a heavy rumble.
  if (scene === "ocean") return { file: files.water, level: 0.3, cutoff: 4200, highpass: 80 };
  if (scene === "jelly") return { file: "underwater-loop.wav", level: 0.16, cutoff: 1200, highpass: 90 };
  if (water.includes(scene)) return { file: files.water, level: 0.2, cutoff: 1800, highpass: 80 };
  const sheltered = ["rain", "vinyl", "lantern", "ink"].includes(scene);
  return { file: files.wind, level: sheltered ? 0.12 : 0.22, cutoff: sheltered ? 700 : scene === "snow" ? 1200 : 2200 };
}
