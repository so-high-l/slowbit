# Slowbit

A free cooldown space for developers. Close the code, choose a scene, and take a few minutes off.

- Fullscreen Canvas scenes, mood check-in, and adjustable ambient sound mixes.
- Sessions of 5, 10, or 15 minutes, or no timer.
- Favorites, hidden scenes, and preferences saved locally.
- Optional anonymous message board. No account required.

Built with Next.js, TypeScript, Tailwind CSS, GSAP, and Web Audio. The message board uses a Cloudflare Worker and D1; recorded audio is hosted on R2.

## Run locally

Requires **Node.js 22.18+**.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Development starts both Next.js and the board Worker, and applies local database migrations.

To build and preview:

```sh
npm run build
npm run db:migrate:local
npm run preview
```

Preview runs at [localhost:4173](http://localhost:4173).

## Audio

Set the public R2 base URL in `.env` before building:

```dotenv
NEXT_PUBLIC_ASSET_URL=https://your-public-bucket.r2.dev
```

The bucket should contain:

- `audio/mixkit-light-rain-looping-1249.wav`
- `audio/night-crickets.wav`

Allow the app's development and production origins in the bucket's CORS policy. Other sound layers are procedural; failed recording loads use a quiet fallback.

## Checks

```sh
npm run typecheck
npm test
```

## License

Source code is [MIT licensed](LICENSE). Branding and media are separate; see [asset licenses](ASSET_LICENSES.md).
