# Board on Cloudflare, frontend on Vercel

Vercel serves the static Next.js export. It does not deploy the Cloudflare Worker
or D1 database. The board needs both the backend below and a frontend rebuild.

The deployed API is `https://slowbit-board.elmahdanisouhail.workers.dev`.
The production D1 binding is configured in `wrangler.production.jsonc`.
Production Vercel builds use this URL by default through `next.config.ts`;
`NEXT_PUBLIC_BOARD_API_URL` can override it. Local previews stay same-origin.

For a new account or replacement backend:

1. Sign in and create the production database:

   ```sh
   npx wrangler login
   npx wrangler d1 create slowbit-board
   ```

2. Put the returned database ID in `wrangler.production.jsonc`. Keep
   `BOARD_ALLOWED_ORIGINS` set to the exact frontend origin. Additional origins
   can be comma-separated; do not use a wildcard.

3. Apply migrations and deploy the API-only Worker:

   ```sh
   npx wrangler d1 migrations apply slowbit-board --remote --config wrangler.production.jsonc
   npx wrangler deploy --config wrangler.production.jsonc
   ```

4. Set `NEXT_PUBLIC_BOARD_API_URL` in Vercel to the deployed Worker origin,
   e.g. `https://slowbit-board.YOUR-SUBDOMAIN.workers.dev` (no `/api/board` suffix).
   Redeploy the frontend: this public variable is embedded at build time.

5. Check `<Worker origin>/api/board/messages` returns JSON with `messages`, then
   confirm the live frontend can load the board and complete a note submission.

Do not use the local placeholder in `wrangler.json` for production. Local
preview continues using its own database and same-origin `/api/board` requests.
The board uses anonymous tokens, not cookies or accounts. CORS limits browser
origins; it is not authentication against non-browser clients.
