"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { defaults, normalize, STORAGE_KEY } from "@/lib/preferences";
import type { Preferences, VisualId, SoundId } from "@/lib/types";
function useStore() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPreferences(normalize(JSON.parse(raw)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      setStorageError(true);
    }
  }, [preferences, ready]);
  const update = useCallback(
    (patch: Partial<Preferences>) =>
      setPreferences((p) => ({ ...p, ...patch })),
    [],
  );
  const toggleFavorite = useCallback(
    (id: VisualId) =>
      setPreferences((p) => ({
        ...p,
        favoriteVisuals: p.favoriteVisuals.includes(id)
          ? p.favoriteVisuals.filter((v) => v !== id)
          : [...p.favoriteVisuals, id],
      })),
    [],
  );
  const hideVisual = useCallback(
    (id: VisualId) =>
      setPreferences((p) => ({
        ...p,
        hiddenVisuals: [...new Set([...p.hiddenVisuals, id])],
      })),
    [],
  );
  const restoreVisual = useCallback(
    (id: VisualId) =>
      setPreferences((p) => ({
        ...p,
        hiddenVisuals: p.hiddenVisuals.filter((v) => v !== id),
      })),
    [],
  );
  const setVolume = useCallback(
    (id: SoundId, volume: number) =>
      setPreferences((p) => ({
        ...p,
        audioVolumes: { ...p.audioVolumes, [id]: volume },
      })),
    [],
  );
  return {
    preferences,
    ready,
    storageError,
    update,
    toggleFavorite,
    hideVisual,
    restoreVisual,
    setVolume,
    setDuration: (n: number | null) => update({ defaultSessionDuration: n }),
  };
}
const Context = createContext<ReturnType<typeof useStore> | null>(null);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useStore()}>{children}</Context.Provider>;
}
export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("PreferencesProvider is required");
  return context;
}
