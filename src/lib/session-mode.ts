import type { SessionMode } from "./types";

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
