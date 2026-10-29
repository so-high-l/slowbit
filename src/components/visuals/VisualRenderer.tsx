"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import CanvasScene from "./CanvasScene";
import GrainientScene from "./GrainientScene";
import JapaneseCafeScene from "./JapaneseCafeScene";
import { sceneNeedsLoading } from "./scene-loading";
import type { VisualId } from "@/lib/types";

const loadingSteps = ["Loading visuals", "Loading sounds", "Making your mix"] as const;
const minimumLoadingTime = 1750;

type VisualRendererProps = {
  visualId: VisualId;
  paused?: boolean;
  exploring?: boolean;
  motionScale?: number;
  nightProgress?: number;
};

function SceneLoading({ hidden }: { hidden: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const sounds = window.setTimeout(() => setStage(1), 550);
    const mix = window.setTimeout(() => setStage(2), 1150);
    return () => {
      window.clearTimeout(sounds);
      window.clearTimeout(mix);
    };
  }, []);

  return (
    <div
      className="scene-loading"
      data-hidden={hidden}
      role="status"
      aria-live="polite"
      aria-label={loadingSteps[stage]}
    >
      <span className="scene-loading-mark" aria-hidden="true" />
      <div className="scene-loading-steps" aria-hidden="true">
        {loadingSteps.map((step, index) => (
          <div
            className="scene-loading-step"
            data-state={index < stage ? "complete" : index === stage ? "active" : "pending"}
            key={step}
          >
            <span className="scene-loading-indicator" />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VisualRenderer(props: VisualRendererProps) {
  return <VisualRendererScene key={props.visualId} {...props} />;
}

function VisualRendererScene({
  visualId,
  paused = false,
  exploring = false,
  motionScale = 1,
  nightProgress = 0,
}: VisualRendererProps) {
  const [assetsReady, setAssetsReady] = useState(false);
  const loadingStarted = useRef(Date.now());
  const revealTimer = useRef<number | null>(null);
  const needsLoading = sceneNeedsLoading(visualId);
  const ready = !needsLoading || assetsReady;
  const markReady = useCallback(() => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    const remaining = Math.max(0, minimumLoadingTime - (Date.now() - loadingStarted.current));
    revealTimer.current = window.setTimeout(() => setAssetsReady(true), remaining);
  }, []);

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  return (
    <div className="visual-layer" data-visual={visualId}>
      <div key={visualId} className="scene-render" data-ready={ready} aria-hidden={!ready}>
        {visualId === "japaneseCafe" ? (
          <JapaneseCafeScene paused={paused} exploring={exploring} onReady={markReady} />
        ) : visualId === "chromaticDrift" ? (
          <GrainientScene paused={paused} immersive={exploring} motionScale={motionScale} />
        ) : (
          <CanvasScene kind={visualId} paused={paused} exploring={exploring} motionScale={motionScale} onReady={needsLoading ? markReady : undefined} />
        )}
        {(visualId === "lantern" || visualId === "trainCarriage") && <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "#020611",
          opacity: 0.68 * Math.min(1, Math.max(0, nightProgress)),
          transition: "opacity 200ms linear",
        }} />}
        {visualId !== "chromaticDrift" && <div className="scene-vignette" />}
      </div>
      {needsLoading && <SceneLoading hidden={ready} />}
    </div>
  );
}
