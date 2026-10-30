import type { VisualId } from "../../lib/types";

const assetBackedScenes = new Set<VisualId>([
  "readingRoom",
  "orbitStudy",
  "japaneseCafe",
  "loceanRooftop",
]);

export function sceneNeedsLoading(visualId: VisualId) {
  return assetBackedScenes.has(visualId);
}
