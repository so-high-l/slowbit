import { chromaticDriftTrackUrls, FocusPlaylist, focusTrackUrls, lofiTrackUrls, nightDriveTrackUrls, readingRoomTrackUrls } from "./focus-music.ts";
import type { SoundId, VisualId, SessionMode } from "./types";
import { recordingProfile, type RecordedChannel, type RecordingProfile } from "./audio-profiles.ts";
import { sceneSoundscapes } from "./scene-soundscapes.ts";
import { SceneSynthesis } from "./scene-synthesis.ts";

import { duplicateSound, hasAirTones } from "./sound-controls.ts";

const ASSET_URL = (process.env.NEXT_PUBLIC_ASSET_URL ?? "").replace(/\/$/, "");
type Voice = { key: string; source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode; highpass: BiquadFilterNode };
type RecordingRequest = { key: string; scene: VisualId; retries: number; retry?: ReturnType<typeof setTimeout> };
export type NowPlaying = { playlist: string; track: string } | null;

export function owlDelayMs(initial: boolean, random = Math.random()) {
  const [minimum, maximum] = initial ? [20_000, 55_000] : [75_000, 180_000];
  const amount = Math.max(0, Math.min(1, random));
  return Math.round(minimum + (maximum - minimum) * amount);
}

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
  private piano?: FocusPlaylist;
  private lofi?: FocusPlaylist;
  private nightDriveLofi?: FocusPlaylist;
  private readingRoomJazz?: FocusPlaylist;
  private chromaticDriftAmbient?: FocusPlaylist;
  private synthesis?: SceneSynthesis;
  private curtain = false;
  private pondEnabled = false;
  private pondBuffer?: AudioBuffer;
  private pondLoading = false;
  private drops = new Set<{ source: AudioBufferSourceNode; gain: GainNode }>();
  private owlEnabled = false;
  private owlBuffer?: AudioBuffer;
  private owlLoading = false;
  private owlTimer?: ReturnType<typeof setTimeout>;
  private owlVoice?: { source: AudioBufferSourceNode; gain: GainNode };
  private onNowPlayingChange?: (nowPlaying: NowPlaying) => void;
  private activeNowPlaying: NowPlaying = null;

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
    gain.connect(this.tracks.get("pondDrops")!);
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

  private stopOwl() {
    clearTimeout(this.owlTimer);
    this.owlTimer = undefined;
    if (!this.owlVoice) return;
    const { source, gain } = this.owlVoice;
    this.owlVoice = undefined;
    source.onended = null;
    source.stop();
    source.disconnect();
    gain.disconnect();
  }

  private scheduleOwl(initial: boolean) {
    if (this.closed || !this.owlEnabled || !this.owlBuffer || this.owlTimer || this.owlVoice) return;
    this.owlTimer = setTimeout(() => {
      this.owlTimer = undefined;
      this.playOwl();
    }, owlDelayMs(initial));
  }

  private playOwl() {
    const night = this.tracks.get("night");
    if (this.closed || !this.owlEnabled || !this.owlBuffer || !night || this.owlVoice) return;
    const source = this.context.createBufferSource();
    source.buffer = this.owlBuffer;
    source.loop = false;
    const gain = this.context.createGain();
    gain.gain.value = 0.32;
    source.connect(gain);
    gain.connect(night);
    this.owlVoice = { source, gain };
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (this.owlVoice?.source === source) this.owlVoice = undefined;
      this.scheduleOwl(false);
    };
    source.start();
  }

  private async prepareOwl() {
    if (this.owlBuffer) {
      this.scheduleOwl(true);
      return;
    }
    if (this.owlLoading) return;
    this.owlLoading = true;
    try {
      this.owlBuffer = await this.buffer("public_sounds_animals_owl.mp3", false);
      this.scheduleOwl(true);
    } catch { /* Crickets continue alone when the optional owl recording is unavailable. */ }
    finally { this.owlLoading = false; }
  }

  private updateOwl(enabled: boolean) {
    this.owlEnabled = enabled;
    if (!enabled) {
      this.stopOwl();
      return;
    }
    if (!this.owlTimer && !this.owlVoice) void this.prepareOwl();
  }

  constructor(onNowPlayingChange?: (nowPlaying: NowPlaying) => void) {
    this.onNowPlayingChange = onNowPlayingChange;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
  }

  private publishNowPlaying(playlist: string, track: string | null) {
    const next = track ? { playlist, track } : null;
    if (next?.track === this.activeNowPlaying?.track && next?.playlist === this.activeNowPlaying?.playlist) return;
    this.activeNowPlaying = next;
    this.onNowPlayingChange?.(next);
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
      "train",
      "orbitalPad",
      "vinylMusic",
      "ambience",
      "texture",
      "textureTone",
      "pondDrops",
      "binaural",
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
    this.synthesis = new SceneSynthesis(this.context, this.tracks.get("texture")!, this.tracks.get("binaural")!, this.tracks.get("textureTone")!);
  }


  private async buffer(file: string, looping = true, local = false, loopCrossfade = 2) {
    const url = `${local ? "" : ASSET_URL}/audio/${file}`;
    const cacheKey = JSON.stringify([url, looping, loopCrossfade]);
    let pending = this.buffers.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        const controller = new AbortController();
        this.loads.add(controller);
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
          const bytes = await response.arrayBuffer();
          if (this.closed) throw new Error("Audio engine closed");
          const buffer = await this.context.decodeAudioData(bytes);
          if (this.closed) throw new Error("Audio engine closed");
          if (!looping || loopCrossfade <= 0) return buffer;
          // Blend the tail into the opening once, so even non-loop wind has no hard seam.
          const overlap = Math.min(Math.floor(buffer.sampleRate * loopCrossfade), Math.floor(buffer.length / 4));
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
      this.buffers.set(cacheKey, pending);
      void pending.catch(() => this.buffers.delete(cacheKey));
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
      const buffer = await this.buffer(profile.file, true, profile.local, profile.loopCrossfade);
      if (this.closed || this.requests.get(id) !== request) return;
      const track = this.tracks.get(id);
      if (!track) return;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = id === "rain" && this.curtain ? Math.min(profile.cutoff, 950) : profile.cutoff;
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
    this.piano?.update(false, false, 0);
    this.lofi?.update(false, false, 0);
    this.nightDriveLofi?.update(false, false, 0);
    this.readingRoomJazz?.update(false, false, 0);
    this.chromaticDriftAmbient?.update(false, false, 0);
    this.synthesis?.stop();
    this.pondEnabled = false;
    this.stopDrops();
    this.owlEnabled = false;
    this.stopOwl();
    for (const id of this.requests.keys()) this.cancelRequest(id);
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.45);
  }

  mix(volumes: Record<SoundId, number>, global: number, playing: boolean, muted: boolean, scene: VisualId = "rain", transition = 0.3, mode: SessionMode = "unwind", curtain = false, orbitImmersive = false, beatHz?: number, vinylImmersive = false) {
    if (this.closed) return;
    const soundscape = sceneSoundscapes[scene];
    const audible = playing && !muted && global > 0;
    this.curtain = curtain && mode === "focus" && scene === "morningLattice";
    const pianoEnabled = mode === "focus" && scene === "morningLattice";
    if (pianoEnabled && playing && !muted && global > 0 && volumes.piano > 0 && !this.piano && this.context.state === "running") {
      const urls = focusTrackUrls(ASSET_URL);
      if (urls.length) {
        try { this.piano = new FocusPlaylist(this.context, this.master, urls, undefined, track => this.publishNowPlaying("Piano", track)); } catch { /* Ambient playback remains available if media nodes are unsupported. */ }
      }
    }
    this.piano?.update(pianoEnabled, playing && !muted && global > 0, (volumes.piano ?? 0) * (this.curtain ? 0.5 : 1), transition);
    const lofiEnabled = mode === "focus" && soundscape?.playlist === "lofi";
    if (lofiEnabled && audible && volumes.lofi > 0 && !this.lofi && this.context.state === "running") {
      const urls = lofiTrackUrls(ASSET_URL);
      if (urls.length) {
        try { this.lofi = new FocusPlaylist(this.context, this.master, urls, undefined, track => this.publishNowPlaying("Lo-fi", track)); } catch { /* Other layers remain available if media nodes are unsupported. */ }
      }
    }
    this.lofi?.update(lofiEnabled, audible, volumes.lofi ?? 0, transition);
    const nightDriveLofiEnabled = mode === "focus" && soundscape?.playlist === "nightDriveLofi";
    if (nightDriveLofiEnabled && audible && volumes.lofi > 0 && !this.nightDriveLofi && this.context.state === "running") {
      const urls = nightDriveTrackUrls(ASSET_URL);
      if (urls.length) {
        try { this.nightDriveLofi = new FocusPlaylist(this.context, this.master, urls, undefined, track => this.publishNowPlaying("Night Drive Radio", track)); } catch { /* Other layers remain available if media nodes are unsupported. */ }
      }
    }
    this.nightDriveLofi?.update(nightDriveLofiEnabled, audible, volumes.lofi ?? 0, transition);
    const readingRoomJazzEnabled = mode === "focus" && soundscape?.playlist === "readingRoomJazz";
    if (readingRoomJazzEnabled && audible && volumes.lofi > 0 && !this.readingRoomJazz && this.context.state === "running") {
      const urls = readingRoomTrackUrls(ASSET_URL);
      if (urls.length) {
        try { this.readingRoomJazz = new FocusPlaylist(this.context, this.master, urls, undefined, track => this.publishNowPlaying("Reading Room Jazz", track)); } catch { /* Rain and night ambience remain available if media nodes are unsupported. */ }
      }
    }
    this.readingRoomJazz?.update(readingRoomJazzEnabled, audible, volumes.lofi ?? 0, transition);
    const chromaticDriftAmbientEnabled = soundscape?.playlist === "chromaticDriftAmbient";
    if (chromaticDriftAmbientEnabled && audible && volumes.lofi > 0 && !this.chromaticDriftAmbient && this.context.state === "running") {
      const urls = chromaticDriftTrackUrls(ASSET_URL);
      if (urls.length) {
        try { this.chromaticDriftAmbient = new FocusPlaylist(this.context, this.master, urls, undefined, track => this.publishNowPlaying("Chromatic Drift", track)); } catch { /* Procedural support remains available if media nodes are unsupported. */ }
      }
    }
    this.chromaticDriftAmbient?.update(chromaticDriftAmbientEnabled, audible, volumes.lofi ?? 0, transition);
    this.pondEnabled = scene === "pond" && audible && volumes.pondDrops > 0;
    if (!this.pondEnabled) this.stopDrops();
    else void this.preparePondDrop();
    this.updateOwl(audible && scene !== "jelly" && (volumes.night ?? 0) > 0);
    const now = this.context.currentTime;
    for (const [id, gain] of this.tracks) {
      const channelVolume = id === "vinylMusic" && (scene !== "vinyl" || !vinylImmersive) ? 0
        : id === "night" && scene === "jelly" ? 0
        : id === duplicateSound(scene)?.removed || (id === "pondDrops" && scene !== "pond") || (id === "textureTone" && !hasAirTones(scene)) ? 0
        : id === "orbitalPad"
        ? scene !== "orbitStudy" || mode !== "unwind" ? 0 : Math.min(1, (volumes[id] ?? 0) * (orbitImmersive ? 1.1 : 1))
        : (id === "ambience" && !soundscape?.ambience) || (id === "texture" && !soundscape?.texture) || (id === "binaural" && !soundscape) ? 0
        : (volumes[id] ?? 0);
      gain.gain.setTargetAtTime(channelVolume * (id === "rain" && this.curtain ? 0.55 : 1), now, id === "vinylMusic" ? 1 : transition);
      if (id === "tones" || id === "piano" || id === "lofi" || id === "texture" || id === "binaural" || id === "textureTone" || id === "pondDrops") continue;
      if (id === "ambience" && !soundscape?.ambience) {
        this.cancelRequest(id);
        this.fadeVoice(id);
        continue;
      }
      const voice = this.voices.get(id);
      if (voice) {
        const profile = recordingProfile(scene, id);
        voice.filter.frequency.setTargetAtTime(id === "rain" && this.curtain ? Math.min(profile.cutoff, 950) : profile.cutoff, now, transition);
      }
      if (playing && !muted && global > 0 && channelVolume > 0)
        this.selectRecording(id, scene);
      else this.cancelRequest(id);
    }
    this.synthesis?.update(soundscape, beatHz ?? soundscape?.beatHz ?? 6, audible && volumes.texture > 0, audible && volumes.binaural > 0, audible && volumes.textureTone > 0);
    this.master.gain.setTargetAtTime(playing && !muted ? global : 0, now, 0.45);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.piano?.close();
    this.lofi?.close();
    this.nightDriveLofi?.close();
    this.readingRoomJazz?.close();
    this.chromaticDriftAmbient?.close();
    this.synthesis?.close();
    this.pondEnabled = false;
    this.stopDrops();
    this.owlEnabled = false;
    this.stopOwl();
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
