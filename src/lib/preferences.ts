import type { Preferences, VisualId, SoundId } from "./types";
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
  audioVolumes: {
    rain: 0.65,
    fire: 0,
    wind: 0.08,
    forest: 0,
    brown: 0.08,
    night: 0,
    tones: 0,
  },
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
  return {
    favoriteVisuals: ids(p.favoriteVisuals),
    hiddenVisuals: ids(p.hiddenVisuals),
    audioVolumes: Object.fromEntries(
      soundIds.map((id) => [
        id,
        volume(p.audioVolumes?.[id], defaults.audioVolumes[id]),
      ]),
    ) as Record<SoundId, number>,
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
