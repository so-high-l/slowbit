"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  defaults,
  completeTour as markTourComplete,
  getSceneSoundMix as resolveSceneSoundMix,
  hasCompletedTour as isTourComplete,
  normalize,
  resetSceneSoundMix as removeSceneSoundMix,
  saveSceneSoundMix as persistSceneSoundMix,
  STORAGE_KEY,
} from "@/lib/preferences";
import type { Preferences, Visual, VisualId, SoundId, SoundMix } from "@/lib/types";
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
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        setStorageError(true);
      }
    }, 280);
    return () => window.clearTimeout(timeout);
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
  const getSceneSoundMix = useCallback(
    (visual: Pick<Visual, "id" | "defaultSounds">) => resolveSceneSoundMix(preferences, visual),
    [preferences],
  );
  const saveSceneSoundMix = useCallback(
    (sceneId: VisualId, mix: Partial<SoundMix>) =>
      setPreferences((p) => persistSceneSoundMix(p, sceneId, mix)),
    [],
  );
  const resetSceneSoundMix = useCallback(
    (sceneId: VisualId) => setPreferences((p) => removeSceneSoundMix(p, sceneId)),
    [],
  );
  const hasCompletedTour = useCallback(
    (tourId: string) => isTourComplete(preferences, tourId),
    [preferences],
  );
  const completeTour = useCallback(
    (tourId: string) => setPreferences((p) => markTourComplete(p, tourId)),
    [],
  );
  const setVolume = useCallback(
    (sceneId: VisualId, id: SoundId, volume: number) => saveSceneSoundMix(sceneId, { [id]: volume }),
    [saveSceneSoundMix],
  );
  return {
    preferences,
    ready,
    storageError,
    update,
    toggleFavorite,
    hideVisual,
    restoreVisual,
    getSceneSoundMix,
    saveSceneSoundMix,
    resetSceneSoundMix,
    hasCompletedTour,
    completeTour,
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
