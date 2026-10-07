"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import CanvasScene from "./CanvasScene";
import type { VisualId } from "@/lib/types";
export default function VisualRenderer({
  visualId,
  paused = false,
  exploring = false,
  motionScale = 1,
}: {
  visualId: VisualId;
  paused?: boolean;
  exploring?: boolean;
  motionScale?: number;
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
    <div className="visual-layer" ref={root}>
      <CanvasScene kind={visualId} paused={paused} exploring={exploring} motionScale={motionScale} />
      <div className="scene-vignette" />
    </div>
  );
}
