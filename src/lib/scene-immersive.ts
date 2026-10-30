import type { VisualId } from "./types";

const scenesWithoutImmersiveMode = new Set<VisualId>([
  "focusComingSoon",
  "loceanRooftop",
]);

export function supportsImmersiveMode(scene: VisualId) {
  return !scenesWithoutImmersiveMode.has(scene);
}
