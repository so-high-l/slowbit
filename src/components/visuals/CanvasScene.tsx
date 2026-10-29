"use client";
import { useAudioSession } from "@/components/audio/AudioProvider";
import { pondDropStarted } from "@/lib/pond-timing";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import type { VisualId } from "@/lib/types";
import type { ScenePainter } from "./drawing";
import { paintQuietMachine } from "./QuietMachine";
import { paintNightDrive } from "./NightDrive";
import { paintReadingRoom, readingRoomImages } from "./ReadingRoom";
import { paintFocusComingSoon } from "./FocusComingSoon";
import { paintRain } from "./RainWindow";
import { paintAurora } from "./GradientFlow";
import { paintStars } from "./Stars";
import { paintEmbers } from "./Campfire";
import { paintOcean } from "./Ocean";
import { paintDrift } from "./FloatingParticles";
import { paintPond } from "./Pond";
import { paintMistForest } from "./MistForest";
import { paintFirstSnow } from "./FirstSnow";
import { paintSlowDunes } from "./SlowDunes";
import { paintAboveClouds } from "./AboveClouds";
import { paintDeepBlue } from "./DeepBlue";
import { paintEveningMeadow } from "./EveningMeadow";
import { paintPaperLantern } from "./PaperLantern";
import { paintSlowInk } from "./SlowInk";
import { paintLateNightRecord } from "./LateNightRecord";
import { paintNightSky } from "./NightSky";
import { paintFlowingThread } from "./FlowingThread";
import { paintRibbonTunnel } from "./InfiniteRibbonTunnel";
import { paintDeepPassage } from "./DeepPassage";
import { paintMagneticField } from "./MagneticField";
import { paintFollowLight } from "./follow-light";
import { advanceDepth } from "./depth";
import { paintMorningLattice } from "./MorningLattice";
import { orbitImages, paintOrbitStudy } from "./OrbitStudy";
import { advanceOrbitMotion, createOrbitMotion } from "./orbit-motion";
type CanvasVisualId = Exclude<VisualId, "chromaticDrift" | "japaneseCafe">;

const painters = {
  focusComingSoon: paintFocusComingSoon,
  quietMachine: paintQuietMachine,
  nightDrive: ({ ctx, w, h, t, focus, reducedMotion }) =>
    paintNightDrive({ ctx, w, h, t, immersiveProgress: focus, reducedMotion }),
  readingRoom: paintReadingRoom,
  orbitStudy: paintOrbitStudy,
  morningLattice: paintMorningLattice,
  rain: paintRain,
  aurora: paintAurora,
  stars: paintStars,
  embers: paintEmbers,
  drift: paintDrift,
  ocean: paintOcean,
  pond: paintPond,
  mist: paintMistForest,
  snow: paintFirstSnow,
  dunes: paintSlowDunes,
  clouds: paintAboveClouds,
  jelly: paintDeepBlue,
  meadow: paintEveningMeadow,
  lantern: paintPaperLantern,
  trainCarriage: paintPaperLantern,
  ink: paintSlowInk,
  vinyl: paintLateNightRecord,
  nightSky: paintNightSky,
  thread: paintFlowingThread,
  ribbonTunnel: paintRibbonTunnel,
  deepPassage: paintDeepPassage,
  magneticField: paintMagneticField,
} satisfies Record<CanvasVisualId, ScenePainter>;
export default function CanvasScene({
  kind,
  paused = false,
  exploring = false,
  motionScale = 1,
}: {
  kind: CanvasVisualId;
  paused?: boolean;
  exploring?: boolean;
  motionScale?: number;
}) {
  const { engine } = useAudioSession();
  const canvas = useRef<HTMLCanvasElement>(null);
  const isPaused = useRef(paused);
  const active = useRef(exploring);
  const dirty = useRef(true);
  const pace = useRef(motionScale);
  const toggleOrbit = useRef<(() => void) | null>(null);
  useEffect(() => { pace.current = motionScale; }, [motionScale]);
  useEffect(() => {
    isPaused.current = paused;
    dirty.current = true;
  }, [paused]);
  useEffect(() => {
    active.current = exploring;
    dirty.current = true;
    toggleOrbit.current?.();
  }, [exploring]);
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let w = 0,
      h = 0,
      frame = 0,
      t = 0,
      machineTime = 0,
      machineZoomTime = 0,
      deepPassageTime = 0,
      last = 0,
      focus = 0;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    const orbit = createOrbitMotion();
    let orbitTween: gsap.core.Tween | undefined;
    const updateOrbit = () => {
      orbitTween?.kill();
      if (reduced) {
        Object.assign(orbit, createOrbitMotion(), { strength: active.current ? 1 : 0 });
        dirty.current = true;
        return;
      }
      orbitTween = gsap.to(orbit, {
        strength: active.current ? 1 : 0,
        duration: 14,
        ease: "sine.inOut",
        onUpdate: () => { dirty.current = true; },
        onComplete: () => {
          dirty.current = true;
        },
      });
    };
    if (kind === "orbitStudy") {
      toggleOrbit.current = updateOrbit;
      if (active.current) updateOrbit();
    }
    const sync = () => {
      const wasReduced = reduced;
      reduced = media.matches;
      dirty.current = true;
      if (kind === "orbitStudy") {
        if (wasReduced && !reduced) orbit.strength = 0;
        updateOrbit();
      }
    };
    media.addEventListener("change", sync);
    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      const dpr = Math.min(devicePixelRatio, 1.75);
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty.current = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const unsubscribeImages = kind === "orbitStudy"
      ? orbitImages.preload(() => { dirty.current = true; })
      : kind === "readingRoom"
        ? readingRoomImages.preload(() => { dirty.current = true; })
        : undefined;
    const particles = Array.from(
      { length: kind === "stars" ? 260 : 140 },
      () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2 + 0.3,
        s: Math.random() * 0.6 + 0.2,
        phase: Math.random() * 6.28,
      }),
    );
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (kind !== "meadow" && now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.05) * pace.current;
      last = now;
      if (document.hidden) return;
      if (!dirty.current && (isPaused.current || reduced || kind === "focusComingSoon")) return;
      if (!isPaused.current && !reduced) {
        const previousTime = t;
        if (kind === "quietMachine") machineTime += dt;
        // Keep the record at its last angle while the needle is lifted.
        // Resuming Z continues from that angle instead of jumping to wall time.
        if (kind !== "vinyl" || active.current) t += dt;
        // Normal mode drifts quietly; immersion smoothly raises orbital speed.
        if (kind === "orbitStudy") advanceOrbitMotion(orbit, dt);
        if (kind === "pond" && pondDropStarted(previousTime, t)) engine.current?.playPondDrop();
        focus += ((active.current ? 1 : 0) - focus) * (1 - Math.exp(-dt * (kind === "quietMachine" ? 0.2 : kind === "deepPassage" ? 0.34 : kind === "meadow" || kind === "magneticField" ? 0.28 : kind === "morningLattice" ? 1.8 : kind === "jelly" ? 0.32 : kind === "nightDrive" ? 0.75 : kind === "readingRoom" ? 0.62 : kind === "lantern" || kind === "trainCarriage" ? 0.65 : 1.4)));
        if (kind === "quietMachine") {
          if (active.current) machineZoomTime += dt * Math.max(0, Math.min(1, (focus - 0.72) / 0.24));
          else if (!active.current && focus < 0.001) machineZoomTime = 0;
        }
        if (kind === "deepPassage" && !active.current && focus < 0.001) focus = 0;
        if (kind === "deepPassage") deepPassageTime += dt * focus;
        if (kind === "stars" || kind === "drift")
          advanceDepth(particles, dt, focus, kind === "stars" ? 0.09 : 0.045);
        if (kind === "drift")
          for (const point of particles)
            point.y = (point.y - dt * point.s * 0.005 * (1 - focus) + 1) % 1;
      } else if (reduced || kind === "morningLattice") {
        focus = active.current ? 1 : 0;
      }
      dirty.current = false;
      ctx.save();
      if (kind === "lantern" || kind === "trainCarriage") {
        // Move into the window, centered at 43% of the carriage height.
        // Overscan keeps its rounded corners and frame outside the viewport.
        const scale = 1 + focus * 0.78;
        ctx.translate(w * 0.5, h * (0.43 + focus * 0.07));
        ctx.scale(scale, scale);
        ctx.translate(-w * 0.5, -h * 0.43);
      }
      if (kind === "orbitStudy") paintOrbitStudy({ ctx, w, h, t, particles, orbit, reducedMotion: reduced });
      else if (kind === "quietMachine") paintQuietMachine({ ctx, w, h, t: machineTime, zoomTime: machineZoomTime, particles, focus, reducedMotion: reduced });
      else if (kind === "deepPassage") paintDeepPassage({ ctx, w, h, t: deepPassageTime, particles, focus, reducedMotion: reduced });
      else painters[kind]({ ctx, w, h, t, particles, focus, reducedMotion: reduced });
      ctx.restore();
      // Deep Blue draws its guide inside the water, sharing the camera depth.
      if (kind !== "morningLattice" && kind !== "jelly" && kind !== "quietMachine" && kind !== "nightDrive" && kind !== "readingRoom" && kind !== "deepPassage" && kind !== "focusComingSoon") paintFollowLight(ctx, kind, w, h, t, focus, reduced);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribeImages?.();
      orbitTween?.kill();
      toggleOrbit.current = null;
      media.removeEventListener("change", sync);
    };
  }, [kind, engine]);
  return <canvas ref={canvas} className="scene-canvas" aria-hidden="true" />;
}
