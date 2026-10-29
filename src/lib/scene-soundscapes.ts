import type { SoundMix, VisualId } from "./types";

// R2 keys are relative to /audio/. Original WAV/FLAC uploads are decoded directly.
// These scene-specific assets do not apply to Open water.
// nativeLoop means the creator supplies a loop, not that it has been auditioned
// in this app. Keep the complete original cycle during conversion.
export const sceneAudioAssets = {
  machinePad: { file: "quiet-machine-d-minor-loop.wav", author: "Slowbit", source: "scripts/generate-quiet-machine-pad.py", nativeLoop: true },
  deepPassageDrone: { file: "liecio-mysterious-drone-pad-in-perfect-loop-257593.mp3", author: "Liecio", source: "https://pixabay.com/sound-effects/musical-mysterious-drone-pad-in-perfect-loop-257593/", nativeLoop: true },
  polar: { file: "527281__dlgebert__monologue-wind.wav", author: "dlgebert", source: "https://freesound.org/people/dlgebert/sounds/527281/", nativeLoop: true },
  city: { file: "223093__qubodup__seamless-city-loop.flac", author: "qubodup", source: "https://freesound.org/people/qubodup/sounds/223093/", nativeLoop: true },
  pond: { file: "91919__filipe-chagas__waterlappingrockybeachambiance.wav", author: "Filipe Chagas", source: "https://freesound.org/people/Filipe%20Chagas/sounds/91919/", nativeLoop: false },
  cave: { file: "atmosbasement.mp3_.flac", author: "Independent.nu", source: "https://opengameart.org/content/dripping-water-loop", nativeLoop: true },
  brush: { file: "260263__richardemoore__wavesontheshore.wav", author: "richardemoore", source: "https://freesound.org/people/richardemoore/sounds/260263/", nativeLoop: true },
  vinyl: { file: "222684__unfa__vinyl-dust-loop-static-01.flac", author: "unfa", source: "https://freesound.org/people/unfa/sounds/222684/", nativeLoop: true },
  rural: { file: "825635__nicktayloe__night-insects-in-september-midwest-us-loop.wav", author: "NickTayloe", source: "https://freesound.org/people/NickTayloe/sounds/825635/", nativeLoop: true },
  vinylMusic: { file: "859607__blankierest__sleepy-upright-piano-seamless-loop.wav", author: "blankie.rest", source: "https://freesound.org/people/blankie.rest/sounds/859607/", nativeLoop: true },
  japaneseCafe: { file: "785167__artsnbytes__osaka-city-centre-cafe-calm.flac", author: "artsnbytes", source: "https://freesound.org/people/artsnbytes/sounds/785167/", nativeLoop: false },
} as const;

export type TextureKind = "tape" | "halo" | "float" | "air" | "round" | "bow" | "ribbon" | "current" | "chromatic" | "glass";
export type SceneSoundscape = {
  beatHz: number;
  carrierHz: number;
  playlist?: "lofi" | "nightDriveLofi" | "readingRoomJazz" | "japaneseCafeLofi" | "trainCarriageLofi" | "chromaticDriftAmbient";
  ambience?: { asset: keyof typeof sceneAudioAssets; name: string; cutoff: number; level: number };
  texture?: { kind: TextureKind; name: string };
  mix: Partial<SoundMix>;
};

// Beat differences are optional creative presets, not claims about mental states.
// Every scene starts with binaural volume at zero; ambience carries its identity.
export const sceneSoundscapes: Partial<Record<VisualId, SceneSoundscape>> = {
  quietMachine: { beatHz: 13, carrierHz: 200, playlist: "lofi", ambience: { asset: "machinePad", name: "Soft atmosphere", cutoff: 2600, level: 0.35 }, texture: { kind: "tape", name: "Analog tape" }, mix: { lofi: 0.2, ambience: 0.1, texture: 0, brown: 0.12, binaural: 0 } },
  nightDrive: { beatHz: 14, carrierHz: 210, playlist: "nightDriveLofi", mix: { lofi: 0.24, brown: 0.08, binaural: 0 } },
  readingRoom: { beatHz: 6.5, carrierHz: 196, playlist: "readingRoomJazz", mix: { rain: 0.18, night: 0.08, lofi: 0.05, binaural: 0 } },
  japaneseCafe: { beatHz: 8.5, carrierHz: 196, playlist: "japaneseCafeLofi", ambience: { asset: "japaneseCafe", name: "Café ambience", cutoff: 4600, level: 1 }, mix: { lofi: 0.14, ambience: 0.7, rain: 0.15, binaural: 0 } },
  trainCarriage: { beatHz: 9.5, carrierHz: 204, playlist: "trainCarriageLofi", mix: { train: 0.73, rain: 0.06, lofi: 0.21, binaural: 0 } },
  aurora: { beatHz: 6, carrierHz: 220, ambience: { asset: "polar", name: "Polar air", cutoff: 2200, level: 0.55 }, texture: { kind: "halo", name: "Luminous tones" }, mix: { ambience: 0.28, texture: 0.12, binaural: 0 } },
  stars: { beatHz: 3, carrierHz: 160, ambience: { asset: "city", name: "Distant city", cutoff: 1200, level: 0.55 }, mix: { ambience: 0.26, brown: 0.06, binaural: 0 } },
  embers: { beatHz: 4.5, carrierHz: 180, mix: { fire: 0.38, forest: 0.05, binaural: 0 } },
  drift: { beatHz: 7, carrierHz: 240, texture: { kind: "float", name: "Floating harmonics" }, mix: { texture: 0.34, brown: 0.05, binaural: 0 } },
  pond: { beatHz: 5, carrierHz: 196, ambience: { asset: "pond", name: "Water lapping", cutoff: 3600, level: 0.65 }, mix: { ambience: 0.30, pondDrops: 0.30, night: 0.03, binaural: 0 } },
  mist: { beatHz: 3.5, carrierHz: 146, ambience: { asset: "cave", name: "Cave drips", cutoff: 2600, level: 0.55 }, mix: { ambience: 0.27, brown: 0.04, binaural: 0 } },
  snow: { beatHz: 2.5, carrierHz: 174, mix: { brown: 0.2, binaural: 0, wind: 0.17 } },
  dunes: { beatHz: 8, carrierHz: 208, mix: { brown: 0.4, binaural: 0 } },
  clouds: { beatHz: 9, carrierHz: 262, texture: { kind: "air", name: "Cloud air" }, mix: { texture: 0.15, textureTone: 0.1, brown: 0.2, binaural: 0 } },
  ink: { beatHz: 10, carrierHz: 285, ambience: { asset: "brush", name: "Gentle water", cutoff: 3000, level: 0.55 }, texture: { kind: "round", name: "Rounded tones" }, mix: { ambience: 0.24, texture: 0.09, binaural: 0 } },
  vinyl: { beatHz: 5.5, carrierHz: 165, ambience: { asset: "vinyl", name: "Vinyl surface", cutoff: 2400, level: 0.10 }, mix: { ambience: 0.24, rain: 0.10, tones: 0.06, brown: 0.06, vinylMusic: 0.16, binaural: 0 } },
  nightSky: { beatHz: 4, carrierHz: 185, ambience: { asset: "rural", name: "Rural night", cutoff: 6000, level: 0.6 }, mix: { ambience: 0.05, forest: 0.03, binaural: 0 } },
  thread: { beatHz: 11, carrierHz: 247, texture: { kind: "bow", name: "Bowed harmonics" }, mix: { texture: 0.32, brown: 0.04, binaural: 0 } },
  ribbonTunnel: { beatHz: 7.5, carrierHz: 233, texture: { kind: "ribbon", name: "Moving air" }, mix: { texture: 0.05, textureTone: 0.5, brown: 0.05, binaural: 0 } },
  deepPassage: { beatHz: 1.5, carrierHz: 128, ambience: { asset: "deepPassageDrone", name: "Deep passage drone", cutoff: 3200, level: 0.45 }, texture: { kind: "current", name: "Deep current" }, mix: { ambience: 0.22, wind: 0.30, texture: 0, brown: 0, binaural: 0 } },
  chromaticDrift: { beatHz: 2, carrierHz: 202, playlist: "chromaticDriftAmbient", texture: { kind: "chromatic", name: "Chromatic hum" }, mix: { lofi: 0.22, texture: 0.04, binaural: 0 } },
  magneticField: { beatHz: 12, carrierHz: 294, texture: { kind: "glass", name: "Glass resonance" }, mix: { texture: 0.16, brown: 0.16, binaural: 0 } },
};

export function clampBeatHz(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.max(1, Math.min(30, value)) * 2) / 2
    : fallback;
}

export function binauralFrequencies(carrier: number, beat: number): [number, number] {
  const difference = clampBeatHz(beat, 6);
  return [carrier - difference / 2, carrier + difference / 2];
}
