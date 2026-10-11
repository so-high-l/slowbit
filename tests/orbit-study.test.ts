import { test } from "node:test";
import assert from "node:assert/strict";
import { visuals } from "../src/data/catalog.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { defaults, getSceneSoundMix, normalize, saveSceneSoundMix } from "../src/lib/preferences.ts";
import { createImageAssetCache } from "../src/components/visuals/image-assets.ts";
import { orbitAsteroids, orbitLayout, paintOrbitStudy } from "../src/components/visuals/OrbitStudy.ts";
import { advanceOrbitMotion, createOrbitMotion, orbitEffects, orbitSpeeds, projectOrbit, type OrbitMotion } from "../src/components/visuals/orbit-motion.ts";

test("Orbit Study is Unwind-only, respects hidden scenes, and retains its own saved mix", () => {
  const scene = visuals.find(v => v.id === "orbitStudy")!;
  assert.ok(availableVisuals(visuals, "unwind").includes(scene));
  assert.ok(!availableVisuals(visuals, "focus").includes(scene));
  assert.ok(!availableVisuals(visuals, "unwind", [scene.id]).includes(scene));
  const mix = getSceneSoundMix(defaults, scene);
  assert.equal(mix.orbitalPad, 0);
  assert.equal(mix.brown, 0.1);
  assert.equal(mix.wind, 0.28);
  assert.equal(mix.rain, 0.08);
  assert.equal(mix.piano, 0);
  const saved = normalize(saveSceneSoundMix({ ...defaults, lastVisual: scene.id, favoriteVisuals: [scene.id] }, scene.id, { orbitalPad: 0.17 }));
  assert.equal(saved.lastVisual, scene.id);
  assert.deepEqual(saved.favoriteVisuals, [scene.id]);
  assert.equal(getSceneSoundMix(saved, scene).orbitalPad, 0.17);
  assert.equal(getSceneSoundMix(defaults, visuals.find(v => v.id === "rain")!).orbitalPad, 0);
});

test("the centered system fits portrait, landscape and card viewports without uniform spacing", () => {
  for (const [w, h] of [[1440, 900], [390, 844], [844, 390], [260, 160]]) {
    const layout = orbitLayout(w, h);
    assert.equal(layout.cx, w / 2); assert.equal(layout.cy, h / 2);
    const gaps = layout.planets.map((p, i) => p.radius - (layout.planets[i - 1]?.radius ?? 0));
    assert.ok(gaps[7] > gaps[3] * 2);
    for (const p of layout.planets) {
      assert.ok(p.x - p.size / 2 > 0 && p.x + p.size / 2 < w);
      assert.ok(p.y - p.size / 2 > 0 && p.y + p.size / 2 < h);
      assert.ok(p.radius < Math.min(w, h) / 2);
      assert.ok(p.size <= Math.min(w, h) * 0.06);
    }
  }
});

test("image requests are shared, failures settle, and unmounted subscribers are not called", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const images: { src: string; naturalWidth: number; onload: (() => void) | null; onerror: (() => void) | null }[] = [];
  const cache = createImageAssetCache({ earth: "/earth.png", mars: "/mars.png", sun: "/sun.png" }, () => {
    const image = { src: "", naturalWidth: 1280, onload: null, onerror: null };
    images.push(image); return image as unknown as HTMLImageElement;
  });
  let removed = 0, active = 0;
  const unsubscribe = cache.preload(() => removed++);
  cache.preload(() => active++);
  unsubscribe();
  assert.equal(images.length, 3);
  assert.equal(cache.get("earth"), null);
  images[0].onload!(); images[1].onerror!();
  t.mock.timers.tick(15000);
  await Promise.resolve();
  assert.equal(active, 3);
  assert.equal(removed, 0);
  assert.equal(cache.get("earth"), images[0]);
  assert.equal(cache.get("mars"), null);
  assert.equal(cache.get("sun"), null);
  cache.preload(() => {});
  assert.equal(images.length, 3, "failed assets must not trigger a request every frame");
});

function render(t: number, focus: number, orbit?: OrbitMotion, reducedMotion = false) {
    const operations: unknown[] = [];
    const gradient = { addColorStop(...args: unknown[]) { operations.push(["stop", ...args]); } };
    const ctx = new Proxy({}, {
      get(_target, name) {
        return (...args: unknown[]) => {
          operations.push([name, ...args]);
          if (name === "createLinearGradient" || name === "createRadialGradient") return gradient;
        };
      },
      set(_target, name, value) { operations.push([name, value === gradient ? "gradient" : value]); return true; },
    }) as CanvasRenderingContext2D;
    paintOrbitStudy({ ctx, w: 1440, h: 900, t, focus, particles: [], orbit, reducedMotion });
    return operations;
}

test("base painting remains complete and identical regardless of ambient time", () => {
  const first = render(0, 0);
  assert.deepEqual(render(900, 1), first);
  assert.equal(first.filter(op => (op as unknown[])[0] === "arc").length, 237, "220 stars, eight orbit rings, and nine fallback bodies");
});

test("orbital drift is frame-rate independent, ordered, and slower outside immersion", () => {
  const thirty = { ...createOrbitMotion(), strength: 1 };
  const sixty = { ...createOrbitMotion(), strength: 1 };
  for (let i = 0; i < 30 * 10; i++) advanceOrbitMotion(thirty, 1 / 30);
  for (let i = 0; i < 60 * 10; i++) advanceOrbitMotion(sixty, 1 / 60);
  let previous = Infinity;
  for (const key of Object.keys(orbitSpeeds) as (keyof typeof orbitSpeeds)[]) {
    assert.ok(Math.abs(thirty[key] - sixty[key]) < 1e-10);
    assert.ok(thirty[key] < previous && thirty[key] > 0);
    previous = thirty[key];
  }
  assert.ok(thirty.mercury > 0.2 && thirty.mercury < Math.PI / 12, "Mercury's more visible drift stays under 15 degrees in ten seconds");
  const normal = createOrbitMotion();
  for (let i = 0; i < 60 * 10; i++) advanceOrbitMotion(normal, 1 / 60);
  for (const key of Object.keys(orbitSpeeds) as (keyof typeof orbitSpeeds)[]) {
    assert.ok(normal[key] > 0, "normal mode also moves");
    assert.ok(Math.abs(normal[key] / sixty[key] - 0.3) < 1e-10);
  }
  const before = thirty.mercury;
  thirty.strength = 0;
  advanceOrbitMotion(thirty, 10);
  assert.ok(Math.abs(thirty.mercury - before - normal.mercury) < 1e-10, "exiting continues forward at normal speed without resetting angles");
  const fresh = createOrbitMotion();
  assert.deepEqual(orbitLayout(1440, 900, fresh), orbitLayout(1440, 900), "a new scene starts in the original arrangement");
});

test("immersion preserves orbit distances, caps zoom and pulse, and respects reduced motion", () => {
  const state = { ...createOrbitMotion(), strength: 1 };
  advanceOrbitMotion(state, 10);
  const base = orbitLayout(1440, 900);
  const moved = orbitLayout(1440, 900, state);
  moved.planets.forEach((planet, i) => {
    assert.ok(Math.abs(Math.hypot(planet.x - moved.cx, planet.y - moved.cy) - base.planets[i].radius) < 1e-9);
    assert.equal(planet.size, base.planets[i].size);
  });
  assert.equal(orbitEffects(state).scale, 1.75);
  assert.equal(orbitEffects(state).lineAlpha, 0.27);
  for (let elapsed = 0; elapsed <= 8; elapsed += 0.25) {
    const effect = orbitEffects({ ...state, elapsed });
    assert.ok(effect.pulse >= 0.96 && effect.pulse <= 1.04);
    assert.ok(Math.abs(effect.x) <= 0.002 && Math.abs(effect.y) <= 0.0015);
  }
  assert.equal(orbitEffects({ ...state, elapsed: 2 }).pulse, orbitEffects({ ...state, elapsed: 10 }).pulse);
  assert.deepEqual(orbitEffects(state, true), { planeStrength: 0, planeY: 1, rotation: -0, scale: 1, lineAlpha: 0.27, pulse: 1, x: 0, y: 0 });
  assert.notDeepEqual(render(0, 0, state), render(0, 0));
  const withoutColor = (ops: unknown[]) => ops.filter(op => (op as unknown[])[0] !== "strokeStyle");
  assert.deepEqual(withoutColor(render(0, 0, state, true)), withoutColor(render(0, 0)), "reduced motion only changes ring contrast");
});

test("the orbital plane projects planets onto tilted ellipses with restrained depth scaling", () => {
  for (const strength of [0, 0.25, 0.5, 1]) {
    const effect = orbitEffects({ ...createOrbitMotion(), strength });
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const point = projectOrbit(300, angle, strength);
      const x = point.x * Math.cos(-effect.rotation) - point.y * Math.sin(-effect.rotation);
      const y = point.x * Math.sin(-effect.rotation) + point.y * Math.cos(-effect.rotation);
      assert.ok(Math.abs((x / 300) ** 2 + (y / (300 * effect.planeY)) ** 2 - 1) < 1e-10);
      assert.ok(point.sizeScale >= 0.93 && point.sizeScale <= 1.07);
    }
  }
  assert.equal(orbitEffects({ ...createOrbitMotion(), strength: 1 }).planeY, 0.74);
  assert.equal(projectOrbit(300, Math.PI / 2, 1).sizeScale, 1.07);
  assert.ok(Math.abs(projectOrbit(300, -Math.PI / 2, 1).sizeScale - 0.93) < 1e-10);
});

test("immersive rendering layers rear planets behind the sun and foreground planets above it", () => {
  const ops = render(0, 0, { ...createOrbitMotion(), strength: 1 }) as unknown[][];
  const colorIndex = (color: string) => ops.findIndex(op => op[0] === "fillStyle" && op[1] === color);
  const sun = colorIndex("#e5bc78");
  for (const rear of ["#9b9c99", "#ccb887", "#b9a18b", "#86b7c3"]) assert.ok(colorIndex(rear) < sun);
  for (const front of ["#789fb6", "#ae7960", "#c2b596", "#6488c2"]) assert.ok(colorIndex(front) > sun);
  assert.ok(ops.some(op => op[0] === "ellipse" && op[4] === Number(op[3]) * 0.74), "orbits use compressed ellipses");
  assert.equal(ops.filter(op => op[0] === "arc").length, 285, "220 stars, 56 belt points, nine bodies");
  assert.ok(ops.filter(op => op[0] === "ellipse").length > 16, "faded trail segments supplement the two orbit halves");
});

test("the sparse belt stays between Mars and Jupiter and disappears with immersion", () => {
  assert.equal(orbitAsteroids.length, 56);
  assert.ok(orbitAsteroids.every(point => point.radius > 0.20 && point.radius < 0.285));
  const inactive = render(0, 0, createOrbitMotion());
  assert.deepEqual(inactive, render(0, 0), "inactive immersion preserves every base drawing operation");
  const reduced = render(0, 0, { ...createOrbitMotion(), strength: 1, elapsed: 200 }, true) as unknown[][];
  assert.equal(reduced.filter(op => op[0] === "arc").length, 237);
  assert.equal(reduced.filter(op => op[0] === "ellipse").length, 1, "only Saturn's fallback ring remains with reduced motion");
});
