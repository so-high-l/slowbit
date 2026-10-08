"use client";
import { useEffect } from "react";
import { useAudioSession } from "@/components/audio/AudioProvider";
import type { Preferences } from "@/lib/types";
export function useAudioMixer(
  prefs: Preferences,
  playing: boolean,
  masterScale = 1,
) {
  const audio = useAudioSession();
  const { engine, active } = audio;
  useEffect(() => {
    engine.current?.mix(
      prefs.audioVolumes,
      prefs.globalVolume * masterScale,
      playing,
      prefs.muted,
    );
  }, [engine, prefs, playing, masterScale, active]);
  useEffect(() => () => {
    // Keep the unlocked audio context between check-in and session routes.
    engine.current?.stop();
  }, [engine]);
  return audio;
}
