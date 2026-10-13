"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

// One floating hint layer avoids clipping inside the scrollable sound board.
export default function ButtonHints() {
  const id = useId();
  const [hint, setHint] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active: HTMLElement | null = null;
    let describedBy: string | null = null;
    const clear = () => {
      clearTimeout(timer);
      if (active) {
        if (describedBy === null) active.removeAttribute("aria-describedby");
        else active.setAttribute("aria-describedby", describedBy);
      }
      active = null;
      setHint(null);
    };
    const show = (target: EventTarget | null, immediate: boolean) => {
      if (!(target instanceof Element)) return;
      if (target.closest("[data-button-hint]")) { clearTimeout(timer); return; }
      const button = target.closest<HTMLElement>("button[aria-label], [data-tooltip]");
      if (button === active) return;
      clear();
      if (!button || button.matches(":disabled") || button.closest("[inert]")) return;
      const text = button.dataset.tooltip ?? button.getAttribute("aria-label");
      if (!text) return;
      active = button;
      describedBy = button.getAttribute("aria-describedby");
      timer = setTimeout(() => {
        if (!button.isConnected) { clear(); return; }
        const rect = button.getBoundingClientRect();
        const below = rect.top < 70;
        button.setAttribute("aria-describedby", [describedBy, id].filter(Boolean).join(" "));
        const inset = Math.min(140, window.innerWidth / 2);
        setHint({ text, x: Math.max(inset, Math.min(window.innerWidth - inset, rect.left + rect.width / 2)), y: below ? rect.bottom + 10 : rect.top - 10, below });
      }, immediate ? 0 : 450);
    };
    const over = (event: PointerEvent) => { if (event.pointerType === "mouse") show(event.target, false); };
    const out = (event: PointerEvent) => {
      if (event.relatedTarget instanceof Element && (active?.contains(event.relatedTarget) || event.relatedTarget.closest("[data-button-hint]"))) return;
      clearTimeout(timer);
      timer = setTimeout(clear, 120);
    };
    const focus = (event: FocusEvent) => { if (event.target instanceof Element && event.target.matches(":focus-visible")) show(event.target, true); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") clear(); };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", clear);
    document.addEventListener("pointerdown", clear);
    document.addEventListener("keydown", key);
    document.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    return () => {
      clear();
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", clear);
      document.removeEventListener("pointerdown", clear);
      document.removeEventListener("keydown", key);
      document.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, [id]);

  return hint ? createPortal(
    <div id={id} role="tooltip" data-button-hint className="button-hint"
      style={{ left: hint.x, top: hint.y, transform: `translate(-50%, ${hint.below ? "0" : "-100%"})` }}>
      {hint.text}
    </div>, document.body,
  ) : null;
}
