import type { SessionMode, Visual, VisualId } from "./types";
export function availableVisuals(catalog: readonly Visual[], mode: SessionMode = "unwind", hidden: VisualId[] = []) {
  return catalog.filter(v => (!v.modes || v.modes.includes(mode)) && !hidden.includes(v.id));
}

export function landingVisuals(catalog: readonly Visual[], mode: SessionMode = "unwind", hidden: VisualId[] = []) {
  return availableVisuals(catalog, mode, hidden).filter(scene => scene.id !== "focusComingSoon");
}

export function sessionVisuals(catalog: readonly Visual[], mode: SessionMode = "unwind", hidden: VisualId[] = []) {
  const available = availableVisuals(catalog, mode, hidden);
  if (mode !== "focus") return available;
  return [
    ...available.filter(scene => scene.id !== "focusComingSoon"),
    ...available.filter(scene => scene.id === "focusComingSoon"),
  ];
}
