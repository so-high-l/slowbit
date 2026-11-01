import assert from "node:assert/strict";
import test from "node:test";
import { connectionStatusMessage } from "../src/hooks/useConnectionStatus.ts";

test("connection notices stay quiet online and explain recoverable offline audio", () => {
  assert.equal(connectionStatusMessage("online"), "");
  assert.equal(connectionStatusMessage("offline"), "Offline — loaded sounds will keep playing.");
  assert.equal(connectionStatusMessage("reconnecting"), "Back online — reconnecting sounds…");
});
