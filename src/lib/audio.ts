import type { SoundId } from "./types";

const ASSET_URL = process.env.NEXT_PUBLIC_ASSET_URL ?? "";
const RAIN_URL = ASSET_URL
  ? `${ASSET_URL.replace(/\/$/, "")}/audio/mixkit-light-rain-looping-1249.wav`
  : "";
const NIGHT_URL = `${ASSET_URL.replace(/\/$/, "")}/audio/night-crickets.wav`;
const EXTERNAL_RAIN_FADE = 2.5;
const EXTERNAL_RAIN_STOP_FADE = 1.8;

type RainMode = "external" | "procedural";

// Procedural Web Audio loops remain the fallback for every channel, including rain.
export class AmbientEngine {
  context: AudioContext;
  master: GainNode;
  tracks = new Map<SoundId, GainNode>();
  sources: AudioBufferSourceNode[] = [];
  private rainGain: GainNode;
  private proceduralRainGain: GainNode | null = null;
  private externalRainGain: GainNode | null = null;
  private externalRain: HTMLAudioElement | null = null;
  private externalRainSource: MediaElementAudioSourceNode | null = null;
  private externalRainErrorHandler: (() => void) | null = null;
  private rainPauseTimer: ReturnType<typeof setTimeout> | null = null;
  private rainMode: RainMode = "procedural";
  private externalRainWarningShown = false;
  private startPromise: Promise<void> | null = null;
  private nightLoad = new AbortController();
  private nightFallbackGain: GainNode | null = null;
  private nightRecordingGain: GainNode | null = null;

  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
    this.rainGain = this.context.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.master);
    this.tracks.set("rain", this.rainGain);
  }

  async start() {
    await this.context.resume();
    if (this.sources.length) {
      if (this.rainMode === "external") await this.playExternalRain();
      return;
    }
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.initializeSources();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  private async initializeSources() {
    await this.tryExternalRain();
    this.createProceduralTracks();
    void this.loadNightRecording();
    if (this.rainMode === "procedural") {
      this.proceduralRainGain?.gain.setValueAtTime(1, this.context.currentTime);
    }
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
      gain.gain.value = id === "rain" ? 0 : 0;
      if (id === "night") {
        this.nightFallbackGain = c.createGain();
        source.connect(this.nightFallbackGain);
        this.nightFallbackGain.connect(gain);
      } else {
        source.connect(gain);
      }
      if (id === "rain") {
        this.proceduralRainGain = gain;
        gain.connect(this.rainGain);
      } else {
        gain.connect(this.master);
        this.tracks.set(id, gain);
      }
      source.start();
      this.sources.push(source);
    }
  }

  private async loadNightRecording() {
    const timeout = setTimeout(() => this.nightLoad.abort(), 15000);
    try {
      const response = await fetch(NIGHT_URL, {
        signal: this.nightLoad.signal,
      });
      if (!response.ok) throw new Error(`Night recording: ${response.status}`);
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      if (this.nightLoad.signal.aborted) return;
      const track = this.tracks.get("night");
      if (!track) return;

      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      this.nightRecordingGain = this.context.createGain();
      this.nightRecordingGain.gain.value = 0;
      source.connect(this.nightRecordingGain);
      this.nightRecordingGain.connect(track);
      source.start();
      this.sources.push(source);
      const now = this.context.currentTime;
      this.nightRecordingGain.gain.linearRampToValueAtTime(1, now + 2);
      this.nightFallbackGain?.gain.linearRampToValueAtTime(0, now + 2);
    } catch {
      if (!this.nightLoad.signal.aborted)
        this.logDevelopment("Night recording unavailable; keeping the quiet air fallback");
    } finally {
      clearTimeout(timeout);
    }
  }

  private async tryExternalRain() {
    if (!RAIN_URL) {
      this.useProceduralRain();
      return;
    }
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = RAIN_URL;
    this.externalRain = audio;
    try {
      this.externalRainGain = this.context.createGain();
      this.externalRainGain.gain.value = 0;
      this.externalRainGain.connect(this.rainGain);
      this.externalRainSource = this.context.createMediaElementSource(audio);
      this.externalRainSource.connect(this.externalRainGain);
    } catch {
      this.useProceduralRain();
      return;
    }

    let rejectLoad!: (reason?: unknown) => void;
    const failed = new Promise<never>((_, reject) => {
      rejectLoad = reject;
    });
    this.externalRainErrorHandler = () => {
      this.useProceduralRain();
      rejectLoad(new Error("Rain audio failed"));
    };
    audio.addEventListener("error", this.externalRainErrorHandler);
    audio.load();
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Rain audio timed out")), 8000);
    });
    try {
      await Promise.race([audio.play(), failed, timeout]);
      this.rainMode = "external";
      this.proceduralRainGain?.gain.setValueAtTime(0, this.context.currentTime);
      this.fadeExternalRainIn();
      this.logDevelopment("Using external rain audio");
    } catch {
      this.useProceduralRain();
    }
  }

  private async playExternalRain() {
    if (!this.externalRain) return;
    try {
      await this.externalRain.play();
      this.fadeExternalRainIn();
    } catch {
      this.useProceduralRain();
    }
  }

  private fadeExternalRainIn() {
    if (!this.externalRainGain) return;
    if (this.rainPauseTimer) clearTimeout(this.rainPauseTimer);
    const now = this.context.currentTime;
    this.externalRainGain.gain.cancelScheduledValues(now);
    this.externalRainGain.gain.setValueAtTime(0, now);
    this.externalRainGain.gain.linearRampToValueAtTime(
      1,
      now + EXTERNAL_RAIN_FADE,
    );
  }

  private useProceduralRain() {
    this.rainMode = "procedural";
    this.externalRain?.pause();
    const now = this.context.currentTime;
    if (this.externalRainGain) {
      this.externalRainGain.gain.cancelScheduledValues(now);
      this.externalRainGain.gain.setTargetAtTime(0, now, 0.3);
    }
    if (this.proceduralRainGain) {
      this.proceduralRainGain.gain.cancelScheduledValues(now);
      this.proceduralRainGain.gain.setTargetAtTime(1, now, 0.3);
    }
    this.logDevelopment("External rain unavailable, using procedural fallback");
  }

  private pauseExternalRain() {
    if (!this.externalRain || !this.externalRainGain) return;
    const now = this.context.currentTime;
    this.externalRainGain.gain.cancelScheduledValues(now);
    this.externalRainGain.gain.setTargetAtTime(0, now, 0.3);
    if (this.rainPauseTimer) clearTimeout(this.rainPauseTimer);
    this.rainPauseTimer = setTimeout(() => {
      this.externalRain?.pause();
      this.rainPauseTimer = null;
    }, EXTERNAL_RAIN_STOP_FADE * 1000);
  }

  stop() {
    if (this.rainMode === "external") this.pauseExternalRain();
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.45);
  }

  private logDevelopment(message: string) {
    if (process.env.NODE_ENV !== "development" || this.externalRainWarningShown && message.includes("unavailable")) return;
    if (message.includes("unavailable")) this.externalRainWarningShown = true;
    console.warn(`[Slowbit audio] ${message}`);
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
    if (!playing && this.rainMode === "external") this.pauseExternalRain();
  }

  async close() {
    this.nightLoad.abort();
    this.stop();
    if (this.rainPauseTimer) clearTimeout(this.rainPauseTimer);
    if (this.externalRain && this.externalRainErrorHandler)
      this.externalRain.removeEventListener("error", this.externalRainErrorHandler);
    this.externalRain?.pause();
    this.externalRain?.removeAttribute("src");
    this.externalRain?.load();
    this.externalRainSource?.disconnect();
    this.externalRainGain?.disconnect();
    this.rainGain.disconnect();
    this.nightFallbackGain?.disconnect();
    this.nightRecordingGain?.disconnect();
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // The source may already be stopped during teardown.
      }
      source.disconnect();
    }
    await this.context.close();
  }
}
