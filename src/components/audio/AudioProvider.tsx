"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AmbientEngine, type NowPlaying } from "@/lib/audio";

import type { SessionMode, Mood, FocusMood } from "@/lib/types";

export interface SessionArrival { mode?: SessionMode; mood?: Mood | FocusMood; duration?: number | null; opening: string[]; pace: number }
function useEngine() {
  const engine = useRef<AmbientEngine | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [pendingSession, prepareSession] = useState<SessionArrival | null>(null);
  const clearSession = useCallback(() => prepareSession(null), []);
  const start = useCallback(async () => {
    try {
      if (!engine.current) engine.current = new AmbientEngine(setNowPlaying);
      await engine.current.start();
      setActive(true);
      setError("");
    } catch { setError("Sound could not start. Tap to try again."); }
  }, []);
  useEffect(() => () => {
    void engine.current?.close();
    engine.current = null;
    setNowPlaying(null);
  }, []);
  return { engine, active, error, start, pendingSession, prepareSession, clearSession, nowPlaying };
}
const Context = createContext<ReturnType<typeof useEngine> | null>(null);
export function AudioProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useEngine()}>{children}</Context.Provider>;
}
export function useAudioSession() {
  const value = useContext(Context);
  if (!value) throw new Error("AudioProvider is required");
  return value;
}
