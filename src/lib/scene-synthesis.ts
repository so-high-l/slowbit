import { createAnalogTape } from "./analog-tape.ts";
import { binauralFrequencies, type SceneSoundscape, type TextureKind } from "./scene-soundscapes.ts";

type Voice = {
  nodes: AudioNode[];
  sources: AudioScheduledSourceNode[];
  gain: GainNode;
  fading: boolean;
};

// Original, gently modulated textures. These are independent of the legacy
// Soft tones channel and need no files on R2.
const textures: Record<TextureKind, { partials: [number, number][]; period: number; noise?: number; pan?: boolean }> = {
  tape: { partials: [], noise: 0.18, period: 24 },
  halo: { partials: [[174.6, 0.085], [261.6, 0.04], [523.2, 0.012]], period: 29 },
  float: { partials: [[130.8, 0.09], [196, 0.045], [293.7, 0.02]], period: 37 },
  air: { partials: [[349.2, 0.025], [523.3, 0.01]], noise: 0.22, period: 43 },
  round: { partials: [[196, 0.095], [392, 0.018]], period: 23 },
  bow: { partials: [[146.8, 0.085], [293.6, 0.032], [440.4, 0.014], [587.2, 0.006]], period: 41 },
  ribbon: { partials: [[116.5, 0.025]], noise: 0.27, period: 53, pan: true },
  glass: { partials: [[293.7, 0.07], [587.3, 0.025], [830.6, 0.012]], period: 31 },
};

export class SceneSynthesis {
  private live = new Set<Voice>();
  private texture?: { kind: TextureKind; voice: Voice };
  private airTone?: { kind: TextureKind; voice: Voice };
  private beat?: { voice: Voice; oscillators: OscillatorNode[] };
  private closed = false;

  private context: AudioContext;
  private textureTrack: GainNode;
  private beatTrack: GainNode;
  private toneTrack: GainNode;
  constructor(context: AudioContext, textureTrack: GainNode, beatTrack: GainNode, toneTrack: GainNode) {
    this.context = context;
    this.textureTrack = textureTrack;
    this.beatTrack = beatTrack;
    this.toneTrack = toneTrack;
  }

  private voice(destination: AudioNode): Voice {
    const gain = this.context.createGain();
    gain.gain.value = 0;
    gain.connect(destination);
    const voice = { gain, nodes: [gain], sources: [], fading: false };
    this.live.add(voice);
    return voice;
  }

  private start(voice: Voice, level: number) {
    const now = this.context.currentTime;
    voice.sources[0].onended = () => this.dispose(voice);
    for (const source of voice.sources) source.start(now);
    voice.gain.gain.setTargetAtTime(level, now, 0.8);
  }

  private dispose(voice: Voice) {
    for (const node of voice.nodes) node.disconnect();
    this.live.delete(voice);
  }

  private fade(voice: Voice) {
    if (voice.fading) return;
    voice.fading = true;
    const now = this.context.currentTime;
    voice.gain.gain.cancelAndHoldAtTime(now);
    voice.gain.gain.linearRampToValueAtTime(0, now + 2);
    for (const source of voice.sources) source.stop(now + 2.05);
  }

  private oscillator(voice: Voice, frequency: number) {
    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    voice.sources.push(oscillator);
    voice.nodes.push(oscillator);
    return oscillator;
  }

  private makeTexture(kind: TextureKind, tonalOnly = false): Voice {
    const voice = this.voice(tonalOnly ? this.toneTrack : this.textureTrack);
    const spec = textures[kind];
    let output: AudioNode = voice.gain;
    if (spec.pan) {
      const pan = this.context.createStereoPanner();
      const depth = this.context.createGain();
      depth.gain.value = 0.22;
      this.oscillator(voice, 1 / spec.period).connect(depth);
      depth.connect(pan.pan);
      pan.connect(output);
      voice.nodes.push(pan, depth);
      output = pan;
    }
    (spec.noise && !tonalOnly ? [] : spec.partials).forEach(([frequency, amplitude], index) => {
      const gain = this.context.createGain();
      gain.gain.value = amplitude * 0.78;
      const modulation = this.context.createGain();
      modulation.gain.value = amplitude * 0.22;
      this.oscillator(voice, 1 / (spec.period + index * 7)).connect(modulation);
      modulation.connect(gain.gain);
      this.oscillator(voice, frequency).connect(gain);
      gain.connect(output);
      voice.nodes.push(gain, modulation);
    });
    if (spec.noise && !tonalOnly) {
      const buffer = this.context.createBuffer(1, this.context.sampleRate * (kind === "tape" ? 24 : 16), this.context.sampleRate);
      const data = buffer.getChannelData(0);
      if (kind === "tape") data.set(createAnalogTape(this.context.sampleRate));
      let seed = kind === "air" ? 1907 : 7919;
      for (let i = 0; kind !== "tape" && i < data.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        // Short edge fade avoids a discontinuity when the noise buffer loops.
        const edge = Math.min(1, i / 128, (data.length - 1 - i) / 128);
        data[i] = (seed / 2147483648 - 1) * edge;
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = kind === "air" ? 1500 : kind === "tape" ? 1100 : 700;
      filter.Q.value = 0.35;
      const gain = this.context.createGain();
      gain.gain.value = spec.noise;
      source.connect(filter); filter.connect(gain); gain.connect(output);
      voice.sources.push(source);
      voice.nodes.push(source, filter, gain);
    }
    this.start(voice, 1);
    return voice;
  }

  update(profile: SceneSoundscape | undefined, beatHz: number, textureEnabled: boolean, beatEnabled: boolean, toneEnabled: boolean) {
    if (this.closed) return;
    const kind = textureEnabled ? profile?.texture?.kind : undefined;
    if (this.texture && this.texture.kind !== kind) {
      this.fade(this.texture.voice);
      this.texture = undefined;
    }
    if (kind && !this.texture) this.texture = { kind, voice: this.makeTexture(kind) };
    const toneKind = toneEnabled && (profile?.texture?.kind === "air" || profile?.texture?.kind === "ribbon") ? profile.texture.kind : undefined;
    if (this.airTone && this.airTone.kind !== toneKind) {
      this.fade(this.airTone.voice);
      this.airTone = undefined;
    }
    if (toneKind && !this.airTone) this.airTone = { kind: toneKind, voice: this.makeTexture(toneKind, true) };
    if (!profile || !beatEnabled) {
      if (this.beat) this.fade(this.beat.voice);
      this.beat = undefined;
      return;
    }
    const frequencies = binauralFrequencies(profile.carrierHz, beatHz);
    if (!this.beat) {
      const voice = this.voice(this.beatTrack);
      const merger = this.context.createChannelMerger(2);
      merger.connect(voice.gain);
      voice.nodes.push(merger);
      const oscillators = frequencies.map((frequency, ear) => {
        const oscillator = this.oscillator(voice, frequency);
        // Each ear receives exactly one carrier; never sum them to mono here.
        oscillator.connect(merger, 0, ear);
        return oscillator;
      });
      this.beat = { voice, oscillators };
      this.start(voice, 0.12);
    } else {
      this.beat.oscillators.forEach((oscillator, ear) => {
        oscillator.frequency.setTargetAtTime(frequencies[ear], this.context.currentTime, 0.6);
      });
    }
  }

  stop() {
    if (this.texture) this.fade(this.texture.voice);
    if (this.beat) this.fade(this.beat.voice);
    if (this.airTone) this.fade(this.airTone.voice);
    this.texture = undefined;
    this.airTone = undefined;
    this.beat = undefined;
  }

  close() {
    this.closed = true;
    for (const voice of this.live) {
      for (const source of voice.sources) { source.onended = null; source.stop(); }
      this.dispose(voice);
    }
    this.texture = undefined;
    this.airTone = undefined;
    this.beat = undefined;
  }
}
