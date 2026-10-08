"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Heart, Settings2, Volume2, VolumeX, X } from "lucide-react";
import MoodAtmosphere from "@/components/checkin/MoodAtmosphere";
import { durations, visuals } from "@/data/catalog";
import { usePreferences } from "@/hooks/usePreferences";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useFullscreen } from "@/hooks/useFullscreen";
import { checkIns, checkInMix, availableCheckInScene, stationOrder } from "@/lib/check-in";
import { sceneMix } from "@/lib/sound-presets";
import type { Mood, VisualId } from "@/lib/types";

const landingAssets = [
  "/images/checkin-rain.png",
  "/images/mood-warm.png",
  "/images/mood-cool.png",
  "/images/mood-sage.png",
];

export default function Home() {
  const router = useRouter();
  const { preferences: p, ready, update } = usePreferences();
  const [entered, setEntered] = useState(false);
  const [mood, setMood] = useState<Mood>("fried");
  const [duration, setDuration] = useState<number | null>(10);
  const [assetProgress, setAssetProgress] = useState(0);
  const [customScene, setCustomScene] = useState<VisualId | null>(null);
  const [choosingScene, setChoosingScene] = useState(false);
  const fullscreen = useFullscreen();
  const audio = useAudioMixer(p, entered, 0.18);
  const stationRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sceneDialog = useRef<HTMLDialogElement>(null);
  const profile = checkIns[mood];
  const recommended = availableCheckInScene(mood, p.hiddenVisuals);
  const scene = customScene && !p.hiddenVisuals.includes(customScene) ? customScene : recommended;
  const visual = visuals.find(v => v.id === scene);
  const availableScenes = visuals.filter(v => !p.hiddenVisuals.includes(v.id));
  const prioritizedScenes = [...availableScenes].sort((a, b) => {
    const aRecommended = a.recommendedMoods.includes(mood) ? 1 : 0;
    const bRecommended = b.recommendedMoods.includes(mood) ? 1 : 0;
    return bRecommended - aRecommended;
  });
  const useMoodMix = scene === profile.scene;
  const pace = useMoodMix ? profile.pace : 1;
  const assetsReady = ready && assetProgress === 100;
  useEffect(() => {
    let loaded = 0;
    let cancelled = false;
    const images = landingAssets.map(src => {
      const image = new Image();
      let counted = false;
      const complete = () => {
        if (counted) return;
        counted = true;
        loaded += 1;
        if (!cancelled)
          setAssetProgress(Math.min(100, Math.round((loaded / landingAssets.length) * 100)));
      };
      image.onload = complete;
      image.onerror = complete;
      image.src = src;
      if (image.complete) complete();
      return image;
    });
    return () => {
      cancelled = true;
      images.forEach(image => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const initialMood = p.lastMood ?? "fried";
    setMood(initialMood);
    setCustomScene(p.lastVisual ?? availableCheckInScene(initialMood, p.hiddenVisuals) ?? null);
    setDuration(p.defaultSessionDuration);
    if (document.fullscreenElement) setEntered(true);
  }, [ready]);
  useEffect(() => {
    if (!entered || !visual) return;
    update({ audioVolumes: useMoodMix ? checkInMix(mood) : sceneMix(visual) });
  }, [entered, visual, mood, useMoodMix, update]);
  useEffect(() => {
    if (entered) void audio.start();
  }, [entered, audio.start]);
  useEffect(() => {
    if (choosingScene) sceneDialog.current?.showModal();
    else sceneDialog.current?.close();
  }, [choosingScene]);
  const enter = useCallback(async () => {
    // Both calls start in this user gesture, before awaiting fullscreen.
    void audio.start();
    await fullscreen.toggle();
    setEntered(true);
  }, [audio.start, fullscreen.toggle]);
  useEffect(() => {
    if (entered || !ready) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "f" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      void enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entered, ready, enter]);
  function tune(next: Mood) {
    setMood(next);
  }
  function begin() {
    if (!visual) return;
    update({ lastMood: mood, lastVisual: visual.id, defaultSessionDuration: duration, audioVolumes: useMoodMix ? checkInMix(mood) : sceneMix(visual) });
    audio.prepareSession({ pace, opening: useMoodMix ? [...profile.opening] : [profile.opening[0], "You chose " + visual.name.toLowerCase() + ".", "We’ll start there. You can change anything as you go."] });
    router.push("/session/");
  }
  return (
    <main className={`checkin-room ${entered ? "has-entered" : "at-door"}`} data-mood={mood}>
      <MoodAtmosphere mood={mood} />
      {!entered ? (
        <div className="entry-gate">
          {!assetsReady ? (
            <div className="asset-loader" role="status" aria-live="polite" aria-label={`Loading assets ${assetProgress}%`}>
              <span className="asset-loader-track"><span style={{ width: `${assetProgress}%` }} /></span>
              <span>{assetProgress}%</span>
            </div>
          ) : (
            <button className="enter-fullscreen" onClick={enter} aria-keyshortcuts="f" aria-label="Go fullscreen — press F or click">
              <span>go fullscreen</span><kbd>F</kbd>
            </button>
          )}
        </div>
      ) : (
        <div className="checkin-layout">
          <header className="checkin-header">
            <Link href="/" className="checkin-brand" aria-label="Slowbit home">slowbit.</Link>
            <nav aria-label="Main navigation">
              <button aria-label={p.muted ? "Unmute preview" : "Mute preview"} onClick={() => update({ muted: !p.muted })}>{p.muted ? <VolumeX size={21} strokeWidth={1.4} /> : <Volume2 size={21} strokeWidth={1.4} />}</button>
              <Link href="/favorites/" aria-label="Saved spaces"><Heart size={20} strokeWidth={1.4} /></Link>
              <Link href="/settings/" aria-label="Settings"><Settings2 size={22} strokeWidth={1.4} /></Link>
            </nav>
          </header>
          <section className="checkin-main" aria-labelledby="checkin-question">
            <h1 id="checkin-question">how are you arriving?</h1>
            <div className="mood-list" role="radiogroup" aria-label="How are you feeling?">
              {stationOrder.map((id, index) => <button
                key={id} ref={el => { stationRefs.current[index] = el; }}
                className={`mood-choice ${mood === id ? "is-selected" : ""}`}
                role="radio" aria-checked={mood === id} tabIndex={mood === id ? 0 : -1}
                onClick={() => tune(id)}
                onKeyDown={e => {
                  let target = index;
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") target = (index + 1) % stationOrder.length;
                  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = (index + stationOrder.length - 1) % stationOrder.length;
                  else if (e.key === "Home") target = 0;
                  else if (e.key === "End") target = stationOrder.length - 1;
                  else return;
                  e.preventDefault(); tune(stationOrder[target]); stationRefs.current[target]?.focus();
                }}>
                <span className="mood-marker" aria-hidden="true" />
                <span>{checkIns[id].label}</span>
              </button>)}
            </div>
            <fieldset className="checkin-duration">
              <legend className="sr-only">Session length</legend>
              {durations.map(d => <button key={String(d)} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)}>{d === null ? "no timer" : `${d} min`}</button>)}
            </fieldset>
            <button className="checkin-begin" disabled={!visual} onClick={begin}>begin <ArrowRight size={21} strokeWidth={1.3} /></button>
            {!visual && <p className="checkin-empty" role="status">All scenes are hidden. <Link href="/settings/">Restore a scene in Settings.</Link></p>}
          </section>
          <footer className="checkin-footer">
            <button className="checkin-scene" onClick={() => setChoosingScene(true)} aria-label={`Choose a scene. Current scene: ${visual?.name ?? "none"}`}>
              <span>scene:</span> {visual?.name ?? "choose one"} <ArrowRight size={16} strokeWidth={1.4} />
            </button>
          </footer>
          {(fullscreen.message || audio.error) && <p className="checkin-notice" role="status">{fullscreen.message || <button onClick={() => void audio.start()}>{audio.error}</button>}</p>}
        </div>
      )}
      <dialog ref={sceneDialog} className="scene-picker" onCancel={() => setChoosingScene(false)} onClose={() => setChoosingScene(false)} onClick={e => { if (e.target === e.currentTarget) setChoosingScene(false); }}>
        <div><header><h2>Somewhere else?</h2><button autoFocus aria-label="Close scene selection" onClick={() => setChoosingScene(false)}><X size={20} /></button></header>
          <p>Your choice. You can change the sound later.</p>
          <div className="scene-picker-options">{prioritizedScenes.map(v => <button key={v.id} aria-pressed={scene === v.id} onClick={() => { setCustomScene(v.id); setChoosingScene(false); }}><span>{v.name}</span><small>{v.tags.join(" · ")}</small><ArrowRight size={17} /></button>)}</div>
          {!visual && <Link href="/settings/">Restore scenes in Settings</Link>}
          <button className="scene-picker-reset" onClick={() => { setCustomScene(recommended ?? null); setChoosingScene(false); }}>Use a suggested scene for {profile.label.toLowerCase()}</button>
        </div>
      </dialog>
    </main>
  );
}
