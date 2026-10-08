import { database, type Bindings } from "./database.ts";
import { validateMessage, type BoardMessage } from "../lib/board.ts";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });
async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return [...new Uint8Array(digest)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
async function readBody(request: Request) {
  if (
    !request.headers
      .get("Content-Type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new Error("Send your note as JSON.");
  // Bound streamed bodies, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new Error("The request is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new Error("That note is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error("That note could not be read.");
  }
}
async function handleBoard(request: Request, env: Bindings): Promise<Response> {
  const url = new URL(request.url);
  const route = url.pathname.replace(/\/+$/, "");
  if (!route.startsWith("/api/board")) return env.ASSETS?.fetch(request) ?? json({ error: "Not found." }, 404);
  if (!["/api/board/messages", "/api/board/session"].includes(route))
    return json({ error: "Not found." }, 404);
  if (request.method !== "GET" && request.method !== "POST")
    return json({ error: "Method not allowed." }, 405);
  try {
    const db = database(env);
    const now = Date.now();
    if (route === "/api/board/session") {
      if (request.method !== "POST")
        return json({ error: "Method not allowed." }, 405);
      const token = crypto.randomUUID() + crypto.randomUUID();
      const hash = await tokenHash(token);
      // A small global issuance cap limits floods without collecting IPs or fingerprints.
      const issued = await db
        .prepare(
          "INSERT INTO board_sessions (token_hash,created_at,expires_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM board_sessions WHERE created_at>?)<60 RETURNING token_hash",
        )
        .bind(hash, now, now + 24 * 60 * 60 * 1000, now - 60000)
        .first();
      if (!issued)
        return json(
          { error: "The board is busy. Try again in a minute." },
          429,
        );
      await db
        .prepare("DELETE FROM board_sessions WHERE expires_at<?")
        .bind(now)
        .run();
      return json({ token }, 201);
    }
    if (request.method === "GET") {
      const { results } = await db
        .prepare(
          "SELECT id,body,created_at AS createdAt FROM board_messages ORDER BY created_at DESC,id DESC LIMIT 7",
        )
        .all<BoardMessage>();
      return json({ messages: results });
    }
    let payload: Record<string, unknown>;
    let body: string;
    try {
      payload = await readBody(request);
      body = validateMessage(payload?.body);
    } catch (error) {
      return json({ error: (error as Error).message }, 400);
    }
    const token = payload.token;
    if (typeof token !== "string" || token.length !== 72)
      return json(
        { error: "Please start a session before leaving a note." },
        401,
      );
    const hash = await tokenHash(token);
    // A unique submission key makes retries safe and permits one note per session.
    const existing = await db
      .prepare(
        "SELECT id,body,created_at AS createdAt FROM board_messages WHERE submission_key=?",
      )
      .bind(hash)
      .first<BoardMessage>();
    if (existing) return json({ message: existing });
    const session = await db
      .prepare(
        "SELECT token_hash FROM board_sessions WHERE token_hash=? AND expires_at>=?",
      )
      .bind(hash, now)
      .first();
    if (!session)
      return json(
        {
          error:
            "This session has expired. Start another when you are ready.",
        },
        401,
      );
    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO board_messages (id,body,created_at,submission_key) VALUES (?,?,?,?) ON CONFLICT(submission_key) DO NOTHING",
      )
      .bind(id, body, now, hash)
      .run();
    const message = await db
      .prepare(
        "SELECT id,body,created_at AS createdAt FROM board_messages WHERE submission_key=?",
      )
      .bind(hash)
      .first<BoardMessage>();
    return json({ message }, 201);
  } catch (error) {
    console.error(
      "Board request failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return json(
      {
        error:
          "The board is unavailable right now. Your note has not been lost; please try again.",
      },
      503,
    );
  }
}

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.BOARD_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean);
    const allowed = !!origin && (origin === url.origin || allowedOrigins.includes(origin));
    if (!url.pathname.startsWith("/api/board")) return handleBoard(request, env);
    // Only explicit frontend origins may access the separately hosted board.
    if ((origin && !allowed) || (!origin && request.headers.get("Sec-Fetch-Site") === "cross-site"))
      return json({ error: "Please post from slowbit." }, 403);
    const corsHeaders: Record<string, string> = { ...headers, Vary: "Origin" };
    if (allowed) corsHeaders["Access-Control-Allow-Origin"] = origin!;
    if (request.method === "OPTIONS") {
      if (!allowed) return json({ error: "Origin required." }, 403);
      const method = request.headers.get("Access-Control-Request-Method");
      const requestedHeaders = (request.headers.get("Access-Control-Request-Headers") ?? "")
        .split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
      if (!method || !["GET", "POST"].includes(method) || requestedHeaders.some(value => value !== "content-type"))
        return new Response(null, { status: 403, headers: corsHeaders });
      return new Response(null, { status: 204, headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
      } });
    }
    const response = await handleBoard(request, env);
    for (const [key, value] of Object.entries(corsHeaders)) response.headers.set(key, value);
    return response;
  },
};
