"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AmbientEngine } from "@/lib/audio";

export interface SessionArrival { opening: string[]; pace: number }
function useEngine() {
  const engine = useRef<AmbientEngine | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [pendingSession, prepareSession] = useState<SessionArrival | null>(null);
  const clearSession = useCallback(() => prepareSession(null), []);
  const start = useCallback(async () => {
    try {
      if (!engine.current) engine.current = new AmbientEngine();
      await engine.current.start();
      setActive(true);
      setError("");
    } catch { setError("Sound could not start. Tap to try again."); }
  }, []);
  useEffect(() => () => {
    void engine.current?.close();
    engine.current = null;
  }, []);
  return { engine, active, error, start, pendingSession, prepareSession, clearSession };
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
