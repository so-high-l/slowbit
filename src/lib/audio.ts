import type { SoundId, VisualId } from "./types";
import { recordingProfile, type RecordedChannel, type RecordingProfile } from "./audio-profiles.ts";

const ASSET_URL = (process.env.NEXT_PUBLIC_ASSET_URL ?? "").replace(/\/$/, "");
type Voice = { key: string; source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode; highpass: BiquadFilterNode };
type RecordingRequest = { key: string; scene: VisualId; retries: number; retry?: ReturnType<typeof setTimeout> };

export class AmbientEngine {
  context: AudioContext;
  master: GainNode;
  tracks = new Map<SoundId, GainNode>();
  sources: AudioBufferSourceNode[] = [];
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private requests = new Map<RecordedChannel, RecordingRequest>();
  private voices = new Map<RecordedChannel, Voice>();
  private liveVoices = new Set<Voice>();
  private loads = new Set<AbortController>();
  private closed = false;
  private pondEnabled = false;
  private pondBuffer?: AudioBuffer;
  private pondLoading = false;
  private drops = new Set<{ source: AudioBufferSourceNode; gain: GainNode }>();

  private stopDrops() {
    for (const drop of this.drops) {
      drop.source.onended = null;
      drop.source.stop(); drop.source.disconnect(); drop.gain.disconnect();
    }
    this.drops.clear();
  }

  playPondDrop() {
    if (this.closed || !this.pondEnabled || !this.pondBuffer || this.drops.size >= 2) return;
    const source = this.context.createBufferSource();
    source.buffer = this.pondBuffer;
    source.loop = false;
    const gain = this.context.createGain();
    gain.gain.value = 0.16;
    source.connect(gain);
    gain.connect(this.tracks.get("wind")!);
    const drop = { source, gain };
    this.drops.add(drop);
    source.onended = () => {
      source.disconnect(); gain.disconnect(); this.drops.delete(drop);
    };
    source.start();
  }

  private async preparePondDrop() {
    if (this.pondBuffer || this.pondLoading) return;
    this.pondLoading = true;
    try { this.pondBuffer = await this.buffer("mixkit-water-bubble.wav", false); }
    catch { /* Skip missing drops rather than substitute noise. */ }
    finally { this.pondLoading = false; }
  }

  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
  }

  async start() {
    if (this.closed) return;
    await this.context.resume();
    if (!this.tracks.size && !this.closed) this.createTracks();
  }

  private createTracks() {
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
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.connect(this.master);
      this.tracks.set(id, gain);
      // Recorded channels stay silent until decoded audio is ready.
      if (id !== "tones") continue;
      const seconds = 16;
      const frequencies = [110, 164.8125, 220, 261.625, 329.625];
      const size = c.sampleRate * seconds;
      const buffer = c.createBuffer(2, size, c.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < size; i++) {
          const t = i / c.sampleRate;
          const value =
              frequencies.reduce(
                (sum, frequency, voice) =>
                  sum +
                  Math.sin(2 * Math.PI * frequency * t + channel * 0.15) *
                  (0.045 / (1 + voice * 0.5)),
                0,
              ) *
              (0.72 + 0.28 * Math.cos((2 * Math.PI * t) / seconds));
          data[i] = value;
        }
      }
      const source = c.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
      this.sources.push(source);
    }
  }


  private async buffer(file: string, looping = true) {
    let pending = this.buffers.get(file);
    if (!pending) {
      pending = (async () => {
        const controller = new AbortController();
        this.loads.add(controller);
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch(`${ASSET_URL}/audio/${file}`, { signal: controller.signal });
          if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
          const bytes = await response.arrayBuffer();
          if (this.closed) throw new Error("Audio engine closed");
          const buffer = await this.context.decodeAudioData(bytes);
          if (this.closed) throw new Error("Audio engine closed");
          if (!looping) return buffer;
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

  private cancelRequest(id: RecordedChannel) {
    const request = this.requests.get(id);
    if (request?.retry !== undefined) clearTimeout(request.retry);
    this.requests.delete(id);
  }

  private fadeVoice(id: RecordedChannel) {
    const previous = this.voices.get(id);
    if (!previous) return;
    this.voices.delete(id);
    const now = this.context.currentTime;
    previous.gain.gain.cancelAndHoldAtTime(now);
    previous.gain.gain.linearRampToValueAtTime(0, now + 2);
    previous.source.stop(now + 2.1);
  }

  private selectRecording(id: RecordedChannel, scene: VisualId) {
    const profile = recordingProfile(scene, id);
    const key = JSON.stringify(profile);
    const pending = this.requests.get(id);
    if (this.closed || (pending?.key === key && pending.scene === scene)) return;
    this.cancelRequest(id);
    if (this.voices.get(id)?.key === key) return;
    // Leave the old environment immediately, even when the next download fails.
    this.fadeVoice(id);
    const request = { key, scene, retries: 0 };
    this.requests.set(id, request);
    void this.loadRecording(id, request, profile);
  }

  private async loadRecording(id: RecordedChannel, request: RecordingRequest, profile: RecordingProfile) {
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
      const highpass = this.context.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = profile.highpass ?? 40;
      highpass.Q.value = 0.5;
      const gain = this.context.createGain();
      gain.gain.value = 0;
      source.connect(highpass);
      highpass.connect(filter);
      filter.connect(gain);
      gain.connect(track);
      const voice = { key: request.key, source, gain, filter, highpass };
      this.liveVoices.add(voice);
      source.onended = () => {
        source.disconnect(); highpass.disconnect(); filter.disconnect(); gain.disconnect();
        this.liveVoices.delete(voice);
        if (this.voices.get(id) === voice) this.voices.delete(id);
      };
      const now = this.context.currentTime;
      source.start();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(profile.level, now + 2);
      this.voices.set(id, voice);
      this.requests.delete(id);
    } catch {
      // Stay silent and retry transient failures twice, without substituting noise.
      if (this.closed || this.requests.get(id) !== request || request.retries >= 2) return;
      const delay = 1500 * 2 ** request.retries++;
      request.retry = setTimeout(() => {
        request.retry = undefined;
        if (!this.closed && this.requests.get(id) === request)
          void this.loadRecording(id, request, profile);
      }, delay);
    }
  }

  stop() {
    if (this.closed) return;
    this.pondEnabled = false;
    this.stopDrops();
    for (const id of this.requests.keys()) this.cancelRequest(id);
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.45);
  }

  mix(volumes: Record<SoundId, number>, global: number, playing: boolean, muted: boolean, scene: VisualId = "rain") {
    if (this.closed) return;
    this.pondEnabled = scene === "pond" && playing && !muted && global > 0 && volumes.wind > 0;
    if (!this.pondEnabled) this.stopDrops();
    else void this.preparePondDrop();
    const now = this.context.currentTime;
    for (const [id, gain] of this.tracks) {
      gain.gain.setTargetAtTime(volumes[id] ?? 0, now, 0.3);
      if (id === "tones") continue;
      if (playing && !muted && global > 0 && volumes[id] > 0)
        this.selectRecording(id, scene);
      else this.cancelRequest(id);
    }
    this.master.gain.setTargetAtTime(playing && !muted ? global : 0, now, 0.45);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.pondEnabled = false;
    this.stopDrops();
    for (const id of this.requests.keys()) this.cancelRequest(id);
    for (const load of this.loads) load.abort();
    for (const voice of this.liveVoices) {
      voice.source.onended = null;
      voice.source.stop();
      voice.source.disconnect(); voice.highpass.disconnect(); voice.filter.disconnect(); voice.gain.disconnect();
    }
    for (const source of this.sources) { source.stop(); source.disconnect(); }
    for (const gain of this.tracks.values()) gain.disconnect();
    this.buffers.clear(); this.liveVoices.clear(); this.voices.clear();
    this.master.disconnect();
    await this.context.close();
  }
}
