import type { SoundId, SoundMix, VisualId } from "./types";
import { sceneSoundscapes } from "./scene-soundscapes.ts";

// Retain the channel used by the default mix; never offer two copies of a file.
export function duplicateSound(scene: VisualId): { removed: SoundId; kept: SoundId } | undefined {
  if (scene === "embers" || scene === "nightSky") return { removed: "wind", kept: "forest" };
  if (scene === "ocean" || scene === "mist") return { removed: "rain", kept: "wind" };
}

export function hasAirTones(scene: VisualId) {
  return scene === "clouds" || scene === "ribbonTunnel";
}

export function soundLabel(scene: VisualId, id: SoundId, fallback: string): string {
  if (id === "lofi" && scene === "nightDrive") return "Lo-fi Radio";
  if (id === "ambience") return sceneSoundscapes[scene]?.ambience?.name ?? fallback;
  if (id === "texture") return sceneSoundscapes[scene]?.texture?.name ?? fallback;
  if (id === "textureTone") return scene === "clouds" ? "Air harmonics" : "Low hum";
  if (id === "forest" && ["meadow", "drift", "pond"].includes(scene)) return "Birdsong";
  if (id === "wind") {
    if (scene === "jelly") return "Underwater ambience";
    if (scene === "orbitStudy") return "Soft water";
    if (["ocean", "mist"].includes(scene)) return "Flowing water";
    if (["meadow", "drift", "embers", "nightSky"].includes(scene)) return "Forest ambience";
  }
  if (id === "rain") {
    if (["ocean", "pond", "mist", "jelly"].includes(scene)) return "Flowing water";
    if (["meadow", "drift", "embers", "nightSky"].includes(scene)) return "Forest rain";
  }
  return fallback;
}

// Migrate saved mixes before editing so an old hidden slider cannot keep playing
// or turn a newly muted control back on. Explicit values for split layers win.
export function migrateSoundControls(scene: VisualId, saved: Partial<SoundMix>): Partial<SoundMix> {
  const mix = { ...saved };
  if (scene === "jelly" && mix.night !== undefined) mix.night = 0;
  const duplicate = duplicateSound(scene);
  if (duplicate && mix[duplicate.removed] !== undefined) {
    if (mix[duplicate.removed]! > 0) mix[duplicate.kept] = Math.max(mix[duplicate.kept] ?? 0, mix[duplicate.removed]!);
    mix[duplicate.removed] = 0;
  }
  if (hasAirTones(scene) && mix.textureTone === undefined && mix.texture !== undefined) mix.textureTone = mix.texture;
  if (scene === "pond" && mix.pondDrops === undefined && (mix.ambience !== undefined || mix.wind !== undefined)) {
    const water = mix.ambience ?? sceneSoundscapes.pond!.mix.ambience ?? 0;
    mix.pondDrops = water > 0 ? water : mix.wind ?? 0;
  }
  return mix;
}
