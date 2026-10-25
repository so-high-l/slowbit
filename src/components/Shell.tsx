import Link from "next/link";
import { AudioLines } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

export function Logo() {
  return (
    <Link className="brand" href="/" aria-label="Slowbit home">
      <AudioLines size={25} strokeWidth={1.5} />
      <span>slowbit<span className="brand-period">.</span></span>
    </Link>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <SiteHeader />
      {children}
      <footer className="site-footer">
        <span>A little space between you and your screen.</span>
        <span className="site-footer-links"><Link href="/credits/">Music Credits</Link><span aria-hidden="true">·</span><Link href="/privacy/">Privacy</Link><span aria-hidden="true">·</span><span>No accounts. No noise. Just you.</span></span>
      </footer>
    </div>
  );
}
