"use client";
import { useEffect, useRef, useState } from "react";
export function useSessionTimer(
  duration: number | null,
  running: boolean,
  onEnd: () => void,
) {
  const [remaining, setRemaining] = useState<number | null>(
    duration === null ? null : duration * 60,
  );
  const left = useRef(remaining);
  const elapsed = useRef(0);
  const darkAfter = useRef((duration ?? 15) * 60);
  const [nightProgress, setNightProgress] = useState(0);
  const last = useRef(0);
  const done = useRef(false);
  const callback = useRef(onEnd);
  useEffect(() => {
    callback.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (!running) return;
    last.current = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      const delta = document.visibilityState === "visible" && document.hasFocus()
        ? Math.min(1, (now - last.current) / 1000)
        : 0;
      last.current = now;
      elapsed.current += delta;
      setNightProgress(Math.min(1, elapsed.current / Math.max(1, darkAfter.current)));
      if (left.current !== null) left.current = Math.max(0, left.current - delta);
      setRemaining(left.current === null ? null : Math.ceil(left.current));
      if (left.current !== null && left.current <= 0 && !done.current) {
        done.current = true;
        callback.current();
      }
    }, 200);
    return () => clearInterval(tick);
  }, [running]);
  const reset = (minutes: number | null) => {
    done.current = false;
    elapsed.current = 0;
    darkAfter.current = (minutes ?? 15) * 60;
    setNightProgress(0);
    left.current = minutes === null ? null : minutes * 60;
    last.current = performance.now();
    setRemaining(left.current);
  };
  const resumeOrExtend = (minutes: number | null) => {
    done.current = false;
    if (left.current !== null && left.current <= 0)
      left.current = minutes === null ? null : minutes * 60;
    last.current = performance.now();
    setRemaining(left.current);
  };
  return { remaining, reset, resumeOrExtend, nightProgress };
}
