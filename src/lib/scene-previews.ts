import type { VisualId } from "./types";

export type ScenePreviewIcon =
  | "blend" | "book" | "brush" | "car" | "circle" | "cloud" | "coffee"
  | "construction" | "disc" | "droplets" | "feather" | "fish" | "flame"
  | "flower" | "gauge" | "infinity" | "lamp" | "magnet" | "moon" | "orbit"
  | "rain" | "snow" | "sparkles" | "spline" | "star" | "sun" | "train" | "waves";

export type ScenePreviewTheme = { icon: ScenePreviewIcon; accent: string; surface: string };

/** Keep this exhaustive so every new scene receives a deliberate icon and color. */
export const scenePreviewThemes: Record<VisualId, ScenePreviewTheme> = {
  orbitStudy: { icon: "orbit", accent: "#f0c77d", surface: "#28231d" },
  morningLattice: { icon: "sun", accent: "#e9c98e", surface: "#2b271f" },
  quietMachine: { icon: "gauge", accent: "#a9c9d5", surface: "#1c282e" },
  nightDrive: { icon: "car", accent: "#d78872", surface: "#252129" },
  readingRoom: { icon: "book", accent: "#d6a978", surface: "#2b211d" },
  japaneseCafe: { icon: "coffee", accent: "#d9b782", surface: "#29241e" },
  trainCarriage: { icon: "train", accent: "#bfa988", surface: "#26231f" },
  loceanRooftop: { icon: "waves", accent: "#ee9e74", surface: "#2b2024" },
  focusComingSoon: { icon: "construction", accent: "#9aa9a8", surface: "#202627" },
  rain: { icon: "rain", accent: "#96bdcc", surface: "#1b2930" },
  aurora: { icon: "sparkles", accent: "#9bcbb8", surface: "#1d2928" },
  stars: { icon: "star", accent: "#b9c9e1", surface: "#1c2230" },
  embers: { icon: "flame", accent: "#e79a67", surface: "#2e211d" },
  drift: { icon: "feather", accent: "#b6cbd0", surface: "#20292c" },
  ocean: { icon: "waves", accent: "#7db8c6", surface: "#19282e" },
  pond: { icon: "droplets", accent: "#8fbaa9", surface: "#1b2926" },
  mist: { icon: "circle", accent: "#92bda4", surface: "#1b2923" },
  snow: { icon: "snow", accent: "#d6e1e4", surface: "#222a30" },
  dunes: { icon: "sun", accent: "#d6a16f", surface: "#2d241f" },
  clouds: { icon: "cloud", accent: "#c0d0d4", surface: "#222a2d" },
  jelly: { icon: "fish", accent: "#87bed1", surface: "#192831" },
  meadow: { icon: "flower", accent: "#a7c48e", surface: "#202a20" },
  lantern: { icon: "lamp", accent: "#edb56f", surface: "#2d241d" },
  ink: { icon: "brush", accent: "#a4b7b7", surface: "#202729" },
  vinyl: { icon: "disc", accent: "#c39779", surface: "#2a2220" },
  nightSky: { icon: "moon", accent: "#c3cce0", surface: "#1c2130" },
  thread: { icon: "spline", accent: "#a4c8bc", surface: "#1c2927" },
  ribbonTunnel: { icon: "infinity", accent: "#93bbb9", surface: "#1b282a" },
  deepPassage: { icon: "circle", accent: "#aaa4d3", surface: "#242238" },
  chromaticDrift: { icon: "blend", accent: "#ef9a62", surface: "#30201f" },
  magneticField: { icon: "magnet", accent: "#b7c8c4", surface: "#20292a" },
};
