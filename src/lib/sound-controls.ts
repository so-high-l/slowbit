import type { SoundId, SoundMix, VisualId } from "./types";
import { sceneSoundscapes } from "./scene-soundscapes.ts";
import { silentMix } from "./sound-presets.ts";

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
  if (id === "lofi" && scene === "readingRoom") return "Jazz Radio";
  if (id === "lofi" && scene === "japaneseCafe") return "Café Lo-fi Radio";
  if (id === "lofi" && scene === "trainCarriage") return "Carriage Lo-fi Radio";
  if (id === "lofi" && scene === "chromaticDrift") return "777 Hz + ambience";
  if (id === "lofi" && scene === "loceanRooftop") return "L’océan Radio";
  if (id === "ambience") return sceneSoundscapes[scene]?.ambience?.name ?? fallback;
  if (id === "texture") return sceneSoundscapes[scene]?.texture?.name ?? fallback;
  if (id === "textureTone") return scene === "clouds" ? "Air harmonics" : "Low hum";
  if (id === "seaBirds" && scene === "loceanRooftop") return "Sea birds";
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

/** Z changes the live room mix without modifying its persisted slider values. */
export function readingRoomImmersiveMix(volumes: SoundMix, immersive: boolean): SoundMix {
  if (!immersive) return volumes;
  return {
    ...silentMix,
    rain: volumes.rain,
    lofi: Math.min(1, volumes.lofi * 4.8),
  };
}

/** The café field recording recedes naturally when the view moves outdoors. */
export function japaneseCafeImmersiveMix(volumes: SoundMix, outside: boolean): SoundMix {
  if (!outside) return volumes;
  return {
    ...volumes,
    ambience: volumes.ambience * 0.28,
  };
}

/** Moving closer to the glass softens the full carriage mix without changing saved sliders. */
export function trainCarriageImmersiveMix(volumes: SoundMix, immersive: boolean): SoundMix {
  if (!immersive) return volumes;
  return {
    ...volumes,
    lofi: volumes.lofi * 0.82,
    train: volumes.train * 0.55,
    rain: volumes.rain * 0.55,
  };
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
