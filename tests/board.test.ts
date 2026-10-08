import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../src/worker/index.ts";
import { validateMessage } from "../src/lib/board.ts";
import type { Bindings, Statement } from "../src/worker/database.ts";
function setup() {
  const sqlite = new DatabaseSync(":memory:");
  for (const filename of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync(`drizzle/${filename}`, "utf8"));
  const env: Bindings = {
    DB: {
      prepare(sql) {
        const statement = sqlite.prepare(sql);
        let params: (string | number | null)[] = [];
        const wrapped: Statement = {
          bind(...values) {
            params = values;
            return wrapped;
          },
          async first<T>() {
            return (statement.get(...params) ?? null) as T | null;
          },
          async all<T>() {
            return { results: statement.all(...params) as T[] };
          },
          async run() {
            return statement.run(...params);
          },
        };
        return wrapped;
      },
    },
    ASSETS: {
      async fetch() {
        return new Response("asset");
      },
    },
  };
  const request = (
    path: string,
    body?: unknown,
    origin = "https://slowbit.test",
  ) =>
    worker.fetch(
      new Request(
        `https://slowbit.test/api/board${path}`,
        body === undefined
          ? {}
          : {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: origin },
            body: JSON.stringify(body),
          },
      ),
      env,
    );
  return { sqlite, env, request };
}
test("anonymous notes persist across independent readers and retries do not duplicate them", async () => {
  const { request, sqlite } = setup();
  try {
    const issued = await request("/session", {});
    assert.equal(issued.status, 201);
    const { token } = (await issued.json()) as { token: string };
    const first = await request("/messages", {
      token,
      body: "The bug can wait. You did enough today.",
    });
    assert.equal(first.status, 201);
    const second = await request("/messages", {
      token,
      body: "The bug can wait. You did enough today.",
    });
    assert.equal(second.status, 200);
    const listing = await request("/messages");
    const { messages } = (await listing.json()) as {
      messages: Record<string, unknown>[];
    };
    assert.equal(messages.length, 1);
    assert.deepEqual(Object.keys(messages[0]).sort(), [
      "body",
      "createdAt",
      "id",
    ]);
    assert.equal(messages[0].body, "The bug can wait. You did enough today.");
  } finally {
    sqlite.close();
  }
});
test("unauthorized, cross-origin, malformed, and overlong notes are rejected without writes", async () => {
  const { request, sqlite } = setup();
  try {
    assert.equal(
      (await request("/messages", { token: "missing", body: "Hello" })).status,
      401,
    );
    assert.equal(
      (await request("/session", {}, "https://another.test")).status,
      403,
    );
    assert.equal(
      (await request("/messages", { body: "x".repeat(281) })).status,
      400,
    );
    assert.equal((await request("/messages", { body: "   " })).status, 400);
    const { messages } = (await (await request("/messages")).json()) as {
      messages: unknown[];
    };
    assert.equal(messages.length, 0);
  } finally {
    sqlite.close();
  }
});
test("expired anonymous session tokens cannot post", async () => {
  const { request, sqlite } = setup();
  try {
    const { token } = (await (await request("/session", {})).json()) as {
      token: string;
    };
    sqlite.exec("UPDATE board_sessions SET expires_at=0");
    assert.equal(
      (await request("/messages", { token, body: "A small note" })).status,
      401,
    );
  } finally {
    sqlite.close();
  }
});
test("Unicode character limit and text-only content remain predictable", () => {
  assert.equal(validateMessage("  hello\r\nworld  "), "hello\nworld");
  assert.equal(validateMessage("🌱".repeat(280)).length, 560);
  assert.throws(() => validateMessage("🌱".repeat(281)));
  assert.throws(() => validateMessage("\u202Ereversed"));
  assert.equal(
    validateMessage("<script>alert(1)</script>"),
    "<script>alert(1)</script>",
  );
});
test("database failure returns a recoverable response", async () => {
  const response = await worker.fetch(
    new Request("https://slowbit.test/api/board/messages"),
    {
      ASSETS: {
        async fetch() {
          return new Response();
        },
      },
    },
  );
  assert.equal(response.status, 503);
  assert.match(
    ((await response.json()) as { error: string }).error,
    /try again/,
  );
});

test("Vercel frontend can preflight, submit, and read from the separate Worker", async () => {
  const { env, sqlite } = setup();
  env.BOARD_ALLOWED_ORIGINS = "https://slowbit.vercel.app";
  const origin = "https://slowbit.vercel.app";
  const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request(
    `https://slowbit-board.example.workers.dev/api/board${path}`, {
      ...init, headers: { Origin: origin, "Sec-Fetch-Site": "cross-site", ...init.headers },
    }), env);
  try {
    const preflight = await call("/session", { method: "OPTIONS", headers: {
      "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type",
    } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
    const session = await call("/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(session.status, 201);
    const { token } = await session.json() as { token: string };
    const posted = await call("/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, body: "A quieter moment." }) });
    assert.equal(posted.status, 201);
    assert.equal(posted.headers.get("Access-Control-Allow-Origin"), origin);
    const listed = await call("/messages");
    assert.equal((await listed.json() as { messages: unknown[] }).messages.length, 1);
    const denied = await call("/session", { method: "POST", headers: { Origin: "https://attacker.test" }, body: "{}" });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);
    delete env.DB;
    const failure = await call("/messages");
    assert.equal(failure.status, 503);
    assert.equal(failure.headers.get("Access-Control-Allow-Origin"), origin);
  } finally { sqlite.close(); }
});
