# Offscript

A relaxation app for developers with immersive ambient scenes, a personal sound mix, and an optional anonymous message board. Built with Next.js, React, TypeScript, Tailwind, GSAP, Canvas, Web Audio, and a small Cloudflare Worker + D1 backend.

The relaxation experience and personal preferences remain local-first. Only notes explicitly submitted after a session go to the shared board. No application accounts, profiles, analytics, cookies, or remote audio/media are required.

## Run the complete app

Use Node.js 22.18+.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Development starts Next.js and the board Worker together, applies local migrations, and proxies `/api/board/*` to the Worker. On the first run it also creates the static assets needed by Wrangler. The default watcher uses polling for restricted desktop environments.

For the optimized production preview:

```sh
npm run build
npm run db:migrate:local
npm run preview
```

Open http://localhost:4173. Local D1 data persists under `.wrangler/state/` and is shared across browsers using this preview. It is separate from any deployed database. Do not serve `out/` with a plain static server: the message board requires the Worker.

## Check

```sh
npm test
npm run typecheck
npm run build
```

Tests cover preference validation, recommendation filtering, anonymous submission and retries, cross-origin rejection, expired tokens, Unicode limits, and database failure responses. Board integration tests run the actual generated SQL and Worker handler against SQLite.

## Features

- Five moods, weighted local recommendations, and 5/10/15-minute or untimed sessions.
- Fullscreen invitation with a windowed fallback.
- Five independent Canvas scenes: rain, aurora, stars, embers, and floating particles.
- Seven synthesized ambient tracks, including a soft musical drone, independent/master volumes, mute, pause, and fades.
- Compact glass controls, GSAP transitions, keyboard navigation, and reduced-motion support.
- Scene-specific sound presets on every scene change, editable track levels, and a Reset preset action.
- Optional Z mode: endlessly recycled depth movement for stars/particles, a softly moving light for rain/aurora/embers. The same control is available by touch, pauses with the session, and becomes a still point when reduced motion is enabled.
- Favorites, hidden-scene filtering/restoration, and locally persisted preferences.
- Optional 280-character anonymous note after each session; drafts survive posting errors.
- Opt-in centered board showing the latest seven notes, with older notes fading toward the top and the newest note at the bottom. Off by default; the visibility choice persists locally. Notes are fetched only when the board is opened, manually refreshed, or a note is submitted while it is open.

Shortcuts: F fullscreen, Space pause/resume, M mute, left/right change scenes, Z toggles gentle focus. Input controls retain their normal keyboard behavior.

## Source map

- `src/app/`: landing/setup, session, favorites, settings.
- `src/components/visuals/`: independent Canvas scene painters.
- `src/components/board/`: anonymous composer and opt-in board.
- `src/lib/audio.ts`: procedural stereo audio loops and gain graph.
- `src/hooks/`: preferences, audio, fullscreen, timer lifecycle.
- `src/worker/`: board API and D1 boundary.
- `db/schema.ts`, `drizzle/`: schema and generated migrations.
- `scripts/build-worker.mjs`: packages the Next static client with the Worker.

Browser preferences are behind `usePreferences()` under `relax_dev_preferences`. New sessions apply scene sound presets; reloading `/session/` keeps the current mix. Session progress is not persisted.

## Anonymous board data

Published rows contain note text, creation time, and a random note ID. There are no author names, profiles, IP addresses, or device fingerprints in the application database. A separate short-lived random token is hashed on the server for one-note-per-token submission and safe retries; it is not shown to readers. Expired issuance records are removed. Hosting providers can still maintain their own ordinary infrastructure logs.

The API validates text length and request size, uses prepared SQL, rejects cross-origin writes, and limits token issuance globally to 60/minute without tracking visitors. Notes are rendered as plain React text. This is a minimal open-board implementation; it has no content review/reporting workflow and the global issuance cap is not comprehensive bot protection.

## Hosting

`.openai/hosting.json` retains the existing Site project ID and declares the logical `DB` D1 binding. `npm run build` emits `dist/server/index.js`, `dist/client/`, and migration metadata. The Sites publishing workflow provisions the real database and applies migrations. `wrangler.json` uses an explicitly local database identifier; do not use it for direct production deployment without connecting a real D1 database.

Production publishing has not yet been verified. The local preview is fully functional, including shared persistence on this machine. Cross-device listening and Safari/iOS fullscreen behavior also need validation before public launch.

## Audio and motion

Ambient sounds are synthesized locally rather than field recordings. The Canvas engine caps device pixel ratio at 1.75 and animation around 30 fps, stops drawing in hidden tabs, freezes when paused, and respects `prefers-reduced-motion`. Fullscreen support depends on the browser/device.
