import type { SoundId } from "./types";
// Original procedural stereo loops. No external recordings, requests, or licensing dependencies.
export class AmbientEngine {
  context: AudioContext;
  master: GainNode;
  tracks = new Map<SoundId, GainNode>();
  sources: AudioBufferSourceNode[] = [];
  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
  }
  async start() {
    await this.context.resume();
    if (this.sources.length) return;
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
          if (id === "wind") value = smooth * 2.3 * swell;
          if (id === "fire")
            value = brown * 0.9 + (Math.random() > 0.9992 ? white * 0.55 : 0);
          if (id === "forest") {
            const call = Math.pow(
              Math.max(0, Math.sin((2 * Math.PI * t) / 4)),
              20,
            );
            value =
              smooth * 0.8 +
              Math.sin(2 * Math.PI * (1800 * t + 25 * Math.sin(t * 8))) *
                call *
                0.06;
          }
          if (id === "night") {
            const pulse = Math.pow(
              Math.max(0, Math.sin(2 * Math.PI * t * 3)),
              14,
            );
            value =
              white * 0.012 +
              Math.sin(2 * Math.PI * 3600 * t) *
                pulse *
                (0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 8)) *
                0.035;
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
          // Window the loop boundary to zero to avoid discontinuities/clicks.
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
      source.connect(gain);
      gain.connect(this.master);
      source.start();
      this.tracks.set(id, gain);
      this.sources.push(source);
    }
  }
  mix(
    volumes: Record<SoundId, number>,
    global: number,
    playing: boolean,
    muted: boolean,
  ) {
    const now = this.context.currentTime;
    for (const [id, gain] of this.tracks)
      gain.gain.setTargetAtTime(volumes[id] ?? 0, now, 0.3);
    this.master.gain.setTargetAtTime(playing && !muted ? global : 0, now, 0.45);
  }
  async close() {
    await this.context.close();
  }
}
