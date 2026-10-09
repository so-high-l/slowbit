import { test } from "node:test";
import assert from "node:assert/strict";
import { pondDropStarted } from "../src/lib/pond-timing.ts";
test("drops trigger only when a visible ripple starts", () => {
  assert.equal(pondDropStarted(0, 0.03), false);
  assert.equal(pondDropStarted(4.26, 4.28), true);
  assert.equal(pondDropStarted(4.28, 4.3), false);
  assert.equal(pondDropStarted(4.28, 4.28), false);
  assert.equal(pondDropStarted(8.79, 8.81), true);
});
