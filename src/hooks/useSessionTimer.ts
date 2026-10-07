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
  const last = useRef(0);
  const done = useRef(false);
  const callback = useRef(onEnd);
  useEffect(() => {
    callback.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (!running || left.current === null) return;
    last.current = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      left.current = Math.max(0, left.current! - (now - last.current) / 1000);
      last.current = now;
      setRemaining(Math.ceil(left.current));
      if (left.current <= 0 && !done.current) {
        done.current = true;
        callback.current();
      }
    }, 200);
    return () => clearInterval(tick);
  }, [running]);
  const reset = (minutes: number | null) => {
    done.current = false;
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
  return { remaining, reset, resumeOrExtend };
}
