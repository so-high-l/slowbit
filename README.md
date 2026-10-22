# Slowbit

**A little space to focus, unwind, and slow down.**

Slowbit is a free, open-source web app that combines immersive visual environments with customizable soundscapes to help you focus on your work or take a mindful break.

No accounts. No distractions. Just pick a scene, adjust the sounds, and settle in.

**[Try Slowbit →](https://slowbit.vercel.app)**

## Why Slowbit?

Slowbit started with a simple idea: developers spend hours staring at screens, but taking a break or getting into a focused state shouldn't require another complicated app.

What began as a collection of relaxing visual experiences has grown into two complementary modes:

- **Focus** — Longer sessions with calming music, ambient soundscapes, and minimal visual distractions.
- **Unwind** — Short 5, 10, or 15-minute breaks designed to help you disconnect.

The goal isn't to optimize every minute of your day. It's to make a little room to breathe.

## Features

- **Immersive scenes:** Animated Canvas environments, illustrated spaces, and generative visuals.
- **Custom soundscapes:** Layer ambient sounds like rain, wind, fire, and nature recordings.
- **Focus music:** Curated playlists with smooth crossfading and lazy loading.
- **Flexible sessions:** Short breaks, longer focus sessions, or no timer.
- **Immersive mode:** Additional scene-specific visual effects.
- **Personal preferences:** Favorite scenes, hide scenes, and save individual sound mixes locally.
- **Anonymous message board:** Leave a thought for another visitor, without creating an account.
- **Privacy-conscious analytics:** Optional, consent-based product analytics.

## Built With

Slowbit is built with **Next.js, React, TypeScript, Tailwind CSS, GSAP, Canvas 2D, and Web Audio**.

The application uses:

| Technology | Responsibility |
|---|---|
| Next.js + TypeScript | Application architecture and interface |
| Canvas 2D / WebGL | Animated and generative scenes |
| Web Audio API | Sound mixing, playback and music transitions |
| GSAP | UI transitions and animations |
| Cloudflare R2 | Media asset storage and delivery |
| Cloudflare Workers + D1 | Anonymous message board |
| PostHog | Consent-based product analytics |
| Vercel | Frontend hosting |

### Engineering highlights

Some of the technical challenges behind Slowbit include synchronizing animated scenes with session state, managing multiple audio layers, implementing seamless music transitions, keeping media loading efficient, and persisting preferences without user accounts.

The project emphasizes lightweight interactions, reusable scene architecture, and a distraction-free experience.

## Getting Started

**Requirements:** Node.js 22.18+ and npm.

Clone the repository and install dependencies:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Local development starts Next.js and the board Worker, including local database migrations.

### Audio assets

Recorded media is served from Cloudflare R2.

Configure the public media base URL in your `.env` file:

```dotenv
NEXT_PUBLIC_ASSET_URL=https://your-public-bucket.r2.dev
```

Some soundscapes require the separately hosted audio assets. The bucket must allow the relevant development and production origins through CORS.

Audio and visual asset licensing is documented in [ASSET_LICENSES.md](ASSET_LICENSES.md).

### Build and test

```bash
npm run typecheck
npm test
npm run build
```

To preview the production build locally:

```bash
npm run db:migrate:local
npm run preview
```

Preview is available at `http://localhost:4173`.

## Project Documentation

- [Analytics](docs/analytics.md) — Event tracking, consent and product metrics.
- [Board deployment](docs/board-deployment.md) — Cloudflare Worker and D1 configuration.
- [Asset licenses](ASSET_LICENSES.md) — Audio and visual asset provenance.
- [Privacy Policy](https://slowbit.vercel.app/privacy) — How Slowbit handles visitor information.

## Contributing

Slowbit is open source, and contributions are welcome.

Whether it's a new scene, an accessibility improvement, a performance optimization, or a bug fix, feel free to open an issue or submit a pull request.

For larger changes, consider opening an issue first to discuss the approach.

Please run the existing tests before submitting changes, and include appropriate licensing information for any new media assets.

## License

The source code is licensed under [MIT](LICENSE).

**Branding, music, sound effects, and visual assets have separate usage rights** and are not automatically covered by the MIT license. See [ASSET_LICENSES.md](ASSET_LICENSES.md).

---

Made for people who need a moment to focus—or a moment away.