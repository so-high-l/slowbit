import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { recordingProfile } from "../src/lib/audio-profiles.ts";
import { AmbientEngine } from "../src/lib/audio.ts";
import type { SoundMix } from "../src/lib/types.ts";
import { visuals } from "../src/data/catalog.ts";
import { sceneMix, silentMix } from "../src/lib/sound-presets.ts";
import { sceneSoundscapes } from "../src/lib/scene-soundscapes.ts";

test("recordings follow scene context under the same mixer channels", () => {
  assert.notEqual(recordingProfile("rain", "rain").file, recordingProfile("meadow", "rain").file);
  assert.notEqual(recordingProfile("snow", "wind").file, recordingProfile("meadow", "wind").file);
  assert.match(recordingProfile("pond", "wind").file, /wind/);
  assert.match(recordingProfile("mist", "wind").file, /water-flowing/);
  assert.match(recordingProfile("meadow", "forest").file, /birds/);
  assert.ok(recordingProfile("rain", "wind").level < recordingProfile("snow", "wind").level);
  assert.ok(recordingProfile("jelly", "wind").cutoff < recordingProfile("ocean", "wind").cutoff);
  assert.equal(recordingProfile("jelly", "wind").file, "underwater-loop.wav");
  assert.notEqual(recordingProfile("jelly", "wind").file, recordingProfile("ocean", "wind").file);
});

const mix = (channel: keyof SoundMix): SoundMix => ({
  ...silentMix, [channel]: 0.3,
});
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup(t: TestContext) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  class Param {
    value = 0;
    ramps: { value: number; time: number }[] = [];
    targets: { value: number; constant: number }[] = [];
    setValueAtTime(value: number) { this.value = value; }
    setTargetAtTime(value: number, _time: number, constant: number) { this.value = value; this.targets.push({ value, constant }); }
    linearRampToValueAtTime(value: number, time: number) {
      this.value = value;
      this.ramps.push({ value, time });
    }
    cancelAndHoldAtTime() {}
  }
  const node = () => ({
    disconnected: false,
    connections: [] as unknown[],
    routes: [] as { target: unknown; output?: number; input?: number }[],
    connect(target: unknown, output?: number, input?: number) { this.connections.push(target); this.routes.push({ target, output, input }); return target; },
    disconnect() { this.disconnected = true; },
  });
  const sources: (ReturnType<typeof node> & {
    buffer: unknown; loop: boolean; onended: (() => void) | null; stops: number[];
    start(): void; stop(time?: number): void;
  })[] = [];
  const filters: (ReturnType<typeof node> & { frequency: Param; Q: Param; type: string })[] = [];
  const gains: (ReturnType<typeof node> & { gain: Param })[] = [];
  const oscillators: (ReturnType<typeof node> & { frequency: Param; type: string; onended: (() => void) | null; stops: number[]; start(): void; stop(time?: number): void })[] = [];
  const mergers: ReturnType<typeof node>[] = [];
  let decodeFails = false;
  let finishDecode: (() => void) | undefined;
  class Context {
    currentTime = 10; sampleRate = 10; destination = {};
    createGain() {
      const gain = { ...node(), gain: new Param() };
      gains.push(gain); return gain;
    }
    createBiquadFilter() {
      const filter = { ...node(), frequency: new Param(), Q: new Param(), type: "" };
      filters.push(filter); return filter;
    }
    createOscillator() {
      const oscillator = { ...node(), frequency: new Param(), type: "sine", onended: null as (() => void) | null, stops: [] as number[], start() {}, stop(time = 0) { this.stops.push(time); } };
      oscillators.push(oscillator); return oscillator;
    }
    createChannelMerger() { const merger = node(); mergers.push(merger); return merger; }
    createStereoPanner() { return { ...node(), pan: new Param() }; }
    createBufferSource() {
      const source = {
        ...node(), buffer: null as unknown, loop: false,
        onended: null as (() => void) | null, stops: [] as number[],
        start() {}, stop(time = 0) { this.stops.push(time); },
      };
      sources.push(source); return source;
    }
    createBuffer(channels: number, length: number, sampleRate: number) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (i: number) => data[i] };
    }
    async decodeAudioData() {
      if (decodeFails) throw new Error("Invalid audio");
      if (finishDecode) await new Promise<void>(resolve => { finishDecode = resolve; });
      return this.createBuffer(2, 100, 10);
    }
    async resume() {} async close() {}
  }
  const originalContext = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  const calls: { url: string; signal: AbortSignal | null | undefined; resolve(response: Response): void; settled: boolean }[] = [];
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
  globalThis.fetch = ((url: string, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
    const call = { url, signal: init?.signal, resolve, settled: false };
    calls.push(call);
    init?.signal?.addEventListener("abort", () => {
      call.settled = true;
      reject(new Error("Aborted"));
    });
  })) as typeof fetch;
  const engine = new AmbientEngine();
  t.after(async () => {
    await engine.close();
    globalThis.AudioContext = originalContext;
    globalThis.fetch = originalFetch;
  });
  return {
    engine, sources, filters, gains, calls, oscillators, mergers,
    failDecoding() { decodeFails = true; },
    deferDecoding() { finishDecode = () => {}; },
    finishDecoding() { finishDecode?.(); },
    respond(file: string, status = 200) {
      const call = calls.findLast(call => call.url.endsWith(file) && !call.settled);
      assert.ok(call, `pending download for ${file}`);
      call.settled = true;
      call.resolve(new Response(status === 200 ? new ArrayBuffer(8) : null, { status }));
    },
  };
}

test("recorded channels stay silent while loading and retry without procedural fallbacks", async t => {
  const { engine, sources, calls, respond } = setup(t);
  const file = recordingProfile("rain", "rain").file;
  await engine.start();
  assert.equal(sources.length, 1, "only tones have a synthetic source");
  engine.mix(mix("rain"), 0.5, true, false, "rain");
  assert.equal(sources.length, 1);
  respond(file, 503);
  await tick();
  assert.equal(sources.length, 1, "failed downloads must leave the channel silent");
  engine.mix(mix("rain"), 0.5, true, false, "rain");
  assert.equal(calls.length, 1, "mixer updates do not create a retry storm");
  t.mock.timers.tick(1500);
  assert.equal(calls.length, 2);
  respond(file);
  await tick();
  assert.equal(sources.length, 2, "a successful retry fades in the recording");
});

test("decode failures stop retrying after two retries", async t => {
  const { engine, sources, calls, respond, failDecoding } = setup(t);
  const file = recordingProfile("rain", "rain").file;
  await engine.start();
  failDecoding();
  engine.mix(mix("rain"), 0.5, true, false, "rain");
  for (const delay of [1500, 3000]) {
    respond(file);
    await tick();
    t.mock.timers.tick(delay);
  }
  respond(file);
  await tick();
  t.mock.timers.tick(60000);
  engine.mix(mix("rain"), 0.5, true, false, "rain");
  assert.equal(calls.length, 3);
  assert.equal(sources.length, 1);
});

test("a new scene fades the old voice before downloading and stays silent if it fails", async t => {
  const { engine, sources, filters, gains, respond } = setup(t);
  await engine.start();
  engine.mix(mix("wind"), 0.5, true, false, "snow");
  respond(recordingProfile("snow", "wind").file);
  await tick();
  const oldSource = sources[1];
  const oldGain = gains[gains.length - 1];
  engine.mix(mix("wind"), 0.5, true, false, "meadow");
  assert.deepEqual(oldSource.stops, [12.1], "stop is scheduled before the next file arrives");
  assert.deepEqual(oldGain.gain.ramps.at(-1), { value: 0, time: 12 });
  respond(recordingProfile("meadow", "wind").file, 503);
  await tick();
  assert.equal(sources.length, 2, "failure must not replace the old voice with noise");
  oldSource.onended?.();
  assert.ok(oldSource.disconnected);
  assert.ok(filters.every(filter => filter.disconnected), "both filters are released after fading out");
});

test("a slow old scene download cannot replace the current scene; teardown stops voices and filters", async t => {
  const { engine, sources, filters, respond } = setup(t);
  await engine.start();
  engine.mix(mix("wind"), 0.5, true, false, "snow");
  engine.mix(mix("wind"), 0.5, true, false, "meadow");
  respond(recordingProfile("meadow", "wind").file);
  await tick();
  const count = sources.length;
  respond(recordingProfile("snow", "wind").file);
  await tick();
  assert.equal(sources.length, count, "stale download must not create a voice");
  assert.equal(engine.tracks.get("wind")!.gain.value, 0.3);
  assert.equal(filters.find(filter => filter.type === "highpass")?.frequency.value,
    recordingProfile("meadow", "wind").highpass ?? 40);
  await engine.close();
  assert.ok(sources.every(source => source.stops.length));
  assert.ok(filters.every(filter => filter.disconnected));
});

test("the underwater recording removes low rumble as well as surface brightness", async t => {
  const { engine, filters, sources, respond } = setup(t);
  const profile = recordingProfile("jelly", "wind");
  await engine.start();
  engine.mix(mix("wind"), 0.5, true, false, "jelly");
  respond(profile.file);
  await tick();
  const highpass = filters.find(filter => filter.type === "highpass");
  const lowpass = filters.find(filter => filter.type === "lowpass");
  assert.equal(highpass?.frequency.value, profile.highpass);
  assert.equal(lowpass?.frequency.value, profile.cutoff);
  assert.equal(sources[1].connections[0], highpass);
  assert.equal(highpass?.connections[0], lowpass);
});

for (const action of ["pause", "mute", "volume", "channel", "stop", "scene", "close"] as const) {
  test(`${action} cancels a pending retry`, async t => {
    const { engine, calls, respond } = setup(t);
    await engine.start();
    engine.mix(mix("wind"), 0.5, true, false, "snow");
    respond(recordingProfile("snow", "wind").file, 503);
    await tick();
    if (action === "close") await engine.close();
    else if (action === "stop") engine.stop();
    else engine.mix(
      action === "channel" ? mix("tones") : mix("wind"),
      action === "volume" ? 0 : 0.5,
      action !== "pause", action === "mute", action === "scene" ? "meadow" : "snow",
    );
    const count = calls.length;
    t.mock.timers.tick(1500);
    assert.equal(calls.length, count);
  });
}

test("mute ignores a pending completion and reuses its decoded buffer on resume", async t => {
  const { engine, sources, calls, respond } = setup(t);
  await engine.start();
  engine.mix(mix("wind"), 0.5, true, false, "snow");
  engine.mix(mix("wind"), 0.5, true, true, "snow");
  respond(recordingProfile("snow", "wind").file);
  await tick();
  assert.equal(sources.length, 1);
  assert.equal(engine.master.gain.value, 0);
  engine.mix(mix("wind"), 0.5, true, false, "snow");
  await tick();
  assert.equal(sources.length, 2);
  assert.equal(calls.length, 1);
});

test("close aborts downloads and prevents an in-flight decode from creating a voice", async t => {
  const { engine, sources, calls, respond, deferDecoding, finishDecoding } = setup(t);
  await engine.start();
  deferDecoding();
  engine.mix(mix("rain"), 0.5, true, false, "rain");
  respond(recordingProfile("rain", "rain").file);
  await tick();
  engine.mix(mix("wind"), 0.5, true, false, "snow");
  await engine.close();
  assert.ok(calls.every(call => call.signal?.aborted));
  finishDecoding();
  await tick();
  assert.equal(sources.length, 1);
  t.mock.timers.tick(60000);
  assert.equal(calls.length, 2);
});

 test("brown noise loads the quiet recording only when enabled", async t => {
  const { engine, sources, calls, respond } = setup(t);
  await engine.start();
  engine.mix(mix("tones"), 0.5, true, false, "rain");
  assert.equal(calls.length, 0);
  const profile = recordingProfile("rain", "brown");
  assert.equal(profile.file, "soft-brown-noise.flac");
  assert.ok(profile.level <= 0.12);
  engine.mix(mix("brown"), 0.5, true, false, "rain");
  assert.equal(sources.length, 1);
  respond(profile.file);
  await tick();
  assert.equal(sources.length, 2);
});

test("pond bubbles have their own gain, work without water or wind, and stop when muted", async t => {
  const { engine, sources, respond, calls } = setup(t);
  await engine.start();
  engine.mix(mix("pondDrops"), 0.5, true, false, "pond");
  engine.playPondDrop();
  assert.equal(sources.length, 1);
  assert.equal(calls.length, 1, "only the bubble file is needed");
  respond("mixkit-water-bubble.wav");
  await tick();
  assert.equal(sources.length, 1, "loading must not trigger a late drop");
  engine.playPondDrop();
  const drop = sources[1];
  assert.equal(drop.loop, false);
  const gain = drop.connections[0] as { connections: unknown[] };
  assert.equal(gain.connections[0], engine.tracks.get("pondDrops"));
  engine.mix(mix("wind"), 0.5, true, false, "pond");
  assert.ok(drop.stops.length, "muting bubbles stops existing drops even if wind is on");
  engine.playPondDrop();
  assert.equal(sources.length, 2, "wind cannot trigger more bubbles");
});

for (const channel of ["ambience", "wind"] as const) {
  test(`pond ${channel} alone never loads or triggers bubbles`, async t => {
    const { engine, sources, calls } = setup(t);
    await engine.start();
    engine.mix(mix(channel), 0.5, true, false, "pond");
    assert.ok(calls.every(call => !call.url.endsWith("mixkit-water-bubble.wav")));
    engine.playPondDrop();
    assert.equal(sources.length, 1);
  });
}



test("curtain muffles late-loading rain and restores the mix without restarting it", async t => {
  const { engine, filters, sources, respond } = setup(t);
  await engine.start();
  const volumes = { ...mix("rain"), brown: 0.2 };
  const profile = recordingProfile("morningLattice", "rain");
  engine.mix(volumes, 0.5, true, false, "morningLattice", 2, "focus", true);
  respond(profile.file);
  await tick();
  const rainFilter = filters.find(f => f.type === "lowpass" && f.frequency.value === Math.min(profile.cutoff, 950));
  assert.ok(rainFilter);
  assert.equal(engine.tracks.get("rain")?.gain.value, 0.3 * 0.55);
  assert.equal(engine.tracks.get("brown")?.gain.value, 0.2);
  const count = sources.length;
  engine.mix(volumes, 0.5, true, false, "morningLattice", 2, "focus", false);
  assert.equal(rainFilter.frequency.value, profile.cutoff);
  assert.equal(engine.tracks.get("rain")?.gain.value, 0.3);
  assert.equal(sources.length, count);
  assert.equal(volumes.rain, 0.3);
});

test("orbital pad is local, Unwind-only, and cancels late playback after leaving its scene", async t => {
  const { engine, calls, sources, respond } = setup(t);
  await engine.start();
  const volumes = mix("orbitalPad");
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.3, "focus");
  assert.equal(calls.length, 0);
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.3, "unwind");
  assert.equal(calls[0].url, "/audio/orbital-pad-loop.mp3");
  engine.mix(volumes, 0.5, true, false, "rain", 0.3, "unwind");
  respond("orbital-pad-loop.mp3");
  await tick();
  assert.equal(sources.length, 1);
  assert.equal(engine.tracks.get("orbitalPad")!.gain.value, 0);
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.3, "unwind");
  await tick();
  assert.equal(calls.length, 1, "returning reuses the decoded loop");
  assert.equal(sources.length, 2);
  assert.equal(sources[1].loop, true);
  assert.equal(engine.tracks.get("orbitalPad")!.gain.value, 0.3);
  engine.mix(volumes, 0.5, true, true, "orbitStudy", 0.3, "unwind");
  assert.equal(engine.master.gain.value, 0);
});

test("Orbit immersion gently boosts only the pad and reverses without restarting audio", async t => {
  const { engine, calls, sources, respond } = setup(t);
  await engine.start();
  const volumes = { ...mix("orbitalPad"), brown: 0.1 };
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.45, "unwind", false, true);
  assert.equal(engine.tracks.get("orbitalPad")!.gain.value, 0.33);
  assert.equal(engine.tracks.get("brown")!.gain.value, 0.1);
  const pad = engine.tracks.get("orbitalPad")!.gain as unknown as { targets: { value: number; constant: number }[] };
  assert.equal(pad.targets.at(-1)?.constant, 0.45);
  respond("orbital-pad-loop.mp3");
  respond("soft-brown-noise.flac");
  await tick();
  const count = sources.length;
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.45, "unwind", false, false);
  assert.equal(engine.tracks.get("orbitalPad")!.gain.value, 0.3);
  assert.equal(engine.tracks.get("brown")!.gain.value, 0.1);
  assert.equal(pad.targets.at(-1)?.constant, 0.45);
  assert.equal(sources.length, count);
  assert.equal(calls.length, 2);
  assert.equal(volumes.orbitalPad, 0.3, "the saved mix is never modified");
  engine.mix({ ...volumes, orbitalPad: 1 }, 0.5, true, false, "orbitStudy", 0.45, "unwind", false, true);
  assert.equal(engine.tracks.get("orbitalPad")!.gain.value, 1, "boost stays in the mixer range");
});

test("Orbit Study's relaxation preset reuses water, rain and brown noise without loading the pad", async t => {
  const { engine, calls, sources, respond, filters } = setup(t);
  await engine.start();
  const volumes = sceneMix(visuals.find(v => v.id === "orbitStudy")!);
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.45, "unwind");
  const water = recordingProfile("orbitStudy", "wind");
  assert.equal(water.file, recordingProfile("ocean", "wind").file);
  assert.ok(water.cutoff < recordingProfile("ocean", "wind").cutoff);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(call => !call.url.includes("orbital-pad")));
  for (const id of ["wind", "rain", "brown"] as const) respond(recordingProfile("orbitStudy", id).file);
  await tick();
  assert.ok(filters.some(filter => filter.type === "lowpass" && filter.frequency.value === 1800));
  const count = sources.length;
  engine.mix(volumes, 0.5, true, false, "orbitStudy", 0.45, "unwind", false, true);
  assert.equal(sources.length, count);
  assert.equal(calls.length, 3);
  assert.equal(engine.tracks.get("wind")!.gain.value, 0.28);
  assert.equal(engine.tracks.get("rain")!.gain.value, 0.08);
  assert.equal(engine.tracks.get("brown")!.gain.value, 0.10);
  assert.equal(engine.tracks.get("orbitalPad")!.gain.value, 0);
});

test("binaural carriers stay isolated by ear, retune smoothly, and release on stop", async t => {
  const { engine, oscillators, mergers, calls } = setup(t);
  await engine.start();
  engine.mix(mix("binaural"), 0.5, true, false, "snow");
  assert.equal(calls.length, 0, "beats require no downloads");
  assert.equal(oscillators.length, 2);
  assert.equal(oscillators[1].frequency.value - oscillators[0].frequency.value, 2.5);
  assert.deepEqual(oscillators.map(o => o.routes[0]), [
    { target: mergers[0], output: 0, input: 0 },
    { target: mergers[0], output: 0, input: 1 },
  ]);
  engine.mix(mix("binaural"), 0.5, true, false, "aurora", 0.3, "unwind", false, false, 9.5);
  assert.equal(oscillators.length, 2, "slider changes reuse the carriers");
  assert.equal(oscillators[1].frequency.value - oscillators[0].frequency.value, 9.5);
  assert.equal(oscillators[0].frequency.targets.at(-1)?.constant, 0.6);
  engine.stop();
  assert.ok(oscillators.every(o => o.stops.includes(12.05)));
  oscillators[0].onended?.();
  assert.ok(oscillators.every(o => o.disconnected));
  assert.ok(mergers.every(m => m.disconnected));
});

test("Open water ignores new scene channels even with stale custom values", async t => {
  const { engine, calls, oscillators } = setup(t);
  await engine.start();
  engine.mix({ ...silentMix, ambience: 0.5, texture: 0.5, binaural: 0.5 }, 0.5, true, false, "ocean");
  assert.equal(calls.length, 0);
  assert.equal(oscillators.length, 0);
  for (const id of ["ambience", "texture", "binaural"] as const) assert.equal(engine.tracks.get(id)!.gain.value, 0);
  const ocean = visuals.find(v => v.id === "ocean")!;
  assert.deepEqual(ocean.defaultSounds, { wind: 0.24 });
  assert.deepEqual(recordingProfile("ocean", "wind"), { file: "mixkit-water-flowing-ambience-loop-3126.wav", level: 0.3, cutoff: 4200, highpass: 80 });
});

for (const action of ["mute", "pause", "channel", "scene"] as const) {
  test(`new synthesis fades and cleans up on ${action}`, async t => {
    const { engine, oscillators, sources, filters } = setup(t);
    await engine.start();
    const volumes = { ...silentMix, texture: 0.3, binaural: 0.08 };
    engine.mix(volumes, 0.5, true, false, "ribbonTunnel");
    assert.ok(oscillators.length > 2);
    assert.equal(sources.length, 2, "ribbon adds one filtered noise source");
    engine.mix(action === "channel" ? silentMix : volumes, 0.5, action !== "pause", action === "mute", action === "scene" ? "ocean" : "ribbonTunnel");
    assert.ok(oscillators.every(o => o.stops.length > 0));
    assert.ok(sources[1].stops.length > 0);
    await engine.close();
    assert.ok(oscillators.every(o => o.disconnected));
    assert.ok(filters.every(f => f.disconnected));
  });
}

test("missing new ambience stays silent and a late scene download cannot leak through", async t => {
  const { engine, sources, respond } = setup(t);
  await engine.start();
  engine.mix(mix("ambience"), 0.5, true, false, "aurora");
  respond(recordingProfile("aurora", "ambience").file, 404);
  await tick();
  assert.equal(sources.length, 1);
  t.mock.timers.tick(1500);
  engine.mix(mix("ambience"), 0.5, true, false, "mist");
  respond(recordingProfile("aurora", "ambience").file);
  await tick();
  assert.equal(sources.length, 1);
  respond(recordingProfile("mist", "ambience").file);
  await tick();
  assert.equal(sources.length, 2);
});

test("revised presets keep restrained layers and binaural audio off", () => {
  assert.equal(Object.keys(sceneSoundscapes).length, 19);
  const frequencies = new Set<number>();
  for (const [id, profile] of Object.entries(sceneSoundscapes)) {
    const visual = visuals.find(v => v.id === id)!;
    const volumes = sceneMix(visual);
    assert.equal(volumes.tones, id === "vinyl" ? 0.06 : 0);
    assert.equal(volumes.binaural, 0, "headphone-only layer is opt-in");
    const maxLayers = id === "vinyl" || id === "quietMachine" ? 4 : 3;
    assert.ok(Object.entries(volumes).filter(([channel, volume]) => channel !== "vinylMusic" && volume > 0).length <= maxLayers);
    frequencies.add(profile.beatHz);
  }
  assert.equal(frequencies.size, 19);
});

for (const scene of ["clouds", "ribbonTunnel"] as const) {
  test(`${scene} air and tonal layers can each play alone`, async t => {
    const { engine, oscillators, sources, calls } = setup(t);
    await engine.start();
    engine.mix(mix("texture"), 0.5, true, false, scene);
    assert.equal(sources.length, 2, "air has a noise buffer");
    assert.ok(oscillators.every(o => o.frequency.value < 1), "air contains no audible pitched oscillators");
    const air = sources[1];
    engine.mix(mix("textureTone"), 0.5, true, false, scene);
    assert.ok(air.stops.length, "turning air off fades its source");
    assert.equal(sources.length, 2, "enabling tones does not create another noise buffer");
    const tones = oscillators.filter(o => o.frequency.value > 20);
    assert.ok(tones.length > 0);
    assert.equal(engine.tracks.get("texture")!.gain.value, 0);
    assert.equal(engine.tracks.get("textureTone")!.gain.value, 0.3);
    assert.equal(calls.length, 0);
    engine.mix(mix("textureTone"), 0.5, true, false, "rain");
    assert.equal(engine.tracks.get("textureTone")!.gain.value, 0);
    assert.ok(tones.every(o => o.stops.length), "leaving the scene releases tones");
    await engine.close();
    assert.ok(oscillators.every(o => o.disconnected));
  });
}

test("duplicate recording channels cannot play even with stale mixer overrides", async t => {
  const { engine, calls } = setup(t);
  await engine.start();
  for (const scene of ["embers", "nightSky", "ocean", "mist"] as const) {
    const removed = scene === "embers" || scene === "nightSky" ? "wind" : "rain";
    engine.mix(mix(removed), 0.5, true, false, scene);
    assert.equal(engine.tracks.get(removed)!.gain.value, 0);
  }
  assert.equal(calls.length, 0);
});

for (const scene of ["aurora", "stars", "pond", "mist", "ink", "vinyl", "nightSky"] as const) {
  test(`${scene} ambience loads its own file with the correct loop seam handling`, async t => {
    const { engine, sources, calls, respond } = setup(t);
    await engine.start();
    engine.mix(mix("ambience"), 0.5, true, false, scene);
    const profile = recordingProfile(scene, "ambience");
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith(`/audio/${profile.file}`));
    respond(profile.file);
    await tick();
    assert.equal(sources[1].loop, true);
    const buffer = sources[1].buffer as AudioBuffer;
    const native = scene !== "pond";
    assert.equal(buffer.length, native ? 100 : 80, "native cycles remain intact; field recordings receive a 2s overlap");
  });
}

test("Vinyl Z fades only its separate piano layer and respects its saved volume", async t => {
  const { engine, sources, calls, respond } = setup(t);
  await engine.start();
  const volumes = { ...silentMix, vinylMusic: 0.16, ambience: 0.24, rain: 0.1 };
  const play = (active: boolean, v = volumes) => engine.mix(v, 0.5, true, false, "vinyl", 0.3, "unwind", false, false, undefined, active);
  play(false);
  assert.ok(calls.every(call => !call.url.endsWith("859607__blankierest__sleepy-upright-piano-seamless-loop.wav")), "no music download before Z");
  assert.equal(engine.tracks.get("vinylMusic")!.gain.value, 0);
  play(true);
  respond("859607__blankierest__sleepy-upright-piano-seamless-loop.wav");
  await tick();
  assert.equal(sources[1].loop, true);
  const gain = engine.tracks.get("vinylMusic")!.gain as unknown as { value: number; targets: { value: number; constant: number }[] };
  assert.equal(gain.value, 0.16);
  assert.equal(gain.targets.at(-1)?.constant, 1, "slow three-second settling fade");
  assert.equal(engine.tracks.get("ambience")!.gain.value, 0.24);
  assert.equal(engine.tracks.get("rain")!.gain.value, 0.1);
  play(false);
  assert.equal(gain.value, 0);
  assert.equal(volumes.vinylMusic, 0.16, "toggle never changes preferences");
  play(true);
  assert.equal(sources.length, 2, "toggling reuses the current loop without restarting it");
  play(true, { ...volumes, vinylMusic: 0 });
  assert.equal(gain.value, 0, "saved zero always wins over Z");
});

for (const action of ["toggle", "scene", "pause", "mute", "stop", "close"] as const) {
  test(`Vinyl ${action} blocks a late piano download`, async t => {
    const { engine, sources, respond, calls } = setup(t);
    await engine.start();
    const volumes = { ...silentMix, vinylMusic: 0.16 };
    engine.mix(volumes, 0.5, true, false, "vinyl", 0.3, "unwind", false, false, undefined, true);
    if (action === "stop") engine.stop();
    else if (action === "close") await engine.close();
    else engine.mix(volumes, 0.5, action !== "pause", action === "mute", action === "scene" ? "rain" : "vinyl", 0.3, "unwind", false, false, undefined, action !== "toggle");
    if (action === "close") assert.ok(calls.every(call => call.signal?.aborted));
    else respond("859607__blankierest__sleepy-upright-piano-seamless-loop.wav");
    await tick();
    assert.equal(sources.length, 1);
  });
}

for (const scene of ["snow", "dunes"] as const) {
  test(`${scene} ignores stale ambience settings after rejected recordings are removed`, async t => {
    const { engine, calls, sources, respond } = setup(t);
    await engine.start();
    engine.mix(mix("ambience"), 0.5, true, false, scene);
    assert.equal(calls.length, 0, "stale saved volume cannot fetch a rejected recording");
    assert.equal(engine.tracks.get("ambience")!.gain.value, 0);
    engine.mix(mix("ambience"), 0.5, true, false, "aurora");
    respond(recordingProfile("aurora", "ambience").file);
    await tick();
    assert.equal(sources.length, 2);
    engine.mix(mix("ambience"), 0.5, true, false, scene);
    assert.ok(sources[1].stops.length > 0, "previous scene ambience fades out");
    assert.equal(engine.tracks.get("ambience")!.gain.value, 0);
    assert.equal(calls.length, 1);
    assert.equal(sceneSoundscapes[scene]?.ambience, undefined);
    assert.equal(sceneMix(visuals.find(v => v.id === scene)!).ambience, 0);
  });
}

test("Deep blue blocks saved crickets and silences them when entering from another scene", async t => {
  const { engine, calls, respond } = setup(t);
  await engine.start();
  engine.mix(mix("night"), 0.5, true, false, "jelly");
  assert.equal(calls.length, 0);
  assert.equal(engine.tracks.get("night")!.gain.value, 0);
  engine.mix(mix("night"), 0.5, true, false, "meadow");
  respond(recordingProfile("meadow", "night").file);
  await tick();
  assert.ok(engine.tracks.get("night")!.gain.value > 0);
  engine.mix(mix("night"), 0.5, true, false, "jelly");
  assert.equal(engine.tracks.get("night")!.gain.value, 0);
});

test("Quiet Machine tape loops independently and releases its source on scene exit", async t => {
  const { engine, sources, calls, oscillators } = setup(t);
  await engine.start();
  engine.mix(mix("texture"), 0.5, true, false, "quietMachine", 0.3, "focus");
  assert.equal(calls.length, 0, "original tape needs no download");
  assert.equal(sources.length, 2);
  assert.equal(sources[1].loop, true);
  assert.equal(oscillators.length, 0, "tape contains no pitched or binaural carrier");
  assert.equal(engine.tracks.get("brown")!.gain.value, 0);
  engine.mix(mix("texture"), 0.5, true, false, "rain");
  assert.ok(sources[1].stops.length > 0);
  await engine.close();
  assert.ok(sources[1].disconnected);
});

test("Quiet Machine soft atmosphere loads its own native loop independently of tape", async t => {
  const { engine, calls, sources, respond } = setup(t);
  await engine.start();
  engine.mix(mix("ambience"), 0.5, true, false, "quietMachine", 0.3, "focus");
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/audio/quiet-machine-d-minor-loop.wav"));
  respond("quiet-machine-d-minor-loop.wav");
  await tick();
  assert.equal(sources.length, 2);
  assert.equal(sources[1].loop, true);
  assert.equal((sources[1].buffer as AudioBuffer).length, 100, "the generated file is already a native loop");
  assert.equal(engine.tracks.get("texture")!.gain.value, 0);
  assert.equal(engine.tracks.get("brown")!.gain.value, 0);
  engine.mix(mix("ambience"), 0.5, true, false, "rain");
  assert.ok(sources[1].stops.length > 0);
});
