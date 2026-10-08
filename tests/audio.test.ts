import { test } from "node:test";
import assert from "node:assert/strict";
import { recordingProfile } from "../src/lib/audio-profiles.ts";
import { AmbientEngine } from "../src/lib/audio.ts";

test("recordings follow scene context under the same mixer channels", () => {
  assert.notEqual(recordingProfile("rain", "rain").file, recordingProfile("meadow", "rain").file);
  assert.notEqual(recordingProfile("snow", "wind").file, recordingProfile("meadow", "wind").file);
  assert.match(recordingProfile("pond", "wind").file, /forest/);
  assert.match(recordingProfile("mist", "wind").file, /water-flowing/);
  assert.match(recordingProfile("meadow", "forest").file, /birds/);
  assert.ok(recordingProfile("rain", "wind").level < recordingProfile("snow", "wind").level);
});

test("a slow old scene download cannot replace the current scene; teardown stops voices", async () => {
  class Param {
    value = 0;
    setTargetAtTime(v: number) { this.value = v; }
    linearRampToValueAtTime(v: number) { this.value = v; }
    cancelAndHoldAtTime() {}
  }
  const sources: { buffer: unknown; stopped: boolean; stop: () => void }[] = [];
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    currentTime = 0; sampleRate = 10; destination = {};
    createGain() { return { ...node(), gain: new Param() }; }
    createBiquadFilter() { return { ...node(), frequency: new Param(), Q: new Param(), type: "" }; }
    createBufferSource() {
      const source = { ...node(), buffer: null as unknown, loop: false, onended: null, stopped: false, start() {}, stop() { this.stopped = true; } };
      sources.push(source); return source;
    }
    createBuffer(channels: number, length: number, sampleRate: number) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (i: number) => data[i] };
    }
    async decodeAudioData() { return this.createBuffer(2, 100, 10); }
    async resume() {} async close() {}
  }
  const originalContext = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  const pending = new Map<string, (response: Response) => void>();
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
  globalThis.fetch = ((url: string) => new Promise<Response>(resolve => pending.set(url, resolve))) as typeof fetch;
  const engine = new AmbientEngine();
  const tick = () => new Promise(resolve => setImmediate(resolve));
  try {
    await engine.start();
    const volumes = { rain: 0, wind: 0.3, fire: 0, forest: 0, night: 0, tones: 0, brown: 0 };
    engine.mix(volumes, 0.5, true, false, "snow");
    engine.mix(volumes, 0.5, true, false, "meadow");
    const response = () => new Response(new ArrayBuffer(8));
    pending.get('/audio/mixkit-forest-ambience-loop-1228.wav')!(response());
    await tick();
    const count = sources.length;
    pending.get('/audio/mixkit-wind-howl-exterior-1276.wav')!(response());
    await tick();
    assert.equal(sources.length, count, "stale download must not create a voice");
    assert.equal(engine.tracks.get("wind")!.gain.value, 0.3);
    engine.mix(volumes, 0.5, true, true, "meadow");
    assert.equal(engine.master.gain.value, 0);
    await engine.close();
    assert.ok(sources.every(source => source.stopped));
  } finally {
    await engine.close();
    globalThis.AudioContext = originalContext;
    globalThis.fetch = originalFetch;
  }
});
