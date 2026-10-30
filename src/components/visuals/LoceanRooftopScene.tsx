"use client";

import { useEffect, useRef, useState } from "react";

const mediaRoot = "/videos/locean-rooftop";

export default function LoceanRooftopScene({
  paused = false,
  onReady,
}: {
  paused?: boolean;
  onReady?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [hidden, setHidden] = useState(false);
  const [posterSettled, setPosterSettled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

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

  const shouldPlay = reducedMotion === false && !paused && !hidden;
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!shouldPlay) {
      element.pause();
      return;
    }
    void element.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "NotSupportedError") setVideoFailed(true);
    });
  }, [shouldPlay, videoReady]);

  useEffect(() => {
    if (videoReady || (posterSettled && (videoFailed || reducedMotion === true))) onReady?.();
  }, [onReady, posterSettled, reducedMotion, videoFailed, videoReady]);

  useEffect(() => {
    const timeout = window.setTimeout(() => onReady?.(), 15000);
    return () => window.clearTimeout(timeout);
  }, [onReady]);

  return (
    <div className="locean-rooftop-scene" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="locean-rooftop-media"
        src={`${mediaRoot}/poster.jpg`}
        alt=""
        onLoad={() => setPosterSettled(true)}
        onError={() => setPosterSettled(true)}
      />
      {reducedMotion !== true && !videoFailed && (
        <video
          ref={video}
          className="locean-rooftop-media locean-rooftop-video"
          data-ready={videoReady}
          muted
          loop
          playsInline
          preload="auto"
          poster={`${mediaRoot}/poster.jpg`}
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        >
          <source src={`${mediaRoot}/locean-rooftop-loop.webm`} type="video/webm" />
          <source src={`${mediaRoot}/locean-rooftop-loop.mp4`} type="video/mp4" />
        </video>
      )}
      <div className="locean-rooftop-shade" />
    </div>
  );
}
