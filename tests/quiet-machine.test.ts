import { test } from "node:test";
import assert from "node:assert/strict";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix } from "../src/lib/preferences.ts";
import { createAnalogTape } from "../src/lib/analog-tape.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";
import { machineAngle, paintQuietMachine, quietMachineCamera, quietMachineDetailStrengths, quietMachineLayout, quietMachineRecursiveState } from "../src/components/visuals/QuietMachine.ts";

test("Quiet Machine is Focus-only with independent, persistent tape and brown noise levels", () => {
  const scene = visuals.find(v => v.id === "quietMachine")!;
  assert.ok(availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind").includes(scene));
  const mix = getSceneSoundMix(defaults, scene);
  assert.equal(mix.texture, 0.3);
  assert.equal(mix.lofi, 0.22);
  assert.equal(mix.brown, 0.12);
  assert.equal(mix.binaural, 0);
  assert.equal(sceneSoundscapes.quietMachine?.playlist, "lofi");
  const saved = normalize({ ...saveSceneSoundMix(defaults, scene.id, { texture: 0, lofi: 0.14 }), lastVisual: scene.id, favoriteVisuals: [scene.id] });
  assert.equal(saved.lastVisual, scene.id);
  assert.deepEqual(saved.favoriteVisuals, [scene.id]);
  assert.equal(getSceneSoundMix(saved, scene).texture, 0);
  assert.equal(getSceneSoundMix(saved, scene).lofi, 0.14);
  assert.equal(getSceneSoundMix(saved, scene).brown, 0.12);
});

test("the mechanism fits desktop, mobile and cards and periodically returns to alignment", () => {
  for (const [w, h] of [[1440, 900], [390, 844], [260, 160], [844, 390]]) {
    for (const ring of quietMachineLayout(w, h)) {
      assert.ok(ring.x - ring.radius > 0 && ring.x + ring.radius < w);
      assert.ok(ring.y - ring.radius > 0 && ring.y + ring.radius < h);
      assert.equal(machineAngle(240, ring.rate), machineAngle(0, ring.rate));
      assert.notEqual(machineAngle(15, ring.rate), machineAngle(0, ring.rate));
    }
  }
});

test("immersion moves smoothly into the main circle and reveals details in stages", () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const start = quietMachineCamera(w, h, 0);
    const middle = quietMachineCamera(w, h, 0.5);
    const end = quietMachineCamera(w, h, 1);
    assert.equal(start.scale, 1);
    assert.ok(start.scale < middle.scale && middle.scale < end.scale);
    assert.ok(end.scale > 2.5);
    assert.deepEqual([start.x, start.y], [end.x, end.y]);
  }
  const early = quietMachineDetailStrengths(0.25);
  const middle = quietMachineDetailStrengths(0.5);
  const late = quietMachineDetailStrengths(0.85);
  assert.ok(early.structure > 0 && early.movement === 0 && early.fine === 0);
  assert.ok(middle.structure > early.structure && middle.movement > 0 && middle.fine === 0);
  assert.ok(late.movement > middle.movement && late.fine > 0);
});

test("the recursive composition zooms at a constant rate into an identical center", () => {
  const start = quietMachineRecursiveState(0);
  const quarter = quietMachineRecursiveState(7);
  const middle = quietMachineRecursiveState(14);
  const threeQuarters = quietMachineRecursiveState(21);
  const next = quietMachineRecursiveState(28);
  const firstRatio = quarter.scale / start.scale;
  assert.deepEqual(start, { generation: 0, progress: 0, scale: 1 });
  assert.equal(middle.progress, 0.5);
  assert.ok(Math.abs(middle.scale / quarter.scale - firstRatio) < 1e-12);
  assert.ok(Math.abs(threeQuarters.scale / middle.scale - firstRatio) < 1e-12);
  assert.equal(next.generation, 1);
  assert.equal(next.progress, 0);
  assert.equal(next.scale, start.scale);
  const muchLater = quietMachineRecursiveState(28 * 10_000 + 7);
  assert.equal(muchLater.generation, 10_000);
  assert.ok(muchLater.scale >= 1 && muchLater.scale < 1 / 0.34);
});

test("Quiet Machine renders finite paths, balances transforms and stays still with reduced motion", () => {
  const render = (t: number, reducedMotion: boolean) => {
    const operations: unknown[][] = [];
    let balance = 0;
    const gradient = { addColorStop: (...args: unknown[]) => operations.push(["color", ...args]) };
    const ctx = new Proxy({}, {
      get(_, name) { return (...args: unknown[]) => {
        for (const value of args) if (typeof value === "number") assert.ok(Number.isFinite(value));
        if (name === "save") balance++;
        if (name === "restore") balance--;
        operations.push([name, ...args]);
        if (String(name).startsWith("create")) return gradient;
      }; },
      set(_, name, value) { operations.push([name, value === gradient ? "gradient" : value]); return true; },
    }) as CanvasRenderingContext2D;
    paintQuietMachine({ctx, w:390, h:844, t, focus:1, particles:[], reducedMotion});
    assert.equal(balance, 0);
    return operations;
  };
  assert.notDeepEqual(render(0, false), render(30, false));
  assert.deepEqual(render(0, true), render(30, true));
});

test("original tape loop stays quiet without silence or a large seam transient", () => {
  const data = createAnalogTape(12000);
  let energy = 0, peak = 0, difference = 0;
  for (let i = 0; i < data.length; i++) {
    assert.ok(Number.isFinite(data[i]));
    energy += data[i] ** 2;
    peak = Math.max(peak, Math.abs(data[i]));
    if (i) difference += (data[i] - data[i - 1]) ** 2;
  }
  assert.ok(Math.sqrt(energy / data.length) > 0.05);
  assert.ok(peak < 1);
  assert.ok(Math.abs(data[0] - data.at(-1)!) < Math.sqrt(difference / data.length) * 3);
  assert.deepEqual(createAnalogTape(12000), data);
});
