"use client";
import { availableVisuals } from "@/lib/scene-availability";
import gsap from "gsap";
import { analytics } from "@/lib/analytics";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Moon, Crosshair, Github, Heart, Settings2, Volume2, VolumeX, X } from "lucide-react";
import MoodAtmosphere from "@/components/checkin/MoodAtmosphere";
import { visuals } from "@/data/catalog";
import { usePreferences } from "@/hooks/usePreferences";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useFullscreen } from "@/hooks/useFullscreen";
import { checkIns, checkInMix, availableCheckInScene, stationOrder } from "@/lib/check-in";
import { durationForMode, modeDurations, focusMoods } from "@/lib/session-mode";
import type { SessionMode, FocusMood, Mood, VisualId } from "@/lib/types";

const landingAssets = [
  "/images/checkin-rain.png",
  "/images/mood-warm.png",
  "/images/mood-cool.png",
  "/images/mood-sage.png",
];

export default function Home() {
  const router = useRouter();
  const { preferences: p, ready, update } = usePreferences();
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const transitionRoot = useRef<HTMLElement>(null);
  const modePositions = useRef<DOMRect[]>([]);
  const transitionTimeline = useRef<gsap.core.Timeline | null>(null);
  const hasMode = selectedMode !== null;
  const questionRef = useRef<HTMLHeadingElement>(null);
  const [entered, setEntered] = useState(false);
  const [focusMood, setFocusMood] = useState<FocusMood>("fresh");
  const focusRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mood, setMood] = useState<Mood>("fried");
  const [duration, setDuration] = useState<number | null>(10);
  const [assetProgress, setAssetProgress] = useState(0);
  const [customScene, setCustomScene] = useState<VisualId | null>(null);
  const [choosingScene, setChoosingScene] = useState(false);
  const fullscreen = useFullscreen();
  const stationRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sceneDialog = useRef<HTMLDialogElement>(null);
  const profile = checkIns[mood];
  const recommended = availableCheckInScene(mood, p.hiddenVisuals);
  const modeScenes = availableVisuals(visuals, selectedMode ?? "unwind", p.hiddenVisuals);
  const scene = customScene && modeScenes.some(v => v.id === customScene) ? customScene : selectedMode === "focus" ? modeScenes[0]?.id : recommended;
  const visual = visuals.find(v => v.id === scene);
  const availableScenes = modeScenes;
  const prioritizedScenes = [...availableScenes].sort((a, b) => {
    const aRecommended = a.recommendedMoods.includes(mood) ? 1 : 0;
    const bRecommended = b.recommendedMoods.includes(mood) ? 1 : 0;
    return bRecommended - aRecommended;
  });
  const useMoodMix = scene === profile.scene;
  const pace = useMoodMix ? profile.pace : 1;
  const audio = useAudioMixer(p, entered, 0.18, scene ?? "rain", useMoodMix ? checkInMix(mood) : undefined, false, selectedMode ?? "unwind");
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
    setFocusMood(p.focusMood ?? "fresh");
    setCustomScene(p.lastVisual ?? availableCheckInScene(initialMood, p.hiddenVisuals) ?? null);
    setDuration(p.defaultSessionDuration);
    if (document.fullscreenElement) setEntered(true);
  }, [ready]);
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
  useLayoutEffect(() => {
    if (!hasMode || !transitionRoot.current) return;
    const root = transitionRoot.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: () => questionRef.current?.focus({ preventScroll: true }) });
      transitionTimeline.current = timeline;
      timeline.to(".mode-step", { opacity: 0, duration: reduced ? 0 : 0.35, ease: "power2.out" }, 0);
      const switches = root.querySelectorAll<HTMLElement>(".mode-switch button");
      switches.forEach((button, index) => {
        const from = modePositions.current[index];
        const to = button.getBoundingClientRect();
        timeline.fromTo(button, {
          opacity: 0, x: reduced || !from ? 0 : from.left - to.left,
          y: reduced || !from ? 0 : from.top - to.top,
          scale: reduced ? 1 : 1.35,
        }, { opacity: 1, x: 0, y: 0, scale: 1, duration: reduced ? 0 : 0.95, ease: "power3.inOut", clearProps: "transform,opacity" }, reduced ? 0 : 0.15);
      });
      timeline.fromTo(".mode-question, .mode-mood-layer .mood-choice, .checkin-duration, .checkin-begin, .checkin-empty", {
        opacity: 0, y: reduced ? 0 : 12,
      }, {
        opacity: 1, y: 0, duration: reduced ? 0 : 0.85,
        stagger: reduced ? 0 : 0.045, ease: "power2.out", clearProps: "transform,opacity",
      }, reduced ? 0 : 0.6);
    }, root);
    return () => { context.revert(); transitionTimeline.current = null; };
  }, [hasMode]);
  function selectMode(mode: SessionMode) {
    if (!selectedMode) {
      modePositions.current = Array.from(transitionRoot.current?.querySelectorAll(".mode-choice") ?? []).map(el => el.getBoundingClientRect());
    }
    setSelectedMode(mode);
    setDuration(current => durationForMode(mode, current));
  }
  function tune(next: Mood) {
    setMood(next);
  }
  function begin() {
    if (!visual || !selectedMode) return;
    update({ focusMood, mode: selectedMode, lastMood: mood, lastVisual: visual.id, defaultSessionDuration: duration });
    audio.prepareSession({ mode: selectedMode, mood: selectedMode === "focus" ? focusMood : mood, duration, pace, opening: selectedMode === "focus" ? ["You’re here to focus.", "You chose " + visual.name.toLowerCase() + ".", "Settle in. Change anything as you go."] : useMoodMix ? [...profile.opening] : [profile.opening[0], "You chose " + visual.name.toLowerCase() + ".", "We’ll start there. You can change anything as you go."] });
    router.push("/session/");
  }
  return (
    <main className={`checkin-room ${entered ? "has-entered" : "at-door"}`} data-mood={mood} data-mode={selectedMode ?? "unwind"}>
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
              <a href="https://github.com/so-high-l/slowbit" target="_blank" rel="noopener noreferrer" aria-label="Slowbit on GitHub (opens in a new tab)" title="View on GitHub"><Github size={22} strokeWidth={1.4} aria-hidden="true" /></a>
            </nav>
          </header>
          <section ref={transitionRoot} className={`checkin-main mode-flow ${hasMode ? "has-mode" : ""}`} aria-labelledby={hasMode ? "checkin-question" : "mode-question"}>
            <div className="mode-step" inert={hasMode} aria-hidden={hasMode}>
              <h1 id="mode-question">what do you need right now?</h1>
              <div className="mood-list" aria-label="Session mode">
                {(["unwind", "focus"] as const).map(mode => <button key={mode} className="mood-choice mode-choice" onClick={() => selectMode(mode)}>
                  <span className="mood-marker" aria-hidden="true" />
                  <span className="mode-option-name">{mode === "unwind" ? <Moon size={20} aria-hidden="true" /> : <Crosshair size={20} aria-hidden="true" />}{mode === "unwind" ? "Unwind" : "Focus"}{mode === "focus" && <span className="mode-new-label">new</span>}</span>
                </button>)}
              </div>
            </div><div className="mode-configuration" inert={!hasMode} aria-hidden={!hasMode}>
            <div className="mode-switch" role="group" aria-label="Session mode">
              {(["unwind", "focus"] as const).map(mode => <button key={mode} aria-pressed={selectedMode === mode} onClick={() => selectMode(mode)}><span className="mode-selection-dot" aria-hidden="true" />{mode === "unwind" ? <Moon size={14} aria-hidden="true" /> : <Crosshair size={14} aria-hidden="true" />}<span>{mode}</span>{mode === "focus" && <span className="mode-new-label">new</span>}</button>)}
            </div>
            <h1 className="mode-question" id="checkin-question" ref={questionRef} tabIndex={-1}>how are you arriving?</h1>
            <div className="mode-mood-stack">
            <div className="mood-list mode-mood-layer" data-visible={selectedMode === "unwind"} inert={selectedMode !== "unwind"} aria-hidden={selectedMode !== "unwind"} role="radiogroup" aria-label="Unwind mood">
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
            <div className="mood-list mode-mood-layer" data-visible={selectedMode === "focus"} inert={selectedMode !== "focus"} aria-hidden={selectedMode !== "focus"} role="radiogroup" aria-label="Focus mood">
              {focusMoods.map((item, index) => <button
                key={item.id} ref={el => { focusRefs.current[index] = el; }}
                className={`mood-choice ${focusMood === item.id ? "is-selected" : ""}`}
                role="radio" aria-checked={focusMood === item.id} tabIndex={focusMood === item.id ? 0 : -1}
                onClick={() => setFocusMood(item.id)}
                onKeyDown={e => {
                  let target = index;
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") target = (index + 1) % focusMoods.length;
                  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = (index + focusMoods.length - 1) % focusMoods.length;
                  else if (e.key === "Home") target = 0;
                  else if (e.key === "End") target = focusMoods.length - 1;
                  else return;
                  e.preventDefault(); setFocusMood(focusMoods[target].id); focusRefs.current[target]?.focus();
                }}><span className="mood-marker" aria-hidden="true" /><span>{item.label}</span></button>)}
            </div>
            </div>
            <fieldset className="checkin-duration">
              <legend className="sr-only">Session length</legend>
              {modeDurations[selectedMode ?? "unwind"].map(d => <button key={String(d)} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)}>{d === null ? "no timer" : `${d} min`}</button>)}
            </fieldset>
            <button className="checkin-begin" disabled={!visual} onClick={begin}>begin <ArrowRight size={21} strokeWidth={1.3} /></button>
            {!visual && <p className="checkin-empty" role="status">All scenes are hidden. <Link href="/settings/">Restore a scene in Settings.</Link></p>}
            </div>
          </section>
          <footer className="checkin-footer" style={{ visibility: selectedMode ? "visible" : "hidden" }}>
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
          <div className="scene-picker-options">{prioritizedScenes.map(v => <button key={v.id} aria-pressed={scene === v.id} onClick={() => { if (scene !== v.id) analytics.sceneSelected(v, selectedMode ?? "unwind"); setCustomScene(v.id); setChoosingScene(false); }}><span>{v.name}</span><small>{v.tags.join(" · ")}</small><ArrowRight size={17} /></button>)}</div>
          {!visual && <Link href="/settings/">Restore scenes in Settings</Link>}
          <button className="scene-picker-reset" onClick={() => { const suggested = visuals.find(v => v.id === recommended); if (suggested && scene !== recommended) analytics.sceneSelected(suggested, selectedMode ?? "unwind"); setCustomScene(recommended ?? null); setChoosingScene(false); }}>Use a suggested scene for {profile.label.toLowerCase()}</button>
        </div>
      </dialog>
    </main>
  );
}
