export type Mood = "fried" | "restless" | "stuck" | "overstimulated" | "burned_out" | "chill";
export type VisualId =
  | "rain"
  | "aurora"
  | "stars"
  | "embers"
  | "drift"
  | "ocean"
  | "pond"
  | "mist"
  | "snow"
  | "dunes"
  | "clouds"
  | "jelly"
  | "meadow"
  | "lantern"
  | "ink"
  | "vinyl"
  | "nightSky"
  | "thread"
  | "ribbonTunnel"
  | "magneticField";
export type SoundId =
  "rain" | "fire" | "wind" | "forest" | "brown" | "night" | "tones";
export type SoundMix = Record<SoundId, number>;
export type SoundMixesByScene = Partial<Record<VisualId, Partial<SoundMix>>>;
export interface Preferences {
  favoriteVisuals: VisualId[];
  hiddenVisuals: VisualId[];
  soundMixesByScene: SoundMixesByScene;
  completedTours: string[];
  defaultSessionDuration: number | null;
  lastVisual?: VisualId;
  lastMood?: Mood;
  globalVolume: number;
  muted: boolean;
  showBoard: boolean;
}
export interface Visual {
  id: VisualId;
  name: string;
  subtitle: string;
  tags: string[];
  recommendedMoods: Mood[];
  defaultSounds: Partial<Record<SoundId, number>>;
}
