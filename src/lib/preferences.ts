import type { Preferences, Visual, VisualId, SoundId, SoundMix } from "./types";
import { sceneMix } from "./sound-presets.ts";
export const STORAGE_KEY = "relax_dev_preferences";
export const visualIds: VisualId[] = [
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
  "magneticField",
];
const soundIds: SoundId[] = [
  "rain",
  "fire",
  "wind",
  "forest",
  "brown",
  "night",
  "tones",
];
export const defaults: Preferences = {
  favoriteVisuals: [],
  hiddenVisuals: [],
  soundMixesByScene: {},
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
        return Object.keys(validMix).length ? [[scene, validMix]] : [];
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
    completedTours: tours(p.completedTours),
    defaultSessionDuration:
      p.defaultSessionDuration === null
        ? null
        : [5, 10, 15].includes(p.defaultSessionDuration as number)
          ? p.defaultSessionDuration!
          : 10,
    globalVolume: volume(p.globalVolume, 0.6),
    muted: p.muted === true,
    showBoard: p.showBoard === true,
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
  return { ...sceneMix(visual), ...preferences.soundMixesByScene[visual.id] };
}
export function saveSceneSoundMix(
  preferences: Preferences,
  sceneId: VisualId,
  mix: Partial<SoundMix>,
): Preferences {
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
        ...preferences.soundMixesByScene[sceneId],
        ...savedMix,
      },
    },
  };
}
export function resetSceneSoundMix(preferences: Preferences, sceneId: VisualId): Preferences {
  const { [sceneId]: _removed, ...remaining } = preferences.soundMixesByScene;
  return { ...preferences, soundMixesByScene: remaining };
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
