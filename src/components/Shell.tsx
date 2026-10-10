"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2, Heart, AudioLines, Github } from "lucide-react";
export function Logo() {
  return (
    <Link className="brand" href="/" aria-label="Slowbit home">
      <AudioLines size={25} strokeWidth={1.5} />
      <span>
        slowbit<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="shell">
      <header className="site-header">
        <Logo />
        <nav aria-label="Main navigation">
          <Link
            href="/favorites"
            className={path === "/favorites" ? "active" : ""}
          >
            <Heart size={16} /> <span>Saved spaces</span>
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className={path === "/settings" ? "active icon-link" : "icon-link"}
          >
            <Settings2 size={19} />
          </Link>
          <a
            href="https://github.com/so-high-l/slowbit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Slowbit on GitHub (opens in a new tab)"
            title="View on GitHub"
            className="icon-link"
          >
            <Github size={19} aria-hidden="true" />
          </a>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <span>A little space between you and your screen.</span>
        <span>No accounts. No noise. Just you.</span>
      </footer>
    </div>
  );
}
