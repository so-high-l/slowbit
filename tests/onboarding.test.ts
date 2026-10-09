import { test } from "node:test";
import assert from "node:assert/strict";
import { SESSION_TOUR_ID, sessionTourSteps } from "../src/data/onboarding.ts";

test("session basics tour has stable targets and covers the session controls", () => {
    assert.equal(SESSION_TOUR_ID, "session-basics-v1");
    assert.deepEqual(sessionTourSteps.map((step) => step.target), [
        "scene-navigation",
        "playback",
        "audio",
        "mute",
        "chat",
        "favorite",
        "hide",
    ]);
    assert.equal(sessionTourSteps.length, 7);
    assert.equal(sessionTourSteps[2]?.title, "Make it yours");
});