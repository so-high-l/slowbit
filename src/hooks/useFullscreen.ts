"use client";
import { useEffect, useState, useCallback } from "react";
export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        setMessage(
          "Fullscreen is unavailable here. You can still relax in this window.",
        );
    } catch {
      setMessage(
        "Fullscreen is unavailable here. You can still relax in this window.",
      );
    }
  }, []);
  return { fullscreen, message, toggle };
}
