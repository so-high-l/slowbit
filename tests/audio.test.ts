import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { recordingProfile } from "../src/lib/audio-profiles.ts";
import { AmbientEngine } from "../src/lib/audio.ts";
import type { SoundMix } from "../src/lib/types.ts";

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
  rain: 0, wind: 0, fire: 0, forest: 0, night: 0, tones: 0, brown: 0, [channel]: 0.3,
});
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup(t: TestContext) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  class Param {
    value = 0;
    ramps: { value: number; time: number }[] = [];
    setValueAtTime(value: number) { this.value = value; }
    setTargetAtTime(value: number) { this.value = value; }
    linearRampToValueAtTime(value: number, time: number) {
      this.value = value;
      this.ramps.push({ value, time });
    }
    cancelAndHoldAtTime() {}
  }
  const node = () => ({
    disconnected: false,
    connections: [] as unknown[],
    connect(target: unknown) { this.connections.push(target); },
    disconnect() { this.disconnected = true; },
  });
  const sources: (ReturnType<typeof node> & {
    buffer: unknown; loop: boolean; onended: (() => void) | null; stops: number[];
    start(): void; stop(time?: number): void;
  })[] = [];
  const filters: (ReturnType<typeof node> & { frequency: Param; Q: Param; type: string })[] = [];
  const gains: (ReturnType<typeof node> & { gain: Param })[] = [];
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
    engine, sources, filters, gains, calls,
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

test("pond drops wait for ripples, never loop, and stop when muted", async t => {
  const { engine, sources, respond } = setup(t);
  await engine.start();
  engine.mix(mix("wind"), 0.5, true, false, "pond");
  engine.playPondDrop();
  assert.equal(sources.length, 1);
  respond("mixkit-water-bubble.wav");
  await tick();
  assert.equal(sources.length, 1, "loading must not trigger a late drop");
  respond(recordingProfile("pond", "wind").file);
  await tick();
  assert.equal(sources[1].loop, true, "quiet wind continues behind the drops");
  engine.playPondDrop();
  assert.equal(sources.length, 3);
  assert.equal(sources[2].loop, false);
  engine.mix(mix("wind"), 0.5, true, true, "pond");
  assert.ok(sources[2].stops.length);
  engine.playPondDrop();
  assert.equal(sources.length, 3);
});
