"use client";

import { useId, useState } from "react";
import { ChevronDown, ExternalLink, Music2 } from "lucide-react";
import { musicCredits, sceneMusicCredits, type MusicCredit, type SceneMusicCredit } from "@/lib/music-credits";

function ArtistCard({ credit, expanded, onToggle }: { credit: MusicCredit; expanded: boolean; onToggle: () => void }) {
  const panelId = useId();
  const scenes = [...new Set(credit.tracks.flatMap(track => track.scenes))];
  return (
    <article className={`artist-card${expanded ? " is-expanded" : ""}`}>
      <div className="artist-card-glow" aria-hidden="true" />
      <header>
        <span className="artist-card-mark" aria-hidden="true"><Music2 size={16} /></span>
        <h2>{credit.artist}</h2>
      </header>
      <div className="artist-card-meta">
        <span>Heard in</span>
        <div className="artist-card-scene-line">
          <p>{scenes.join(" · ")}</p>
          <strong>{credit.tracks.length === 1 ? "1 track" : `${credit.tracks.length} tracks`}</strong>
        </div>
      </div>
      <div className="artist-card-track-panel" id={panelId} aria-hidden={!expanded}>
        <div>
          <ul>{credit.tracks.map(track => <li key={`${track.title}-${track.scenes.join("-")}`}>{track.title}</li>)}</ul>
        </div>
      </div>
      <div className="artist-card-actions">
        <a href={credit.href} target="_blank" rel="noopener noreferrer">
          Visit artist <ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
          {expanded ? "Hide tracks" : "Show tracks"}<ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function SceneCard({ credit, expanded, onToggle }: { credit: SceneMusicCredit; expanded: boolean; onToggle: () => void }) {
  const panelId = useId();
  const artistCount = new Set(credit.tracks.map(track => track.artist)).size;
  return (
    <article className={`scene-credit-card${expanded ? " is-expanded" : ""}`}>
      <button type="button" className="scene-credit-toggle" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
        <span><strong>{credit.scene}</strong><small>{credit.tracks.length} {credit.tracks.length === 1 ? "track" : "tracks"} · {artistCount} {artistCount === 1 ? "artist" : "artists"}</small></span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      <div className="scene-credit-panel" id={panelId} aria-hidden={!expanded}>
        <div>
          <ul>{credit.tracks.map(track => (
            <li key={`${track.title}-${track.artist}`}>
              <span>{track.title}</span>
              <a href={track.href} target="_blank" rel="noopener noreferrer" tabIndex={expanded ? undefined : -1}>{track.artist}<ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
            </li>
          ))}</ul>
        </div>
      </div>
    </article>
  );
}

export default function MusicCreditsDirectory() {
  const [view, setView] = useState<"artist" | "scene">("artist");
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(() => new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(() => new Set());
  const activeExpanded = view === "artist" ? expandedArtists : expandedScenes;
  const activeKeys = view === "artist" ? musicCredits.map(credit => credit.artist) : sceneMusicCredits.map(credit => credit.scene);
  const allExpanded = activeKeys.length > 0 && activeKeys.every(key => activeExpanded.has(key));
  const noneExpanded = activeExpanded.size === 0;

  const toggle = (key: string) => {
    const update = (current: Set<string>) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    };
    if (view === "artist") setExpandedArtists(update); else setExpandedScenes(update);
  };

  const setAll = (expanded: boolean) => {
    const next = new Set(expanded ? activeKeys : []);
    if (view === "artist") setExpandedArtists(next); else setExpandedScenes(next);
  };

  return (
    <>
      <nav className="credits-view-controls" aria-label="Organize music credits">
        <div className="credits-view-tabs" role="group" aria-label="Credit view">
          <button type="button" aria-pressed={view === "artist"} onClick={() => setView("artist")}>By artist</button>
          <button type="button" aria-pressed={view === "scene"} onClick={() => setView("scene")}>By scene</button>
        </div>
        <div className="credits-expand-controls" aria-label={`Manage ${view} cards`}>
          <button type="button" disabled={allExpanded} onClick={() => setAll(true)}>Expand all</button>
          <span aria-hidden="true">·</span>
          <button type="button" disabled={noneExpanded} onClick={() => setAll(false)}>Collapse all</button>
        </div>
      </nav>
      {view === "artist" ? (
        <section className="credits-directory" aria-labelledby="credits-by-artist">
          <header><span className="eyebrow">BY ARTIST</span><h2 id="credits-by-artist">The people behind the atmosphere.</h2></header>
          <div className="artist-grid">{musicCredits.map(credit => <ArtistCard key={credit.artist} credit={credit} expanded={expandedArtists.has(credit.artist)} onToggle={() => toggle(credit.artist)} />)}</div>
        </section>
      ) : (
        <section className="credits-scenes" aria-labelledby="credits-by-scene">
          <header><span className="eyebrow">BY SCENE</span><h2 id="credits-by-scene">Find the music in every space.</h2></header>
          <div className="scene-credit-list">{sceneMusicCredits.map(credit => <SceneCard key={credit.scene} credit={credit} expanded={expandedScenes.has(credit.scene)} onToggle={() => toggle(credit.scene)} />)}</div>
        </section>
      )}
    </>
  );
}
