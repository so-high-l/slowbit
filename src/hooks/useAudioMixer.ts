"use client";
import { useEffect } from "react";
import { useAudioSession } from "@/components/audio/AudioProvider";
import { visuals } from "@/data/catalog";
import { getSceneSoundMix } from "@/lib/preferences";
import { silentMix } from "@/lib/sound-presets";
import type { Preferences, SoundMix, VisualId } from "@/lib/types";
export function useAudioMixer(
  prefs: Preferences,
  playing: boolean,
  masterScale = 1,
  scene: VisualId = prefs.lastVisual ?? "rain",
  mixOverride?: SoundMix,
) {
  const audio = useAudioSession();
  const { engine, active } = audio;
  const visual = visuals.find((item) => item.id === scene);
  useEffect(() => {
    const volumes = mixOverride ?? (visual ? getSceneSoundMix(prefs, visual) : silentMix);
    engine.current?.mix(
      volumes,
      prefs.globalVolume * masterScale,
      playing,
      prefs.muted,
      scene,
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
    prefs.soundMixesByScene,
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
