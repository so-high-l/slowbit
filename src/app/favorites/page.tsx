"use client";
import { analytics } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import Shell from "@/components/Shell";
import { usePreferences } from "@/hooks/usePreferences";
import { visuals } from "@/data/catalog";
export default function Favorites() {
  const { preferences: p, ready, toggleFavorite, update } = usePreferences();
  const router = useRouter();
  const saved = visuals.filter((v) => p.favoriteVisuals.includes(v.id));
  return (
    <Shell>
      <main className="content-page">
        <div className="page-heading">
          <span className="eyebrow">FAMILIAR PLACES, OPEN DOORS</span>
          <h1>
            Your saved <em>spaces.</em>
          </h1>
          <p>Come back to whatever feels good.</p>
        </div>
        {!ready ? (
          <p>Finding your spaces…</p>
        ) : saved.length ? (
          <div className="saved-grid">
            {saved.map((v) => (
              <article key={v.id} className={`card-${v.id}`}>
                <button
                  className="saved-preview"
                  aria-label={`Start ${v.name}`}
                  onClick={() => {
                    analytics.sceneSelected(v);
                    update({
                      lastVisual: v.id,
                      hiddenVisuals: p.hiddenVisuals.filter(
                        (id) => id !== v.id,
                      ),
                    });
                    router.push("/session/");
                  }}
                >
                  <div className="card-art">
                    <div className="art-motif" />
                    <span className="saved-play">Enter this space</span>
                  </div>
                </button>
                <div className="saved-card-footer">
                  <div>
                    <h2>{v.name}</h2>
                    <p>
                      {p.hiddenVisuals.includes(v.id)
                        ? "Hidden from rotation · opening restores it"
                        : v.subtitle}
                    </p>
                  </div>
                  <button
                    className="icon-button is-favorite"
                    aria-label={`Remove ${v.name} from favorites`}
                    onClick={() => toggleFavorite(v.id)}
                  >
                    <Heart size={19} fill="currentColor" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Heart size={30} strokeWidth={1} />
            <h2>Keep a little quiet for later.</h2>
            <p>
              Tap the heart during a session to save a space here. There’s no
              rush to find your favorite.
            </p>
            <Link href="/" className="primary-button">
              Explore the spaces
            </Link>
          </div>
        )}
      </main>
    </Shell>
  );
}
