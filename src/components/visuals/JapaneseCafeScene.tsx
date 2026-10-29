"use client";

import { useEffect, useRef, useState } from "react";

const exteriorRoot = "/videos/japanese-corner-cafe";

export default function JapaneseCafeScene({
  paused = false,
  exploring = false,
  onReady,
}: {
  paused?: boolean;
  exploring?: boolean;
  onReady?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [settledAssets, setSettledAssets] = useState(0);
  const settled = useRef(new Set<string>());

  const markSettled = (asset: string) => {
    if (settled.current.has(asset)) return;
    settled.current.add(asset);
    setSettledAssets(settled.current.size);
  };

  useEffect(() => {
    if (settledAssets >= 2) onReady?.();
  }, [onReady, settledAssets]);

  useEffect(() => {
    const timeout = window.setTimeout(() => onReady?.(), 15000);
    return () => window.clearTimeout(timeout);
  }, [onReady]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncMotion();
    syncVisibility();
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  const animateExterior = exploring && !paused && !reducedMotion && !hidden;
  const animateInterior = !exploring && !paused && !reducedMotion && !hidden;
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let disposed = false;
    const syncPlayback = () => {
      if (!animateExterior) {
        element.pause();
        return;
      }
      void element.play().catch((error: unknown) => {
        if (!disposed && error instanceof DOMException && error.name === "NotSupportedError")
          setVideoFailed(true);
      });
    };
    element.addEventListener("loadeddata", syncPlayback);
    syncPlayback();
    return () => {
      disposed = true;
      element.removeEventListener("loadeddata", syncPlayback);
      element.pause();
    };
  }, [animateExterior]);

  return (
    <div className="japanese-cafe-scene" data-immersive={exploring} data-interior-moving={animateInterior} aria-hidden="true">
      <div className="japanese-cafe-layer japanese-cafe-interior">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="japanese-cafe-media"
          src="/images/japanese-cafe/interior-window.png"
          alt=""
          onLoad={() => markSettled("interior")}
          onError={() => markSettled("interior")}
        />
        <svg
          className="japanese-cafe-interior-life"
          viewBox="0 0 1672 941"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          <defs>
            <filter id="japanese-cafe-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id="japanese-cafe-steam-blur" x="-60%" y="-30%" width="220%" height="180%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <radialGradient id="japanese-cafe-lamp-glow">
              <stop offset="0" stopColor="#ffd49a" stopOpacity=".34" />
              <stop offset="1" stopColor="#ff9d4a" stopOpacity="0" />
            </radialGradient>
          </defs>




          <g className="japanese-cafe-city-lights" filter="url(#japanese-cafe-soft-glow)">
            <circle className="japanese-cafe-city-light light-a" cx="819" cy="357" r="7" />
            <circle className="japanese-cafe-city-light light-b" cx="1001" cy="372" r="6" />
            <circle className="japanese-cafe-city-light light-c" cx="1090" cy="516" r="7" />
            <circle className="japanese-cafe-city-light light-d" cx="780" cy="535" r="6" />
            <circle className="japanese-cafe-city-light light-e" cx="1263" cy="585" r="8" />
          </g>

          <circle className="japanese-cafe-lamp-breath" cx="1517" cy="99" r="146" fill="url(#japanese-cafe-lamp-glow)" />

          <g className="japanese-cafe-steam" filter="url(#japanese-cafe-steam-blur)">
            <path className="steam-one" d="M1104 749C1076 720 1127 696 1108 665S1119 611 1104 577" />
            <path className="steam-two" d="M1130 749C1154 716 1109 692 1132 658S1121 610 1138 574" />
            <path className="steam-three" d="M1117 744C1104 716 1145 690 1120 655S1141 615 1128 587" />
          </g>
        </svg>
      </div>
      <div className="japanese-cafe-layer japanese-cafe-exterior">
        {/* The poster keeps the transition complete before the video is ready. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="japanese-cafe-media"
          src={`${exteriorRoot}/poster.png`}
          alt=""
          onLoad={() => markSettled("exterior")}
          onError={() => markSettled("exterior")}
        />
        {exploring && !videoFailed && !reducedMotion && (
          <video
            ref={video}
            className="japanese-cafe-media"
            muted
            loop
            playsInline
            preload="metadata"
            poster={`${exteriorRoot}/poster.png`}
            onError={() => setVideoFailed(true)}
          >
            <source src={`${exteriorRoot}/japanese-corner-cafe-loop.webm`} type="video/webm" />
            <source src={`${exteriorRoot}/japanese-corner-cafe-loop.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="japanese-cafe-shade" />
    </div>
  );
}
