"use client";
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
} from "lucide-react";
import type { Visual } from "@/lib/types";
import { sceneMix } from "@/lib/sound-presets";
import { sounds } from "@/data/catalog";
import { usePreferences } from "@/hooks/usePreferences";
const icons = {
  rain: CloudRain,
  fire: Flame,
  wind: Wind,
  forest: Trees,
  brown: AudioLines,
  night: Moon,
  tones: Music2,
};
export default function AudioMixer({ visual }: { visual: Visual }) {
  const { preferences: p, setVolume, update } = usePreferences();
  return (
    <div className="mixer">
      <div className="mixer-heading">
        <div>
          <span className="eyebrow">YOUR SOUNDSCAPE</span>
          <h2>A mix of your own.</h2>
        </div>
        <button
          className="icon-button"
          onClick={() => update({ muted: !p.muted })}
          aria-label={p.muted ? "Unmute" : "Mute"}
        >
          {p.muted ? <VolumeX /> : <Volume2 />}
        </button>
      </div>
      <div className="mixer-preset">
        <span>{visual.name} mix</span>
        <button onClick={() => update({ audioVolumes: sceneMix(visual) })}>
          Reset preset
        </button>
      </div>
      {sounds.map((s) => {
        const Icon = icons[s.id];
        return (
          <div className="sound-track" key={s.id}>
            <Icon size={19} />
            <label htmlFor={`volume-${s.id}`}>{s.name}</label>
            <output>{Math.round(p.audioVolumes[s.id] * 100)}%</output>
            <input
              id={`volume-${s.id}`}
              type="range"
              min="0"
              max="1"
              step=".01"
              value={p.audioVolumes[s.id]}
              onChange={(e) => setVolume(s.id, Number(e.target.value))}
              aria-label={`${s.name} volume`}
            />
          </div>
        );
      })}
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
          onChange={(e) => update({ globalVolume: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
