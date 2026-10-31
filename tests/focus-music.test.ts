import { test } from "node:test";
import assert from "node:assert/strict";
import { chromaticDriftTrackFiles, chromaticDriftTrackUrls, FocusPlaylist, focusTrackFiles, focusTrackUrls, japaneseCafeTrackFiles, japaneseCafeTrackUrls, lofiTrackFiles, lofiTrackUrls, nightDriveTrackFiles, nightDriveTrackUrls, readingRoomTrackFiles, readingRoomTrackUrls, shuffleBag, pianoFade, trackDisplayName, trainCarriageTrackUrls } from "../src/lib/focus-music.ts";
import { availableVisuals } from "../src/lib/scene-availability.ts";
import { normalize, defaults, saveSceneSoundMix, getSceneSoundMix } from "../src/lib/preferences.ts";
import type { Visual } from "../src/lib/types.ts";
import { visuals } from "../src/data/catalog.ts";
const scene = visuals.find(v => v.id === "morningLattice")!;
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const gains: { gain: { value: number; setTargetAtTime(v: number): void; cancelScheduledValues(): void }; connect(): void; disconnect(): void }[] = [];
  let sources = 0;
  const context = { currentTime: 0, createGain() { const node = { gain: { value: 0, setTargetAtTime(v: number) { this.value = v; }, cancelScheduledValues() {} }, connect() {}, disconnect() {} }; gains.push(node); return node; }, createMediaElementSource() { sources++; return { connect() {}, disconnect() {} }; } };
  class Media {
    src = ""; preload = "none"; crossOrigin = ""; loop = false; duration = 100; currentTime = 0; paused = true; ended = false; loads = 0; plays = 0;
    oncanplay: (() => void) | null = null; ontimeupdate: (() => void) | null = null; onended: (() => void) | null = null; onerror: (() => void) | null = null;
    load() { if (this.src) this.loads++; }
    play() { this.paused = false; this.plays++; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ""; this.currentTime = 0; this.ended = false; }
  }
  const media: Media[] = [];
  const playlist = new FocusPlaylist(context as unknown as AudioContext, {} as GainNode, focusTrackUrls("https://assets.test"), () => { const m = new Media(); media.push(m); return m as unknown as HTMLAudioElement; });
  return { playlist, media, gains, sources: () => sources };
}
test("Focus-only visibility and piano defaults persist independently", () => {
  assert.equal(availableVisuals([scene], "focus").length, 1);
  assert.equal(availableVisuals([scene], "unwind").length, 0);
  assert.equal(availableVisuals([scene], "focus", [scene.id]).length, 0);
  assert.deepEqual(scene.defaultSounds, { piano: .3, brown: .3, rain: .3 });
  const saved = normalize(saveSceneSoundMix(defaults, scene.id, { piano: .2 }));
  assert.equal(getSceneSoundMix(saved, scene).piano, .2);
  assert.equal(getSceneSoundMix(saved, scene).brown, .3);
});
test("shuffle cycles contain every track without consecutive repeats", () => {
  const next = shuffleBag(4); let last = -1;
  for (let cycle = 0; cycle < 20; cycle++) {
    const bag = Array.from({ length: 4 }, () => next());
    assert.equal(new Set(bag).size, 4); assert.notEqual(bag[0], last); last = bag[3];
  }
  assert.deepEqual(focusTrackUrls(""), []);
  assert.equal(focusTrackFiles.length, 22);
  assert.equal(new Set(focusTrackFiles).size, 22);
  assert.ok(focusTrackFiles.includes("Ondrosik - labirint.mp3"));
  assert.ok(focusTrackFiles.every(file => !file.includes("leberch")));
  assert.deepEqual(focusTrackUrls("https://assets.test/"), focusTrackFiles.map(file => `https://assets.test/audio/focus/sunlit-wall/${encodeURIComponent(file)}`));
  assert.equal(trackDisplayName(focusTrackUrls("https://assets.test/").at(-1)!), "Labirint");
  assert.deepEqual(lofiTrackUrls(""), []);
  assert.equal(lofiTrackFiles.length, 5);
  assert.ok(!lofiTrackFiles.includes("absolutesound-deep-thinking-lofi-music-510766.mp3"));
  assert.deepEqual(lofiTrackUrls("https://assets.test/"), lofiTrackFiles.map(file => `https://assets.test/audio/lofi/${file}`));
  assert.deepEqual(nightDriveTrackUrls(""), []);
  assert.deepEqual(nightDriveTrackUrls("https://assets.test/"), nightDriveTrackFiles.map(file => `https://assets.test/audio/lofi/night-drive/${file}`));
  assert.deepEqual(readingRoomTrackUrls(""), []);
  assert.equal(readingRoomTrackFiles.length, 14);
  for (const file of ["black_and_brown_morning.mp3", "grab_a_coffee.mp3", "noujoum_lil.mp3", "the_last_note.mp3"])
    assert.ok(readingRoomTrackFiles.includes(file));
  assert.deepEqual(readingRoomTrackUrls("https://assets.test/"), readingRoomTrackFiles.map(file => `https://assets.test/audio/lofi/reading-room/${file}`));
  assert.deepEqual(chromaticDriftTrackUrls(""), []);
  assert.deepEqual(chromaticDriftTrackUrls("https://assets.test/"), chromaticDriftTrackFiles.map(file => `https://assets.test/audio/chromatic-drift/${file}`));
  assert.deepEqual(japaneseCafeTrackUrls(""), []);
  assert.deepEqual(japaneseCafeTrackUrls("https://assets.test/"), japaneseCafeTrackFiles.map(file => `https://assets.test/audio/lofi/jap-cafe/${encodeURIComponent(file)}`));
  assert.equal(trackDisplayName(japaneseCafeTrackUrls("https://assets.test")[0]), "So Broke");
  assert.deepEqual(trainCarriageTrackUrls(""), []);
  assert.deepEqual(trainCarriageTrackUrls("https://assets.test/"), [
    ...lofiTrackUrls("https://assets.test/"),
    ...nightDriveTrackUrls("https://assets.test/"),
    ...japaneseCafeTrackUrls("https://assets.test/"),
  ]);
  assert.equal(trainCarriageTrackUrls("https://assets.test/").length, 49);
  assert.deepEqual(pianoFade(0), [1, 0]);
  assert.ok(pianoFade(.5)[0] > pianoFade(.5)[1]);
  assert.ok(pianoFade(1)[0] < .00001); assert.equal(pianoFade(1)[1], 1);
});
test("shuffle order can be reproduced only when an explicit seed is supplied", () => {
  const first = shuffleBag(6, 719);
  const second = shuffleBag(6, 719);
  assert.deepEqual(
    Array.from({ length: 12 }, () => first()),
    Array.from({ length: 12 }, () => second()),
  );
});
test("lazy preload, crossfade, pause/resume and reuse of two sources", async t => {
  const { playlist, media, gains, sources } = setup(); t.after(() => playlist.close());
  playlist.update(true, true, .3);
  assert.equal(media.filter(m => m.src).length, 1);
  media[0].oncanplay!(); await flush();
  media[0].currentTime = 74; media[0].ontimeupdate!(); assert.equal(media[1].src, "");
  media[0].currentTime = 75; media[0].ontimeupdate!(); assert.ok(media[1].src);
  media[1].oncanplay!(); media[0].currentTime = 94; media[0].ontimeupdate!(); await flush();
  media[1].currentTime = 3; media[1].ontimeupdate!();
  assert.ok(gains[1].gain.value < 1); assert.ok(gains[2].gain.value > 0);
  playlist.update(true, false, .3); assert.ok(media.every(m => m.paused));
  assert.equal(media[1].currentTime, 3);
  playlist.update(true, true, .3); await flush(); assert.equal(media[1].currentTime, 3);
  media[1].currentTime = 6; media[1].ontimeupdate!(); assert.equal(media[0].src, "");
  for (let i = 0; i < 5; i++) { playlist.update(false, false, 0); playlist.update(true, true, .3); }
  assert.equal(sources(), 2);
});
test("leaving fades output and cleans players after the fade", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { playlist, media, gains } = setup(); t.after(() => playlist.close());
  playlist.update(true, true, .3); media[0].oncanplay!();
  playlist.update(false, false, 0); assert.equal(gains[0].gain.value, 0);
  t.mock.timers.tick(1200); assert.ok(media.every(m => m.paused && !m.src));
});
test("all missing tracks exhaust bounded attempts without throwing or retry loops", t => {
  const { playlist, media } = setup(); t.after(() => playlist.close());
  playlist.update(true, true, .3);
  for (let i = 0; i < focusTrackFiles.length; i++) media[0].onerror!();
  for (let i = 0; i < focusTrackFiles.length + 2; i++) playlist.update(true, true, .3);
  assert.equal(media.reduce((n, m) => n + m.loads, 0), focusTrackFiles.length);
  assert.ok(media.every(m => !m.src));
});
test("stalled requests time out and stop after every file has failed", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { playlist, media } = setup(); t.after(() => playlist.close());
  playlist.update(true, true, .3);
  for (let i = 0; i < focusTrackFiles.length + 1; i++) t.mock.timers.tick(30000);
  assert.equal(media.reduce((n, m) => n + m.loads, 0), focusTrackFiles.length);
});
test("play promise rejection is contained and the next candidate is prepared", async t => {
  const { playlist, media } = setup(); t.after(() => playlist.close());
  media[0].play = () => Promise.reject(new Error("media unavailable"));
  playlist.update(true, true, .3); const failedUrl = media[0].src;
  media[0].oncanplay!(); await flush();
  assert.notEqual(media[0].src, failedUrl);
  assert.equal(media[0].loads, 2);
});
