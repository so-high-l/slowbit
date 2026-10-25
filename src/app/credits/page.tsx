import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PageBackButton from "@/components/PageBackButton";
import MusicCreditsDirectory from "@/components/MusicCreditsDirectory";

export const metadata: Metadata = {
  title: "Music Credits — Slowbit",
  description: "Meet the artists whose music brings Slowbit's focus and unwind spaces to life.",
  alternates: { canonical: "/credits/" },
};

export default function MusicCreditsPage() {
  return (
    <Shell>
      <main className="content-page credits-page">
        <PageBackButton />
        <header className="page-heading">
          <span className="eyebrow">SLOWBIT · MUSIC CREDITS</span>
          <h1>Made with music.<br /><em>Made with care.</em></h1>
          <p>Meet the artists who bring Slowbit to life.</p>
        </header>
        <MusicCreditsDirectory />
      </main>
    </Shell>
  );
}
