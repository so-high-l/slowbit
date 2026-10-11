import type { SessionMode, Visual, VisualId } from "./types";
export function availableVisuals(catalog: readonly Visual[], mode: SessionMode = "unwind", hidden: VisualId[] = []) {
  return catalog.filter(v => (!v.modes || v.modes.includes(mode)) && !hidden.includes(v.id));
}
