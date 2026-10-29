"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import CanvasScene from "./CanvasScene";
import GrainientScene from "./GrainientScene";
import JapaneseCafeScene from "./JapaneseCafeScene";
import type { VisualId } from "@/lib/types";
export default function VisualRenderer({
  visualId,
  paused = false,
  exploring = false,
  motionScale = 1,
  nightProgress = 0,
}: {
  visualId: VisualId;
  paused?: boolean;
  exploring?: boolean;
  motionScale?: number;
  nightProgress?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tween = gsap.fromTo(
      root.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0.01
          : 1.8,
        ease: "power2.out",
      },
    );
    return () => {
      tween.kill();
    };
  }, [visualId]);
  return (
    <div className="visual-layer" ref={root} data-visual={visualId}>
      {visualId === "japaneseCafe" ? (
        <JapaneseCafeScene paused={paused} exploring={exploring} />
      ) : visualId === "chromaticDrift" ? (
        <GrainientScene paused={paused} immersive={exploring} motionScale={motionScale} />
      ) : (
        <CanvasScene kind={visualId} paused={paused} exploring={exploring} motionScale={motionScale} />
      )}
      {(visualId === "lantern" || visualId === "trainCarriage") && <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "#020611",
        opacity: 0.68 * Math.min(1, Math.max(0, nightProgress)),
        transition: "opacity 200ms linear",
      }} />}
      {visualId !== "chromaticDrift" && <div className="scene-vignette" />}
    </div>
  );
}
