"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Heart, Settings2, Volume2, VolumeX } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import { analytics } from "@/lib/analytics";

export default function SiteHeader() {
  const path = usePathname();
  const { preferences, update } = usePreferences();
  const mode = preferences.mode ?? "unwind";
  const toggleMute = () => {
    analytics.muteChanged(mode, !preferences.muted);
    update({ muted: !preferences.muted });
  };

  return (
    <header className="app-navbar">
      <Link href="/" className="app-navbar-brand" aria-label="Slowbit home">slowbit.</Link>
      <nav aria-label="Main navigation">
        <button type="button" aria-label={preferences.muted ? "Unmute Slowbit" : "Mute Slowbit"} title={preferences.muted ? "Unmute" : "Mute"} onClick={toggleMute}>
          {preferences.muted ? <VolumeX size={21} strokeWidth={1.4} /> : <Volume2 size={21} strokeWidth={1.4} />}
        </button>
        <Link href="/favorites/" aria-label="Saved spaces" title="Saved spaces" className={path === "/favorites" ? "active" : undefined}>
          <Heart size={20} strokeWidth={1.4} />
        </Link>
        <Link href="/settings/" aria-label="Settings" title="Settings" className={path === "/settings" ? "active" : undefined}>
          <Settings2 size={22} strokeWidth={1.4} />
        </Link>
        <a href="https://github.com/so-high-l/slowbit" target="_blank" rel="noopener noreferrer" aria-label="Slowbit on GitHub (opens in a new tab)" title="View on GitHub">
          <Github size={22} strokeWidth={1.4} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
