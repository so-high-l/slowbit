import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { visuals } from "../src/data/catalog.ts";
import { scenePreviewThemes } from "../src/lib/scene-previews.ts";

test("every catalog scene has a lightweight preview treatment", () => {
  for (const visual of visuals) {
    const preview = scenePreviewThemes[visual.id];
    assert.ok(preview, `${visual.id} has no preview theme`);
    assert.match(preview.accent, /^#[0-9a-f]{6}$/i);
    assert.match(preview.surface, /^#[0-9a-f]{6}$/i);
  }
  assert.deepEqual(Object.keys(scenePreviewThemes).sort(), visuals.map(visual => visual.id).sort());
});

test("favorites and the searchable landing picker share ScenePreview", () => {
  const favorites = readFileSync(new URL("../src/app/favorites/page.tsx", import.meta.url), "utf8");
  const landing = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.match(favorites, /<ScenePreview scene=\{v\.id\}/);
  assert.match(landing, /<ScenePreview scene=\{v\.id\}/);
  assert.match(landing, /type="search"/);
  assert.match(landing, /item\.subtitle, \.\.\.item\.tags/);
});
