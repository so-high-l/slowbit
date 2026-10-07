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
  | "nightSky";
export type SoundId =
  "rain" | "fire" | "wind" | "forest" | "brown" | "night" | "tones";
export interface Preferences {
  favoriteVisuals: VisualId[];
  hiddenVisuals: VisualId[];
  audioVolumes: Record<SoundId, number>;
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
