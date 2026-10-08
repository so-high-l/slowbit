import type { SoundId, VisualId } from "./types";
import { recordingProfile, type RecordedChannel } from "./audio-profiles.ts";

const ASSET_URL = (process.env.NEXT_PUBLIC_ASSET_URL ?? "").replace(/\/$/, "");
type Voice = { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode };

export class AmbientEngine {
  context: AudioContext;
  master: GainNode;
  tracks = new Map<SoundId, GainNode>();
  sources: AudioBufferSourceNode[] = [];
  private recordingFallbackGains = new Map<SoundId, GainNode>();
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private requests = new Map<RecordedChannel, { key: string }>();
  private voices = new Map<RecordedChannel, Voice>();
  private liveVoices = new Set<Voice>();
  private loads = new Set<AbortController>();
  private closed = false;

  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
  }

  async start() {
    if (this.closed) return;
    await this.context.resume();
    if (!this.sources.length && !this.closed) this.createProceduralTracks();
  }

  private createProceduralTracks() {
    for (const id of [
      "rain",
      "fire",
      "wind",
      "forest",
      "brown",
      "night",
      "tones",
    ] as SoundId[]) {
      const c = this.context;
      const seconds = 16;
      const frequencies = [110, 164.8125, 220, 261.625, 329.625];
      const size = c.sampleRate * seconds;
      const buffer = c.createBuffer(2, size, c.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let brown = 0;
        let smooth = 0;
        for (let i = 0; i < size; i++) {
          const t = i / c.sampleRate;
          const white = Math.random() * 2 - 1;
          brown = (brown + 0.022 * white) / 1.022;
          smooth = 0.985 * smooth + 0.015 * white;
          const swell = 0.65 + 0.35 * Math.sin((2 * Math.PI * t) / seconds);
          let value = 0;
          if (id === "rain") value = white * 0.19 + brown * 0.35;
          if (id === "brown") value = brown * 2.6;
          if (id === "wind") value = smooth * 0.2 * swell;
          // A quiet, warm fallback without synthetic popping while fire loads.
          if (id === "fire") value = brown * 0.1;
          if (id === "forest") value = smooth * 0.1;
          if (id === "night") {
            // Quiet air while the recording loads; never fall back to a tone.
            value = smooth * 0.1;
          }
          if (id === "tones") {
            value =
              frequencies.reduce(
                (sum, frequency, voice) =>
                  sum +
                  Math.sin(2 * Math.PI * frequency * t + channel * 0.15) *
                  (0.045 / (1 + voice * 0.5)),
                0,
              ) *
              (0.72 + 0.28 * Math.cos((2 * Math.PI * t) / seconds));
          }
          const edge =
            id === "tones"
              ? 1
              : Math.min(
                1,
                i / (c.sampleRate * 0.08),
                (size - 1 - i) / (c.sampleRate * 0.08),
              );
          data[i] = value * edge;
        }
      }
      const source = c.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = c.createGain();
      gain.gain.value = 0;
      if (id !== "brown" && id !== "tones") {
        const fallback = c.createGain();
        this.recordingFallbackGains.set(id, fallback);
        source.connect(fallback);
        fallback.connect(gain);
      } else {
        source.connect(gain);
      }
      gain.connect(this.master);
      this.tracks.set(id, gain);
      source.start();
      this.sources.push(source);
    }
  }


  private async buffer(file: string) {
    let pending = this.buffers.get(file);
    if (!pending) {
      pending = (async () => {
        const controller = new AbortController();
        this.loads.add(controller);
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch(`${ASSET_URL}/audio/${file}`, { signal: controller.signal });
          if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
          const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
          // Blend the tail into the opening once, so even non-loop wind has no hard seam.
          const overlap = Math.min(Math.floor(buffer.sampleRate * 2), Math.floor(buffer.length / 4));
          const length = buffer.length - overlap;
          const loop = this.context.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const input = buffer.getChannelData(channel);
            const output = loop.getChannelData(channel);
            output.set(input.subarray(0, length));
            for (let i = 0; i < overlap; i++) {
              const blend = i / overlap;
              output[i] = input[length + i] * (1 - blend) + input[i] * blend;
            }
          }
          return loop;
        } finally {
          clearTimeout(timeout);
          this.loads.delete(controller);
        }
      })();
      this.buffers.set(file, pending);
      void pending.catch(() => this.buffers.delete(file));
    }
    return pending;
  }

  private async selectRecording(id: RecordedChannel, scene: VisualId) {
    const profile = recordingProfile(scene, id);
    const key = JSON.stringify(profile);
    if (this.requests.get(id)?.key === key || this.closed) return;
    const request = { key };
    this.requests.set(id, request);
    try {
      const buffer = await this.buffer(profile.file);
      if (this.closed || this.requests.get(id) !== request) return;
      const track = this.tracks.get(id);
      if (!track) return;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = profile.cutoff;
      filter.Q.value = 0.5;
      const gain = this.context.createGain();
      gain.gain.value = 0;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(track);
      const voice = { source, gain, filter };
      this.liveVoices.add(voice);
      source.onended = () => {
        source.disconnect(); filter.disconnect(); gain.disconnect();
        this.liveVoices.delete(voice);
      };
      const now = this.context.currentTime;
      source.start();
      gain.gain.linearRampToValueAtTime(profile.level, now + 2);
      const previous = this.voices.get(id);
      if (previous) {
        previous.gain.gain.cancelAndHoldAtTime(now);
        previous.gain.gain.linearRampToValueAtTime(0, now + 2);
        previous.source.stop(now + 2.1);
      }
      this.voices.set(id, voice);
      const fallback = this.recordingFallbackGains.get(id);
      fallback?.gain.cancelAndHoldAtTime(now);
      fallback?.gain.linearRampToValueAtTime(0, now + 2);
    } catch {
      // Leave the previous recording or quiet fallback running if R2 is unavailable.
      if (this.requests.get(id) === request) this.requests.delete(id);
    }
  }

  stop() {
    if (!this.closed) this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.45);
  }

  mix(volumes: Record<SoundId, number>, global: number, playing: boolean, muted: boolean, scene: VisualId = "rain") {
    if (this.closed) return;
    const now = this.context.currentTime;
    for (const [id, gain] of this.tracks) {
      gain.gain.setTargetAtTime(volumes[id] ?? 0, now, 0.3);
      if (playing && !muted && volumes[id] > 0 && id !== "brown" && id !== "tones")
        void this.selectRecording(id, scene);
    }
    this.master.gain.setTargetAtTime(playing && !muted ? global : 0, now, 0.45);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    for (const load of this.loads) load.abort();
    for (const voice of this.liveVoices) {
      voice.source.onended = null;
      voice.source.stop();
      voice.source.disconnect(); voice.filter.disconnect(); voice.gain.disconnect();
    }
    for (const source of this.sources) { source.stop(); source.disconnect(); }
    for (const gain of this.tracks.values()) gain.disconnect();
    for (const gain of this.recordingFallbackGains.values()) gain.disconnect();
    this.buffers.clear(); this.liveVoices.clear(); this.voices.clear();
    this.master.disconnect();
    await this.context.close();
  }
}
