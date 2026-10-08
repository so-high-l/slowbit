"use client";
import { useRef, useEffect } from "react";
import type { VisualId } from "@/lib/types";
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
import { paintMagneticField } from "./MagneticField";
import { glow } from "./drawing";
import { advanceDepth } from "./depth";
const painters = {
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
  ink: paintSlowInk,
  vinyl: paintLateNightRecord,
  nightSky: paintNightSky,
  thread: paintFlowingThread,
  ribbonTunnel: paintRibbonTunnel,
  magneticField: paintMagneticField,
};
export default function CanvasScene({
  kind,
  paused = false,
  exploring = false,
  motionScale = 1,
}: {
  kind: VisualId;
  paused?: boolean;
  exploring?: boolean;
  motionScale?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const isPaused = useRef(paused);
  const active = useRef(exploring);
  const dirty = useRef(true);
  const pace = useRef(motionScale);
  useEffect(() => { pace.current = motionScale; }, [motionScale]);
  useEffect(() => {
    isPaused.current = paused;
    dirty.current = true;
  }, [paused]);
  useEffect(() => {
    active.current = exploring;
    dirty.current = true;
  }, [exploring]);
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let w = 0,
      h = 0,
      frame = 0,
      t = 0,
      last = 0,
      focus = 0;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    const sync = () => {
      reduced = media.matches;
      dirty.current = true;
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
      if (now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.05) * pace.current;
      last = now;
      if (document.hidden) return;
      if (!dirty.current && (isPaused.current || reduced)) return;
      if (!isPaused.current && !reduced) {
        t += dt;
        focus += ((active.current ? 1 : 0) - focus) * Math.min(1, dt * 1.4);
        if (kind === "stars" || kind === "drift")
          advanceDepth(particles, dt, focus, kind === "stars" ? 0.09 : 0.045);
        if (kind === "drift")
          for (const point of particles)
            point.y = (point.y - dt * point.s * 0.005 * (1 - focus) + 1) % 1;
      } else if (reduced) {
        focus = active.current ? 1 : 0;
      }
      dirty.current = false;
      painters[kind]({ ctx, w, h, t, particles });
      if (
        focus > 0.005 &&
        (reduced || (kind !== "stars" && kind !== "drift"))
      ) {
        const x =
          w * (0.5 + Math.sin(t * 0.075) * (kind === "aurora" ? 0.18 : 0.09));
        const y = h * (0.43 + Math.sin(t * 0.11) * 0.1);
        const warm = kind === "embers";
        ctx.save();
        ctx.globalAlpha = focus;
        glow(ctx, x, y, 54, warm ? "#f2b96f20" : "#cde6d824");
        glow(ctx, x, y, 18, warm ? "#f6c38475" : "#dbeee777");
        ctx.fillStyle = warm ? "#f0cd9d" : "#d9e9df";
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + Math.sin(t * 0.5) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", sync);
    };
  }, [kind]);
  return <canvas ref={canvas} className="scene-canvas" aria-hidden="true" />;
}
