import type { FocusMood, SessionMode, VisualId } from "./types";

export const modeDurations: Record<SessionMode, readonly (number | null)[]> = {
  unwind: [5, 10, 15, null],
  focus: [25, 45, 60, null],
};
export function durationForMode(mode: SessionMode, current: number | null): number | null {
  return modeDurations[mode].includes(current) ? current : mode === "focus" ? 25 : 10;
}

export const focusMoods = [
  { id: "fresh", label: "Fresh mind" },
  { id: "low_energy", label: "Low energy" },
  { id: "sleepy", label: "Sleepy" },
  { id: "distracted", label: "Distracted" },
  { id: "focused", label: "Focused" },
] as const;

export const focusSceneByMood: Record<FocusMood, VisualId> = {
  fresh: "morningLattice",
  low_energy: "japaneseCafe",
  sleepy: "readingRoom",
  distracted: "quietMachine",
  focused: "nightDrive",
};

const focusSceneOrder: VisualId[] = [
  "morningLattice",
  "quietMachine",
  "nightDrive",
  "readingRoom",
  "japaneseCafe",
  "trainCarriage",
  "loceanRooftop",
  "deepPassage",
  "chromaticDrift",
];

export function availableFocusScene(
  mood: FocusMood,
  hidden: VisualId[],
): VisualId | undefined {
  const preferred = focusSceneByMood[mood];
  return hidden.includes(preferred)
    ? focusSceneOrder.find(id => !hidden.includes(id))
    : preferred;
}
