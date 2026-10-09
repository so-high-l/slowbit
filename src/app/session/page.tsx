"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Heart,
  EyeOff,
  Maximize,
  Minimize,
  Pause,
  Play,
  SlidersHorizontal,
  X,
  Volume2,
  VolumeX,
  MessageCircle,
  Orbit,
} from "lucide-react";
import { Logo } from "@/components/Shell";
import VisualRenderer from "@/components/visuals/VisualRenderer";
import AudioMixer from "@/components/audio/AudioMixer";
import AnonymousBoard from "@/components/board/AnonymousBoard";
import MessageComposer from "@/components/board/MessageComposer";
import SessionOpening from "@/components/checkin/SessionOpening";
import { useAudioSession } from "@/components/audio/AudioProvider";
import { usePreferences } from "@/hooks/usePreferences";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { sceneMix } from "@/lib/sound-presets";
import { visuals } from "@/data/catalog";
import { analytics, captureProductEvent } from "@/lib/analytics";
import { createSessionAnalytics } from "@/lib/analytics-events";
import type { VisualId } from "@/lib/types";
export default function SessionPage() {
  const store = usePreferences();
  if (!store.ready)
    return <div className="loading-state">Finding a little quiet…</div>;
  return <Session />;
}
function Session() {
  const {
    preferences: p,
    update,
    toggleFavorite,
    hideVisual,
  } = usePreferences();
  const [visualId, setVisualId] = useState<VisualId>(
    p.lastVisual && !p.hiddenVisuals.includes(p.lastVisual)
      ? p.lastVisual
      : (visuals.find((v) => !p.hiddenVisuals.includes(v.id))?.id ?? "rain"),
  );
  const audioSession = useAudioSession();
  const [arrival] = useState(audioSession.pendingSession);
  const [phase, setPhase] = useState<"ready" | "running" | "ended">(arrival ? "running" : "ready");
  const [playing, setPlaying] = useState(!!arrival);
  const [sessionAnalytics] = useState(() => createSessionAnalytics(captureProductEvent));
  useEffect(() => {
    if (phase === "running" && !p.hiddenVisuals.includes(visualId))
      sessionAnalytics.start(p.defaultSessionDuration, p.lastMood ?? "fried", visualId);
  }, [phase, sessionAnalytics, p.defaultSessionDuration, p.lastMood, p.hiddenVisuals, visualId]);
  const [opening, setOpening] = useState(!!arrival);
  const [motionScale, setMotionScale] = useState(arrival?.pace ?? 1);
  const finishOpening = useCallback(() => setOpening(false), []);
  useEffect(() => {
    if (arrival) {
      audioSession.clearSession();
      void audioSession.start();
    }
  }, [arrival, audioSession.clearSession, audioSession.start]);
  const [exploring, setExploring] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const [panel, setPanel] = useState(false);
  const [visible, setVisible] = useState(true);
  const [notice, setNotice] = useState("");
  const controls = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullscreen = useFullscreen();
  const audio = useAudioMixer(p, playing, 1, visualId);
  const timer = useSessionTimer(
    p.defaultSessionDuration,
    phase === "running" && playing,
    () => {
      sessionAnalytics.complete(visualId);
      setPlaying(false);
      setPhase("ended");
      setPanel(false);
    },
  );
  useEffect(() => {
    if (arrival || phase !== "ready" || !document.fullscreenElement) return;
    setPhase("running");
    setPlaying(true);
    void audio.start();
  }, [arrival, audio.start, phase]);
  const visual = visuals.find((v) => v.id === visualId)!;
  const available = visuals.filter((v) => !p.hiddenVisuals.includes(v.id));
  const reveal = useCallback(() => {
    setVisible(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      if (
        !panel &&
        !p.showBoard &&
        playing &&
        phase === "running" &&
        !(
          controls.current?.contains(document.activeElement) &&
          document.activeElement?.matches(":focus-visible")
        )
      )
        setVisible(false);
    }, 4500);
  }, [panel, playing, phase, p.showBoard]);
  useEffect(() => {
    reveal();
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, [reveal]);
  useEffect(() => {
    if (!controls.current) return;
    const tween = gsap.to(controls.current, {
      opacity: visible ? 1 : 0,
      y: visible ? 0 : 8,
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0.01
        : 0.7,
      ease: "power2.out",
    });
    return () => {
      tween.kill();
    };
  }, [visible, phase]);
  useEffect(() => {
    if (!panel) return;
    const tween = gsap.fromTo(
      panelRef.current,
      { opacity: 0, x: 20 },
      {
        opacity: 1,
        x: 0,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0.01
          : 0.5,
      },
    );
    return () => {
      tween.kill();
    };
  }, [panel]);
  useEffect(() => {
    if (phase !== "ended") return;
    const tween = gsap.fromTo(
      endRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0.01
          : 2,
      },
    );
    return () => {
      tween.kill();
    };
  }, [phase]);
  async function begin(withFullscreen: boolean) {
    if (withFullscreen) void fullscreen.toggle();
    setPhase("running");
    setPlaying(true);
    void audio.start();
  }
  function switchVisual(id: VisualId, trackSelection = true) {
    if (id === visualId) return;
    if (trackSelection) analytics.sceneSelected(id);
    setVisualId(id);
    setOpening(false);
    setMotionScale(1);
    const nextVisual = visuals.find((v) => v.id === id)!;
    update({ lastVisual: id, audioVolumes: sceneMix(nextVisual) });
    setNotice("");
    reveal();
  }
  function next(direction: number) {
    const index = available.findIndex((v) => v.id === visualId);
    const target =
      available[(index + direction + available.length) % available.length];
    if (target) switchVisual(target.id);
  }
  function random() {
    const others = available.filter((v) => v.id !== visualId);
    if (others.length)
      switchVisual(others[Math.floor(Math.random() * others.length)].id);
  }
  function togglePlay() {
    if (!playing) void audio.start();
    setPlaying((v) => !v);
    reveal();
  }
  function hide() {
    const remaining = available.filter((v) => v.id !== visualId);
    if (!p.hiddenVisuals.includes(visualId)) analytics.sceneHidden(visualId);
    hideVisual(visualId);
    if (remaining.length) switchVisual(remaining[0].id, false);
    else {
      setPlaying(false);
      setPanel(false);
    }
    setNotice(`${visual.name} hidden. Restore it in Settings.`);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]'))
        return;
      const k = e.key.toLowerCase();
      if (k === "escape" && (panel || p.showBoard)) {
        setPanel(false);
        update({ showBoard: false });
        return;
      }
      if (!["f", "m", "z", " ", "arrowright", "arrowleft"].includes(k)) return;
      if (k === " " && target.closest("button,a")) return;
      e.preventDefault();
      reveal();
      if (k === "f") {
        if (phase === "ready") void begin(true);
        else void fullscreen.toggle();
      }
      if (phase !== "running") return;
      if (k === "z") setExploring((v) => !v);
      if (k === "m") update({ muted: !p.muted });
      if (k === " ") togglePlay();
      if (k === "arrowright") next(1);
      if (k === "arrowleft") next(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const time =
    timer.remaining === null
      ? "No timer"
      : `${Math.floor(timer.remaining / 60)
        .toString()
        .padStart(
          2,
          "0",
        )}:${(timer.remaining % 60).toString().padStart(2, "0")}`;
  const endingTime =
    timer.remaining === null
      ? "No timer set"
      : timer.remaining > 0
        ? `${time} left in your relaxation session`
        : "Session time is up";
  if (!available.length)
    return (
      <main className="empty-session">
        <h1>A little room for something new.</h1>
        <p>All spaces are hidden. Restore one to start a session.</p>
        <Link className="primary-button" href="/settings/">
          Restore a space
        </Link>
        <Link href="/">Back home</Link>
      </main>
    );
  return (
    <main
      className={`session ${opening ? "opening-active" : ""} ${p.showBoard ? "board-open" : ""} ${phase === "running" && !visible ? "controls-hidden" : ""}`}
      onPointerMove={reveal}
      onPointerDown={reveal}
      onFocusCapture={reveal}
    >
      <VisualRenderer
        visualId={visualId}
        paused={!playing}
        exploring={exploring}
        motionScale={motionScale}
      />
      {phase === "running" && opening && arrival && <SessionOpening lines={arrival.opening} playing={playing} onComplete={finishOpening} />}
      {phase === "ready" && (
        <div className="fullscreen-prompt modal-backdrop">
          <div className="prompt-content">
            <span className="eyebrow">LEAVE THE REST OUTSIDE</span>
            <h1>
              Ready to
              <br />
              <em>switch off?</em>
            </h1>
            <p>Settle in. Let {visual.name.toLowerCase()} take over.</p>
            <button
              autoFocus
              className="primary-button"
              onClick={() => begin(true)}
            >
              <Maximize size={18} /> Enter fullscreen
            </button>
            <button className="text-button" onClick={() => begin(false)}>
              Stay in this window
            </button>
            <span className="shortcut-note">
              You can also press <kbd>F</kbd>
            </span>
            <Link href="/" className="back-link">
              Back to your spaces
            </Link>
          </div>
        </div>
      )}
      {phase === "running" && (
        <div
          className="session-ui"
          ref={controls}
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <header className="session-header">
            <Logo />
            <div className="timer-chip">
              <span className={playing ? "timer-breath" : ""} />
              <span aria-label="Time remaining">{time}</span>
            </div>
            <button
              className="text-button finish-button"
              onClick={() => {
                setPlaying(false);
                setPhase("ended");
              }}
            >
              Finish session <X size={15} />
            </button>
          </header>
          <div className="scene-caption" inert={p.showBoard || opening}>
            <span className="eyebrow">YOU ARE HERE. THAT’S ENOUGH.</span>
            <h1>{visual.name}</h1>
            <p>{visual.subtitle}</p>
            <button
              className={`explore-switch ${exploring ? "active" : ""}`}
              aria-pressed={exploring}
              onClick={() => setExploring((v) => !v)}
            >
              <Orbit size={13} />
              {reducedMotion
                ? exploring
                  ? "A still point"
                  : "Find a still point"
                : visualId === "stars" || visualId === "drift"
                  ? exploring
                    ? "Drifting deeper"
                    : "Drift deeper"
                  : exploring
                    ? "Following the light"
                    : "Follow the light"}
              <kbd>Z</kbd>
            </button>
          </div>
          <div className="session-bottom">
            <div className="session-status" role="status">
              {notice ||
                fullscreen.message ||
                audio.error ||
                (!playing ? "Take your time. Your session is paused." : "")}
            </div>
            <div className="control-dock">
              <div className="dock-group">
                <button
                  className={`icon-button ${p.favoriteVisuals.includes(visualId) ? "is-favorite" : ""}`}
                  aria-label={
                    p.favoriteVisuals.includes(visualId)
                      ? "Remove favorite"
                      : "Favorite this space"
                  }
                  aria-pressed={p.favoriteVisuals.includes(visualId)}
                  onClick={(e) => {
                    if (!p.favoriteVisuals.includes(visualId)) analytics.sceneFavorited(visualId);
                    toggleFavorite(visualId);
                    gsap.fromTo(
                      e.currentTarget,
                      { scale: 0.85 },
                      {
                        scale: 1,
                        duration: matchMedia("(prefers-reduced-motion: reduce)")
                          .matches
                          ? 0.01
                          : 0.4,
                        ease: "back.out(2)",
                      },
                    );
                  }}
                >
                  <Heart
                    size={20}
                    fill={
                      p.favoriteVisuals.includes(visualId)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
                <button
                  className="icon-button"
                  aria-label="Hide this space"
                  onClick={hide}
                >
                  <EyeOff size={19} />
                </button>
              </div>
              <span className="dock-divider" />
              <div className="dock-group">
                <button
                  className="icon-button"
                  aria-label="Previous visual"
                  disabled={available.length < 2}
                  onClick={() => next(-1)}
                >
                  <ArrowLeft size={19} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Random visual"
                  disabled={available.length < 2}
                  onClick={random}
                >
                  <Shuffle size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Next visual"
                  disabled={available.length < 2}
                  onClick={() => next(1)}
                >
                  <ArrowRight size={19} />
                </button>
              </div>
              <button
                className="play-button"
                aria-label={playing ? "Pause session" : "Resume session"}
                onClick={togglePlay}
              >
                {playing ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
              </button>
              <button
                className={`sounds-button ${panel ? "active" : ""}`}
                aria-expanded={panel}
                aria-controls="audio-panel"
                aria-label="Sounds"
                onClick={() => {
                  setPanel((v) => !v);
                  update({ showBoard: false });
                }}
              >
                <SlidersHorizontal size={18} />
                <span>Sounds</span>
              </button>
              <button
                className="icon-button mute-control"
                aria-label={p.muted ? "Unmute audio" : "Mute audio"}
                onClick={() => update({ muted: !p.muted })}
              >
                {p.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>
              <button
                className={`icon-button board-toggle ${p.showBoard ? "active" : ""}`}
                aria-label={
                  p.showBoard ? "Hide message board" : "Show message board"
                }
                aria-pressed={p.showBoard}
                onClick={() => {
                  update({ showBoard: !p.showBoard });
                  setPanel(false);
                }}
              >
                <MessageCircle size={17} />
              </button>
              <span className="dock-divider" />
              <button
                className="icon-button"
                aria-label={
                  fullscreen.fullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
                onClick={fullscreen.toggle}
              >
                {fullscreen.fullscreen ? (
                  <Minimize size={18} />
                ) : (
                  <Maximize size={18} />
                )}
              </button>
            </div>
            <p className="keyboard-hints">
              <span>
                <kbd>space</kbd> pause
              </span>
              <span>
                <kbd>←</kbd>
                <kbd>→</kbd> explore
              </span>
              <span>
                <kbd>M</kbd> mute
              </span>
              <span>
                <kbd>F</kbd> fullscreen
              </span>
            </p>
          </div>
        </div>
      )}
      {phase === "running" && (
        <div className="session-board-panel">
          <AnonymousBoard visible={p.showBoard} onClose={() => update({ showBoard: false })} />
        </div>
      )}
      {panel && phase === "running" && (
        <aside
          className="audio-panel"
          id="audio-panel"
          ref={panelRef}
          aria-label="Sound mixer"
        >
          <button
            className="icon-button panel-close"
            aria-label="Close sound mixer"
            onClick={() => setPanel(false)}
          >
            <X size={19} />
          </button>
          <AudioMixer visual={visual} />
          {audio.error && (
            <button className="text-button" onClick={audio.start}>
              Try starting sound again
            </button>
          )}
        </aside>
      )}
      {phase === "ended" && (
        <div
          className="ending modal-backdrop"
          ref={endRef}
        >
          <div className="ending-layout">
            <div className="ending-content">
              <h1 className="ending-title">Session complete.</h1>
              <p className="ending-intro">Come back another time.</p>
              <MessageComposer onPosted={() => undefined} />
              <div className="ending-actions">
                <button
                  className="primary-button"
                  onClick={() => {
                    sessionAnalytics.extend();
                    timer.resumeOrExtend(p.defaultSessionDuration);
                    setPhase("running");
                    setPlaying(true);
                    void audio.start();
                  }}
                >
                  Stay a little longer
                </button>
                <span className="ending-time" role="status">
                  {endingTime}
                </span>
                <Link
                  className="text-button"
                  href="/"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                  }}
                >
                  Finish
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
