export const focusTrackFiles = [
  "HoliznaCC0 - Drifting Piano.mp3",
  "Ondrosik - Whispered.mp3",
  "Ondrosik - ondrik and Ivanka.mp3",
  "Ondrosik - A Bedtime Confession.mp3",
  "Ondrosik - For ivanka 2.mp3",
  "Ondrosik - Pilgrimage.mp3",
  "Ondrosik - sunday evening.mp3",
  "Ondrosik - Dotted Stories.mp3",
  "Ondrosik - breakthrough version 2025.mp3",
  "Ondrosik - Here Comes the Little Train.mp3",
  "Ondrosik - For Ivanka 1.mp3",
  "Ondrosik - Face in the Grass.mp3",
  "Ondrosik - Cristal snowflakes.mp3",
  "Ondrosik - nostalgic (version 2025).mp3",
  "Ondrosik - Violet music.mp3",
  "Ondrosik - Falling stars.mp3",
  "Ondrosik - Violet-Music-2025.mp3",
  "Ondrosik - Fragile Memories.mp3",
  "Ondrosik - nostalgic.mp3",
  "Ondrosik - sweet home.mp3",
  "Ondrosik - No words.mp3",
  "Ondrosik - labirint.mp3",
];
export const lofiTrackFiles = [
  "knoodles-chill-hop-trap-lofi-558426.mp3",
  "knoodles-chill-house-midnight-drive-551512.mp3",
  "knoodles-chill-trap-lofi-evening-565444.mp3",
  "serenomusic-abstract-chill-612078.mp3",
  "zephiramusic-lofi-background-580735.mp3",
];
export const nightDriveTrackFiles = [
  "city-lights.mp3",
  "dreamy-lofi.mp3",
  "golden-hour-drive.mp3",
  "late-night-drive.mp3",
  "moody-lofi-groove.mp3",
  "night-drive-deep-mood.mp3",
  "night-drive-melody.mp3",
  "night-drive-turning-pages.mp3",
  "sapce-loungue-chill-drift.mp3",
  "shadow-bloom.mp3",
];
export const readingRoomTrackFiles = [
  "amber-slowdance.mp3",
  "coffee-in-blue.mp3",
  "crimson-latte.mp3",
  "dreams-over-wood.mp3",
  "evening-sketches.mp3",
  "mellow-windows.mp3",
  "shadows-in-swing.mp3",
  "soft-strings-cafe.mp3",
  "twilight-reverb.mp3",
  "whispers-on-5th.mp3",
];
export const chromaticDriftTrackFiles = [
  "divineawakeningfrequency-3-warm-soft-ambient-pad-with-gentle-evolving-cinematic-okie-31-445842.mp3",
  "divineawakeningfrequency-ambient-pad-wide-stereo-airy-alpha-brainwave-friendly-450942.mp3",
  "divineawakeningfrequency-ambient-warm-cinematic-texturesoftly-like-glowing-up-1-444078.mp3",
  "divineawakeningfrequency-drone-warm-halo-texture-ambient-91-449668.mp3",
  "divineawakeningfrequency-gentle-bed-slow-soothing-like-soft-movie-revelation-frequency-5-442218.mp3",
  "divineawakeningfrequency-soft-airy-ambient-pad-warm-angelic-93-449672.mp3",
  "divineawakeningfrequency-ultra-clean-ambient-crystal-air-pad-made-only-of-smooth-high-frequency-440086.mp3",
  "divineawakeningfrequency-warm-pad-heart-mind-energy-ambient-450813.mp3",
  "hoggyart-777-hz-higher-angelic-frequencies-223415.mp3",
  "liecio-calming-and-relaxing-meditation-music-110208.mp3",
];
/** Exact R2 object names supplied by the owner. Do not normalize these keys. */
export const japaneseCafeTrackFiles = [
  "HoliznaCC0 - So Broke.mp3",
  "HoliznaCC0 - Something In the Air.mp3",
  "HoliznaCC0 - Still Life ( Lofi , Chill , Nostalgic ).mp3",
  "HoliznaCC0 - Theta Frequency ( Lofi , Chill , Calm ).mp3",
  "HoliznaCC0 - Vintage.mp3.mp3",
  "HoliznaCC0 - Waves.mp3.mp3",
  "HoliznaCC0 - Whatever.mp3",
  "HoliznaCC0 - When Time Called Me Darling ( Lofi, Relaxing, Chill).mp3",
  "HoliznaCC0 - Windows Down.mp3.mp3",
  "HoliznaCC0 - Yesterday.mp3",
  "HoliznaCC0 - You Loved Me Once.mp3",
  "HoliznaCC0 - A Little Shade.mp3",
  "HoliznaCC0 - All The Way Sad.mp3",
  "HoliznaCC0 - Autumn.mp3",
  "HoliznaCC0 - Birds ( LoFi , Chill ).mp3",
  "HoliznaCC0 - Blue Skies.mp3.mp3",
  "HoliznaCC0 - Cellar Door.mp3",
  "HoliznaCC0 - Clouds.mp3",
  "HoliznaCC0 - Come Again.mp3",
  "HoliznaCC0 - Everything You Ever Dreamed..mp3",
  "HoliznaCC0 - Fractured.mp3",
  "HoliznaCC0 - Ghosts.mp3",
  "HoliznaCC0 - Glad To Be Stuck Inside.mp3.mp3",
  "HoliznaCC0 - Keeping Cool.mp3",
  "HoliznaCC0 - Laundry On The Wire.mp3.mp3",
  "HoliznaCC0 - Letting Go Of The Past.mp3",
  "HoliznaCC0 - Morning Coffee.mp3",
  "HoliznaCC0 - Mundane.mp3",
  "HoliznaCC0 - Poor, But Happy.mp3",
  "HoliznaCC0 - Pretty Little Lies.mp3",
  "HoliznaCC0 - Puppy Love.mp3",
  "HoliznaCC0 - Ramen.mp3.mp3",
  "HoliznaCC0 - Shut up, or shut in.mp3",
  "HoliznaCC0 - Small Towns Smaller Lives.mp3",
];
export function focusTrackUrls(base: string) {
  return base ? focusTrackFiles.map(file => `${base.replace(/\/$/, "")}/audio/focus/sunlit-wall/${encodeURIComponent(file)}`) : [];
}
export function lofiTrackUrls(base: string) {
  return base ? lofiTrackFiles.map(file => `${base.replace(/\/$/, "")}/audio/lofi/${file}`) : [];
}
export function nightDriveTrackUrls(base: string) {
  return base ? nightDriveTrackFiles.map(file => `${base.replace(/\/$/, "")}/audio/lofi/night-drive/${file}`) : [];
}
export function readingRoomTrackUrls(base: string) {
  return base ? readingRoomTrackFiles.map(file => `${base.replace(/\/$/, "")}/audio/lofi/reading-room/${file}`) : [];
}
export function chromaticDriftTrackUrls(base: string) {
  return base ? chromaticDriftTrackFiles.map(file => `${base.replace(/\/$/, "")}/audio/chromatic-drift/${file}`) : [];
}
export function japaneseCafeTrackUrls(base: string) {
  return base ? japaneseCafeTrackFiles.map(file => `${base.replace(/\/+$/, "")}/audio/lofi/jap-cafe/${encodeURIComponent(file)}`) : [];
}
/** One shuffle bag across the three existing Lo-fi collections; no media is duplicated. */
export function trainCarriageTrackUrls(base: string) {
  return base
    ? [...lofiTrackUrls(base), ...nightDriveTrackUrls(base), ...japaneseCafeTrackUrls(base)]
    : [];
}
export function trackDisplayName(url: string) {
  const filename = decodeURIComponent(url.split("/").pop() ?? "")
    .replace(/(?:\.mp3)+$/i, "")
    .replace(/\.[^.]+$/, "")
    .replace(/^[^-]+\s+-\s+/, "");
  return filename.replace(/\b\d{5,}\b/g, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, letter => letter.toUpperCase());
}
export function shuffleBag(size: number, seed = Math.floor(Math.random() * 0x1_0000_0000)) {
  let bag: number[] = [], last = -1;
  return () => {
    if (!bag.length) {
      bag = Array.from({ length: size }, (_, i) => i);
      for (let i = size - 1; i > 0; i--) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const j = seed % (i + 1);[bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (size > 1 && bag[0] === last) [bag[0], bag[1]] = [bag[1], bag[0]];
    }
    last = bag.shift() ?? -1;
    return last;
  };
}
export function pianoFade(progress: number): [number, number] {
  const p = Math.max(0, Math.min(1, progress));
  return [Math.cos(p * Math.PI / 2), Math.sin(Math.max(0, (p - 0.25) / 0.75) * Math.PI / 2)];
}

type Slot = { media: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode; track: number; ready: boolean; starting: boolean; timeout?: ReturnType<typeof setTimeout> };
/** Two reusable media elements; only current and next tracks retain buffers. */
export class FocusPlaylist {
  private slots: Slot[];
  private current = 0;
  private running = false;
  private closed = false;
  private failed = new Set<number>();
  private next: () => number;
  private crossStart: number | null = null;
  private departure?: ReturnType<typeof setTimeout>;
  private output: GainNode;
  private context: AudioContext;
  private urls: string[];
  private onTrackChange?: (track: string | null) => void;
  private announcedTrack: string | null = null;
  constructor(context: AudioContext, master: GainNode, urls: string[], makeAudio = () => new Audio(), onTrackChange?: (track: string | null) => void) {
    this.context = context; this.urls = urls;
    this.onTrackChange = onTrackChange;
    this.next = shuffleBag(urls.length);
    this.output = context.createGain(); this.output.gain.value = 0; this.output.connect(master);
    this.slots = Array.from({ length: 2 }, () => {
      const media = makeAudio(); media.crossOrigin = "anonymous"; media.preload = "none"; media.loop = false;
      const source = context.createMediaElementSource(media), gain = context.createGain();
      gain.gain.value = 0; source.connect(gain); gain.connect(this.output);
      const slot: Slot = { media, source, gain, track: -1, ready: false, starting: false };
      media.oncanplay = () => { clearTimeout(slot.timeout); if (slot.track >= 0) slot.ready = true; this.tick(); };
      media.ontimeupdate = () => this.tick();
      media.onended = () => this.tick();
      media.onerror = () => this.fail(slot);
      return slot;
    });
  }
  private announceTrack(track: string | null) {
    if (track === this.announcedTrack) return;
    this.announcedTrack = track;
    this.onTrackChange?.(track);
  }
  private load(slot: Slot) {
    if (this.closed || !this.running || slot.track >= 0 || this.failed.size >= this.urls.length) return;
    let track = this.next();
    for (let i = 0; i < this.urls.length && this.failed.has(track); i++) track = this.next();
    if (track < 0 || this.failed.has(track)) return;
    slot.track = track; slot.ready = false;
    slot.media.preload = "auto"; slot.media.src = this.urls[track];
    slot.timeout = setTimeout(() => this.fail(slot), 30000);
    slot.media.load();
  }
  private clear(slot: Slot) {
    clearTimeout(slot.timeout); slot.media.pause(); slot.track = -1; slot.ready = false; slot.starting = false;
    slot.gain.gain.cancelScheduledValues(this.context.currentTime); slot.gain.gain.value = 0;
    slot.media.removeAttribute("src"); slot.media.load();
  }
  private fail(slot: Slot) {
    if (this.closed || slot.track < 0) return;
    this.failed.add(slot.track); this.clear(slot);
    if (slot === this.slots[this.current] && this.slots[1 - this.current].ready) this.current = 1 - this.current;
    this.crossStart = null;
    // At most one attempt per track per engine lifetime, including CORS/decode failures.
    if (this.running) this.tick();
  }
  private play(slot: Slot) {
    if (!this.running || !slot.ready || slot.starting || !slot.media.paused) return;
    slot.starting = true;
    const track = slot.track;
    void slot.media.play().then(() => {
      slot.starting = false;
      if (this.closed || !this.running || track !== slot.track) slot.media.pause();
    }).catch(() => { slot.starting = false; if (this.running && track === slot.track) this.fail(slot); });
  }
  private tick() {
    if (!this.running || this.closed) return;
    const a = this.slots[this.current], b = this.slots[1 - this.current];
    if (a.track < 0) this.load(a);
    if (!a.ready) return;
    this.announceTrack(this.urls[a.track] ?? null);
    if (!a.media.ended) this.play(a);
    const remaining = a.media.duration - a.media.currentTime;
    if (remaining <= 25 || a.media.ended) this.load(b);
    if ((remaining <= 6 || a.media.ended) && b.ready) {
      this.play(b);
      if (!b.media.paused && this.crossStart === null) this.crossStart = b.media.currentTime;
    }
    if (this.crossStart !== null) {
      // Media time stops on pause, preserving both playback position and fade progress.
      const progress = (b.media.currentTime - this.crossStart) / 6;
      const [outgoing, incoming] = pianoFade(progress);
      a.gain.gain.setTargetAtTime(outgoing, this.context.currentTime, 0.12);
      b.gain.gain.setTargetAtTime(incoming, this.context.currentTime, 0.12);
      if (progress >= 1) {
        this.clear(a); this.current = 1 - this.current; this.crossStart = null;
      }
    } else a.gain.gain.setTargetAtTime(1, this.context.currentTime, 0.5);
  }
  update(enabled: boolean, playing: boolean, volume: number, transition = 0.4) {
    if (this.closed) return;
    if (enabled) { clearTimeout(this.departure); this.departure = undefined; }
    this.output.gain.setTargetAtTime(enabled ? volume : 0, this.context.currentTime, enabled ? transition : 0.2);
    this.running = enabled && playing && volume > 0;
    if (!this.running) this.announceTrack(null);
    if (this.running) this.tick();
    else if (enabled) this.slots.forEach(s => s.media.pause());
    else if (!this.departure) this.departure = setTimeout(() => { this.departure = undefined; if (!this.running) { this.slots.forEach(s => this.clear(s)); this.crossStart = null; } }, 1200);
  }
  close() {
    this.closed = true; this.running = false; clearTimeout(this.departure);
    for (const s of this.slots) {
      s.media.oncanplay = s.media.ontimeupdate = s.media.onended = s.media.onerror = null;
      this.clear(s); s.source.disconnect(); s.gain.disconnect();
    }
    this.output.disconnect();
  }
}
