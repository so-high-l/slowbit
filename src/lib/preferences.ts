import type { Preferences, Visual, VisualId, SoundId, SoundMix } from "./types";
import { sceneMix } from "./sound-presets.ts";
import { clampBeatHz, sceneSoundscapes } from "./scene-soundscapes.ts";
import { hasAirTones, migrateSoundControls } from "./sound-controls.ts";
export const STORAGE_KEY = "relax_dev_preferences";
export const visualIds: VisualId[] = [
  "orbitStudy",
  "morningLattice",
  "quietMachine",
  "nightDrive",
  "readingRoom",
  "focusComingSoon",
  "rain",
  "aurora",
  "stars",
  "embers",
  "drift",
  "ocean",
  "pond",
  "mist",
  "snow",
  "dunes",
  "clouds",
  "jelly",
  "meadow",
  "lantern",
  "ink",
  "vinyl",
  "nightSky",
  "thread",
  "ribbonTunnel",
  "deepPassage",
  "magneticField",
];
const soundIds: SoundId[] = [
  "ambience", "texture", "binaural", "textureTone", "pondDrops",
  "orbitalPad",
  "rain",
  "fire",
  "wind",
  "forest",
  "brown",
  "night",
  "tones",
  "train",
  "piano",
  "lofi",
  "vinylMusic",
];
export const defaults: Preferences = {
  favoriteVisuals: [],
  hiddenVisuals: [],
  soundMixesByScene: {},
  beatHzByScene: {},
  completedTours: [],
  defaultSessionDuration: 10,
  globalVolume: 0.6,
  muted: false,
  showBoard: false,
};
export function normalize(raw: unknown): Preferences {
  if (!raw || typeof raw !== "object") return { ...defaults };
  const p = raw as Partial<Preferences>;
  const volume = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(1, Math.max(0, v))
      : fallback;
  const ids = (v: unknown) =>
    Array.isArray(v)
      ? [...new Set(v.filter((id): id is VisualId => visualIds.includes(id)))]
      : [];
  const sceneMixes = (value: unknown): Preferences["soundMixesByScene"] => {
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value).flatMap(([scene, mix]) => {
        if (!visualIds.includes(scene as VisualId) || !mix || typeof mix !== "object") return [];
        const validMix = Object.fromEntries(
          soundIds.flatMap((id) => {
            const candidate = (mix as Record<string, unknown>)[id];
            return typeof candidate === "number" && Number.isFinite(candidate)
              ? [[id, volume(candidate, 0)]]
              : [];
          }),
        );
        return Object.keys(validMix).length ? [[scene, migrateSoundControls(scene as VisualId, validMix)]] : [];
      }),
    ) as Preferences["soundMixesByScene"];
  };
  const tours = (value: unknown) =>
    Array.isArray(value)
      ? [...new Set(value.filter((tour): tour is string => typeof tour === "string" && tour.length > 0))]
      : [];
  return {
    favoriteVisuals: ids(p.favoriteVisuals),
    hiddenVisuals: ids(p.hiddenVisuals),
    soundMixesByScene: sceneMixes(p.soundMixesByScene),
    beatHzByScene: Object.fromEntries(
      Object.entries(p.beatHzByScene && typeof p.beatHzByScene === "object" ? p.beatHzByScene : {})
        .filter(([id, value]) => visualIds.includes(id as VisualId) && sceneSoundscapes[id as VisualId] && typeof value === "number" && Number.isFinite(value))
        .map(([id, value]) => [id, clampBeatHz(value, sceneSoundscapes[id as VisualId]!.beatHz)]),
    ),
    completedTours: tours(p.completedTours),
    defaultSessionDuration:
      p.defaultSessionDuration === null
        ? null
        : [5, 10, 15, 25, 45, 60].includes(p.defaultSessionDuration as number)
          ? p.defaultSessionDuration!
          : 10,
    globalVolume: volume(p.globalVolume, 0.6),
    muted: p.muted === true,
    showBoard: p.showBoard === true,
    focusMood: ["fresh", "low_energy", "sleepy", "distracted", "focused"].includes(p.focusMood!) ? p.focusMood : "fresh",
    mode: p.mode === "focus" ? "focus" : "unwind",
    lastVisual: visualIds.includes(p.lastVisual!) ? p.lastVisual : undefined,
    lastMood: [
      "fried",
      "restless",
      "stuck",
      "overstimulated",
      "chill",
      "burned_out",
    ].includes(p.lastMood!)
      ? p.lastMood
      : undefined,
  };
}
export function getSceneSoundMix(
  preferences: Preferences,
  visual: Pick<Visual, "id" | "defaultSounds">,
): SoundMix {
  return { ...sceneMix(visual), ...migrateSoundControls(visual.id, preferences.soundMixesByScene[visual.id] ?? {}) };
}
export function saveSceneSoundMix(
  preferences: Preferences,
  sceneId: VisualId,
  mix: Partial<SoundMix>,
): Preferences {
  const previousMix = migrateSoundControls(sceneId, preferences.soundMixesByScene[sceneId] ?? {});
  // Freeze the other half of a split layer before its first slider edit.
  if (hasAirTones(sceneId) && previousMix.textureTone === undefined) previousMix.textureTone = sceneSoundscapes[sceneId]!.mix.textureTone;
  if (sceneId === "pond" && previousMix.pondDrops === undefined) previousMix.pondDrops = sceneSoundscapes.pond!.mix.pondDrops;
  const savedMix = Object.fromEntries(
    soundIds.flatMap((id) => {
      const candidate = mix[id];
      return typeof candidate === "number" && Number.isFinite(candidate)
        ? [[id, Math.min(1, Math.max(0, candidate))]]
        : [];
    }),
  ) as Partial<SoundMix>;
  return {
    ...preferences,
    soundMixesByScene: {
      ...preferences.soundMixesByScene,
      [sceneId]: {
        ...previousMix,
        ...savedMix,
      },
    },
  };
}
export function resetSceneSoundMix(preferences: Preferences, sceneId: VisualId): Preferences {
  const { [sceneId]: _removed, ...remaining } = preferences.soundMixesByScene;
  const { [sceneId]: _beat, ...remainingBeats } = preferences.beatHzByScene;
  return { ...preferences, soundMixesByScene: remaining, beatHzByScene: remainingBeats };
}
export function getSceneBeatHz(preferences: Preferences, sceneId: VisualId): number {
  return clampBeatHz(preferences.beatHzByScene[sceneId], sceneSoundscapes[sceneId]?.beatHz ?? 6);
}
export function saveSceneBeatHz(preferences: Preferences, sceneId: VisualId, value: number): Preferences {
  if (!sceneSoundscapes[sceneId]) return preferences;
  return { ...preferences, beatHzByScene: { ...preferences.beatHzByScene, [sceneId]: clampBeatHz(value, sceneSoundscapes[sceneId]!.beatHz) } };
}
export function hasCompletedTour(preferences: Preferences, tourId: string): boolean {
  return preferences.completedTours.includes(tourId);
}
export function completeTour(preferences: Preferences, tourId: string): Preferences {
  return preferences.completedTours.includes(tourId)
    ? preferences
    : { ...preferences, completedTours: [...preferences.completedTours, tourId] };
}
export function resetTour(preferences: Preferences, tourId: string): Preferences {
  return {
    ...preferences,
    completedTours: preferences.completedTours.filter((id) => id !== tourId),
  };
}
