"use client";
import { useEffect, useState } from "react";
export default function SessionOpening({ lines, playing, onComplete }: { lines: string[]; playing: boolean; onComplete: () => void }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const timeout = setTimeout(() => {
      if (line >= lines.length - 1) onComplete();
      else setLine(value => value + 1);
    }, 4200);
    return () => clearTimeout(timeout);
  }, [line, lines.length, onComplete, playing]);
  return <div className="session-opening">
    <p className="opening-line" key={line} aria-live="polite">{lines[line]}</p>
    <button onClick={onComplete}>Go straight to the scene</button>
  </div>;
}
