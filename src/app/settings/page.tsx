"use client";
import Link from "next/link";
import Shell from "@/components/Shell";
import { usePreferences } from "@/hooks/usePreferences";
import { durations, visuals } from "@/data/catalog";
export default function Settings() {
  const {
    preferences: p,
    ready,
    storageError,
    update,
    restoreVisual,
    setDuration,
  } = usePreferences();
  const hidden = visuals.filter((v) => p.hiddenVisuals.includes(v.id));
  return (
    <Shell>
      <main className="content-page settings-page">
        <div className="page-heading">
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>
            A few <em>little things.</em>
          </h1>
          <p>Your space, your pace.</p>
        </div>
        {!ready ? (
          <p>Loading your preferences…</p>
        ) : (
          <>
            {storageError && (
              <p className="storage-warning" role="status">
                This browser couldn’t save your preferences. You can still use
                everything during this visit.
              </p>
            )}
            <section className="settings-section">
              <h2>Your usual pause</h2>
              <p>
                A starting point for your next session. You can always change
                it.
              </p>
              <div className="duration-options">
                {durations.map((d) => (
                  <button
                    key={String(d)}
                    aria-pressed={p.defaultSessionDuration === d}
                    className={p.defaultSessionDuration === d ? "selected" : ""}
                    onClick={() => setDuration(d)}
                  >
                    {d === null ? "No timer" : `${d} min`}
                  </button>
                ))}
              </div>
            </section>
            <section className="settings-section">
              <h2>Sound, your way</h2>
              <div className="preference-row">
                <label htmlFor="default-master">
                  Master volume · {Math.round(p.globalVolume * 100)}%
                </label>
                <input
                  id="default-master"
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={p.globalVolume}
                  onChange={(e) =>
                    update({ globalVolume: Number(e.target.value) })
                  }
                />
              </div>
              <div className="preference-row">
                <span>Start with sound muted</span>
                <button
                  className="secondary-button"
                  role="switch"
                  aria-label="Start with sound muted"
                  aria-checked={p.muted}
                  onClick={() => update({ muted: !p.muted })}
                >
                  {p.muted ? "On" : "Off"}
                </button>
              </div>
            </section>
            <section className="settings-section">
              <h2>
                Hidden spaces <span className="muted">({hidden.length})</span>
              </h2>
              <p>
                These won’t appear in suggestions or scene rotation. Welcome
                them back whenever you like.
              </p>
              {hidden.length ? (
                hidden.map((v) => (
                  <div className="hidden-row" key={v.id}>
                    <span>{v.name}</span>
                    <button
                      className="secondary-button"
                      aria-label={`Restore ${v.name}`}
                      onClick={() => restoreVisual(v.id)}
                    >
                      Restore
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">Nothing hidden. Every space is open.</p>
              )}
            </section>
            <section className="settings-section">
              <h2>Find your way around</h2>
              <p>Replay the short guide to the controls on the session screen.</p>
              <Link className="secondary-button settings-tour-link" href="/session/?tour=1">
                Replay session guide
              </Link>
            </section>
            <section className="settings-section">
              <h2>A little connection</h2>
              <div className="preference-row">
                <span>View the anonymous message board</span>
                <button
                  className="secondary-button"
                  role="switch"
                  aria-label="View anonymous message board"
                  aria-checked={p.showBoard}
                  onClick={() => update({ showBoard: !p.showBoard })}
                >
                  {p.showBoard ? "On" : "Off"}
                </button>
              </div>
              <p>
                The board stays hidden until you choose to open it. Leaving a
                note after a session is always optional.
              </p>
            </section>
            <section className="settings-section">
              <h2>Small footprint. Private by default.</h2>
              <p>
                Your favorites, sound levels, and preferences stay in this
                browser. Clearing its site data will clear them. Only notes you
                choose to post are sent to the shared board, without names,
                profiles, or account identifiers.
              </p>
              <p>
                Motion follows your device’s reduced-motion preference. Sounds
                start only when you begin a session.
              </p>
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}
