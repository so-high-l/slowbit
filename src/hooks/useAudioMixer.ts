"use client";
import { useEffect } from "react";
import { useAudioSession } from "@/components/audio/AudioProvider";
import { visuals } from "@/data/catalog";
import { getSceneSoundMix, getSceneBeatHz } from "@/lib/preferences";
import { silentMix } from "@/lib/sound-presets";
import type { Preferences, SoundMix, VisualId, SessionMode } from "@/lib/types";
export function useAudioMixer(
  prefs: Preferences,
  playing: boolean,
  masterScale = 1,
  scene: VisualId = prefs.lastVisual ?? "rain",
  mixOverride?: SoundMix,
  exploring = false,
  mode: SessionMode = prefs.mode ?? "unwind",
) {
  const audio = useAudioSession();
  const { engine, active } = audio;
  const visual = visuals.find((item) => item.id === scene);
  useEffect(() => {
    const volumes = scene === "focusComingSoon"
      ? silentMix
      : mixOverride ?? (visual ? getSceneSoundMix(prefs, visual) : silentMix);
    engine.current?.mix(
      scene === "meadow" && exploring
        ? { ...volumes, forest: volumes.forest * 0.3, wind: volumes.wind * 0.65 }
        : scene === "magneticField" && exploring ? { ...volumes, tones: volumes.tones * 0.6, texture: volumes.texture * 0.6 } : volumes,
      prefs.globalVolume * masterScale,
      playing,
      prefs.muted,
      scene,
      scene === "morningLattice" ? 2 : scene === "orbitStudy" ? 0.45 : scene === "meadow" || scene === "magneticField" ? 1.5 : 0.3,
      mode,
      scene === "morningLattice" && exploring,
      scene === "orbitStudy" && exploring,
      getSceneBeatHz(prefs, scene),
      scene === "vinyl" && exploring,
    );
  }, [
    engine,
    getSceneSoundMix,
    mixOverride?.rain,
    mixOverride?.fire,
    mixOverride?.wind,
    mixOverride?.forest,
    mixOverride?.brown,
    mixOverride?.night,
    mixOverride?.tones,
    mixOverride?.train,
    mixOverride?.piano,
    mixOverride?.vinylMusic,
    mixOverride?.orbitalPad,
    mixOverride?.ambience,
    mixOverride?.texture,
    mixOverride?.textureTone,
    mixOverride?.pondDrops,
    mixOverride?.binaural,
    exploring,
    mode,
    prefs.soundMixesByScene,
    prefs.beatHzByScene,
    prefs.globalVolume,
    playing,
    masterScale,
    prefs.muted,
    active,
    scene,
  ]);
  useEffect(() => () => {
    // Keep the unlocked audio context between check-in and session routes.
    engine.current?.stop();
  }, [engine]);
  return audio;
}
