"use client";
import { useRef } from "react";
import {
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Wind,
  Trees,
  AudioLines,
  Moon,
  Music2,
  TrainFront,
  Droplets,
  Bird,
} from "lucide-react";
import type { SoundId, Visual } from "@/lib/types";
import { sounds } from "@/data/catalog";
import { usePreferences } from "@/hooks/usePreferences";
import { sceneSoundscapes } from "@/lib/scene-soundscapes";
import { getSceneBeatHz } from "@/lib/preferences";
import { duplicateSound, hasAirTones, soundLabel } from "@/lib/sound-controls";
import { analytics } from "@/lib/analytics";
const icons = {
  pondDrops: Droplets,
  textureTone: Music2,
  ambience: Wind,
  texture: Music2,
  binaural: AudioLines,
  rain: CloudRain,
  fire: Flame,
  wind: Wind,
  forest: Trees,
  seaBirds: Bird,
  brown: AudioLines,
  night: Moon,
  tones: Music2,
  piano: Music2,
  lofi: Music2,
  vinylMusic: Music2,
  orbitalPad: AudioLines,
  train: TrainFront,
};
export default function AudioMixer({ visual, sessionId }: { visual: Visual; sessionId?: string }) {
  const { preferences: p, getSceneSoundMix, setVolume, setBeatHz, resetSceneSoundMix, update } = usePreferences();
  const mix = getSceneSoundMix(visual);
  const soundscape = sceneSoundscapes[visual.id];
  const committed = useRef<Record<string, number>>({});
  const current = useRef<Record<string, number>>({});
  if (committed.current.master === undefined) committed.current.master = p.globalVolume;
  current.current.master = p.globalVolume;
  const commit = (id: SoundId, name: string, value: number) => {
    const previous = committed.current[id] ?? value;
    if (previous === value) return;
    committed.current[id] = value;
    analytics.soundChanged(visual, p.mode ?? "unwind", id, name, previous, value, sessionId);
    if ((id === "lofi" || id === "piano") && (p.mode ?? "unwind") === "focus")
      analytics.focusAudioVolumeChanged(soundscape?.playlist ?? id, value);
  };
  const beatHz = getSceneBeatHz(p, visual.id);
  const available = sounds.filter((s) =>
    s.id !== "binaural" &&
    (s.id !== "night" || visual.id !== "jelly") &&
    (s.id !== "seaBirds" || visual.id === "loceanRooftop") &&
    (s.id !== "vinylMusic" || visual.id === "vinyl") &&
    s.id !== duplicateSound(visual.id)?.removed &&
    (s.id !== "pondDrops" || visual.id === "pond") &&
    (s.id !== "textureTone" || hasAirTones(visual.id)) &&
    (s.id !== "ambience" || soundscape?.ambience) &&
    (s.id !== "texture" || soundscape?.texture) &&
    (s.id !== "train" || visual.id === "lantern" || visual.id === "trainCarriage") &&
    (s.id !== "piano" || (p.mode === "focus" && visual.id === "morningLattice")) &&
    (s.id !== "lofi" || Boolean(soundscape?.playlist)) &&
    (s.id !== "orbitalPad" || ((p.mode ?? "unwind") === "unwind" && visual.id === "orbitStudy")),
  );
  const renderTrack = (s: typeof sounds[number]) => {
    const name = soundLabel(visual.id, s.id, s.name);
    const Icon = /water|lapping|bubbles/i.test(name) ? Droplets
      : name === "Forest ambience" || name === "Birdsong" ? Trees : icons[s.id];
    if (committed.current[s.id] === undefined) committed.current[s.id] = mix[s.id];
    current.current[s.id] = mix[s.id];
    return (
      <div className="sound-track" key={s.id}>
        <Icon size={19} aria-hidden="true" />
        <label htmlFor={`volume-${s.id}`} title={s.id === "vinylMusic" ? "Plays while the record is on · Z" : undefined}>{name}{s.id === "vinylMusic" ? " · Z" : ""}</label>
        <output htmlFor={`volume-${s.id}`}>{Math.round(mix[s.id] * 100)}%</output>
        <input id={`volume-${s.id}`} type="range" min="0" max="1" step=".01"
          value={mix[s.id]} onChange={(e) => { current.current[s.id] = Number(e.target.value); setVolume(visual.id, s.id, current.current[s.id]); }}
          onPointerUp={() => commit(s.id, name, current.current[s.id])}
          onKeyUp={() => commit(s.id, name, current.current[s.id])}
          onBlur={() => commit(s.id, name, current.current[s.id])}
          aria-label={`${name} volume`} />
      </div>
    );
  };
  return (
    <div className="mixer">
      <div className="mixer-heading">
        <div>
          <span className="eyebrow">YOUR SOUNDSCAPE</span>
          <h2>A mix of your own.</h2>
        </div>
        <button
          className="icon-button"
          onClick={() => { analytics.muteChanged(p.mode ?? "unwind", !p.muted, sessionId); update({ muted: !p.muted }); }}
          aria-label={p.muted ? "Unmute" : "Mute"}
        >
          {p.muted ? <VolumeX /> : <Volume2 />}
        </button>
      </div>
      <div className="mixer-preset">
        <span>{visual.name} mix</span>
        <button data-tooltip="Restore this scene’s default volumes and beat frequency" onClick={() => resetSceneSoundMix(visual.id)}>
          Reset
        </button>
      </div>
      {available.filter(s => (visual.defaultSounds[s.id] ?? 0) > 0).map(renderTrack)}
      {soundscape && (
        <div className="binaural-controls">
          <div className="binaural-heading">
            <span className="binaural-title">
              <span>Binaural beat · {beatHz} Hz</span>
              <span className="binaural-new">New</span>
            </span>
            <button type="button" aria-pressed={mix.binaural > 0}
              aria-label="Binaural beat"
              data-tooltip={mix.binaural > 0 ? "Turn off the binaural beat" : "Enable the binaural beat — use stereo headphones"}
              onClick={() => { const value = mix.binaural > 0 ? 0 : 0.07; analytics.soundChanged(visual, p.mode ?? "unwind", "binaural", "Binaural beat", mix.binaural, value, sessionId); committed.current.binaural = value; setVolume(visual.id, "binaural", value); }}>
              {mix.binaural > 0 ? "On" : "Off"}
            </button>
          </div>
          <p id="binaural-note">For fun. Listen with stereo headphones.</p>
          {renderTrack(sounds.find(s => s.id === "binaural")!)}
          <div className="sound-track">
            <AudioLines size={19} aria-hidden="true" />
            <label htmlFor="beat-frequency">Beat frequency</label>
            <output htmlFor="beat-frequency">{beatHz} Hz</output>
            <input id="beat-frequency" type="range" min="1" max="30" step=".5"
              value={beatHz} aria-describedby="binaural-note" aria-valuetext={`${beatHz} hertz`}
              onChange={(e) => setBeatHz(visual.id, Number(e.target.value))} />
          </div>
        </div>
      )}
      <details className="mixer-more-sounds">
        <summary data-tooltip="Add other sounds to your mix">More sounds</summary>
        {available.filter(s => !(visual.defaultSounds[s.id] ?? 0)).map(renderTrack)}
      </details>
      <div className="master-track">
        <label htmlFor="master-volume">
          Master volume <span>{Math.round(p.globalVolume * 100)}%</span>
        </label>
        <input
          id="master-volume"
          type="range"
          min="0"
          max="1"
          step=".01"
          value={p.globalVolume}
          onChange={(e) => { current.current.master = Number(e.target.value); update({ globalVolume: current.current.master }); }}
          onPointerUp={() => { const value = current.current.master ?? p.globalVolume; if (committed.current.master !== value) { analytics.masterVolumeChanged(p.mode ?? "unwind", value, sessionId); committed.current.master = value; } }}
          onKeyUp={() => { const value = current.current.master ?? p.globalVolume; if (committed.current.master !== value) { analytics.masterVolumeChanged(p.mode ?? "unwind", value, sessionId); committed.current.master = value; } }}
          onBlur={() => { const value = current.current.master ?? p.globalVolume; if (committed.current.master !== value) { analytics.masterVolumeChanged(p.mode ?? "unwind", value, sessionId); committed.current.master = value; } }}
        />
      </div>
    </div>
  );
}
