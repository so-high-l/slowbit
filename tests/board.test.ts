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
    origin = "https://offscript.test",
  ) =>
    worker.fetch(
      new Request(
        `https://offscript.test/api/board${path}`,
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
    new Request("https://offscript.test/api/board/messages"),
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
