import test from "node:test";
import assert from "node:assert/strict";
import { sceneNeedsLoading } from "../src/components/visuals/scene-loading.ts";
import { visuals } from "../src/data/catalog.ts";

test("only asset-backed scenes use the shared scene loader", () => {
  const loadingScenes = visuals.filter(scene => sceneNeedsLoading(scene.id)).map(scene => scene.id);
  assert.deepEqual(loadingScenes, ["orbitStudy", "readingRoom", "japaneseCafe"]);
  assert.equal(sceneNeedsLoading("trainCarriage"), false);
  assert.equal(sceneNeedsLoading("chromaticDrift"), false);
});
