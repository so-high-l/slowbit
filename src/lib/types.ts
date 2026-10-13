export type FocusMood = "fresh" | "low_energy" | "sleepy" | "distracted" | "focused";
export type SessionMode = "focus" | "unwind";
export type Mood = "fried" | "restless" | "stuck" | "overstimulated" | "burned_out" | "chill";
export type VisualId =
  | "orbitStudy"
  | "morningLattice"
  | "quietMachine"
  | "focusComingSoon"
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
  "rain" | "fire" | "wind" | "forest" | "brown" | "night" | "tones" | "train" | "piano" | "orbitalPad" | "ambience" | "texture" | "binaural" | "textureTone" | "pondDrops" | "vinylMusic";
export type SoundMix = Record<SoundId, number>;
export type SoundMixesByScene = Partial<Record<VisualId, Partial<SoundMix>>>;
export interface Preferences {
  favoriteVisuals: VisualId[];
  hiddenVisuals: VisualId[];
  soundMixesByScene: SoundMixesByScene;
  beatHzByScene: Partial<Record<VisualId, number>>;
  completedTours: string[];
  defaultSessionDuration: number | null;
  lastVisual?: VisualId;
  lastMood?: Mood;
  mode?: SessionMode;
  focusMood?: FocusMood;
  globalVolume: number;
  muted: boolean;
  showBoard: boolean;
}
export interface Visual {
  id: VisualId;
  name: string;
  subtitle: string;
  tags: string[];
  modes?: SessionMode[];
  recommendedMoods: Mood[];
  defaultSounds: Partial<Record<SoundId, number>>;
}
