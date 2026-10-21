import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedEvents, createSessionAnalytics, type ProductCapture } from "../src/lib/analytics-events.ts";

function tracker() {
  const events: { name: string; properties: Record<string, unknown> }[] = [];
  const capture: ProductCapture = (name, properties) => { events.push({ name, properties }); };
  return { events, session: createSessionAnalytics(capture) };
}
const scene = (id: "rain" | "ocean" | "nightSky" | "stars" | "ink") => ({ id, name: id });

test("sessions emit one lifecycle with the public relax mode and active duration", () => {
  const { session, events } = tracker();
  session.start(10, "fried", scene("rain"), "unwind");
  session.start(10, "fried", scene("ocean"), "unwind");
  session.addActiveSeconds(42.4, scene("ocean"));
  session.complete(scene("ocean"));
  session.complete(scene("ocean"));
  assert.deepEqual(events.map(event => event.name), ["session_started", "session_ended", "session_timer_completed", "session_completed"]);
  assert.equal(events[0].properties.mode, "relax");
  assert.equal(events[0].properties.scene_id, "rain");
  assert.equal(events[0].properties.selected_duration, 10);
  assert.equal(typeof events[0].properties.session_id, "string");
  assert.equal(events[1].properties.active_duration_seconds, 42);
  assert.equal(events[1].properties.end_reason, "timer_completed");

  session.extend();
  session.start(5, "chill", scene("nightSky"), "unwind");
  assert.equal(events.filter(event => event.name === "session_started").length, 2);
});

test("untimed sessions end without claiming timer completion", () => {
  const { session, events } = tracker();
  session.complete(scene("rain"));
  session.start(null, "chill", scene("ink"), "unwind");
  session.complete(scene("ink"));
  assert.deepEqual(events.map(event => event.name), ["session_started", "session_ended"]);
});

test("relax and focus use different meaningful active-time milestones", () => {
  const relax = tracker();
  relax.session.start(null, "fried", scene("rain"), "unwind");
  relax.session.addActiveSeconds(301, scene("ocean"));
  assert.deepEqual(relax.events.map(event => event.name), ["session_started", "meaningful_session_3m", "meaningful_session_5m"]);

  const focus = tracker();
  focus.session.start(null, "fresh", scene("stars"), "focus", "lofi");
  focus.session.addActiveSeconds(2701, scene("stars"), "lofi");
  assert.deepEqual(focus.events.map(event => event.name), ["session_started", "focus_session_started", "focus_meaningful_session_10m", "focus_meaningful_session_25m", "focus_meaningful_session_45m"]);
});

test("the explicit product event allowlist still rejects automatic PostHog noise", () => {
  for (const event of ["app_visited", "mode_switched", "session_ended", "playlist_started", "focus_meaningful_session_45m"])
    assert.equal(allowedEvents.has(event), true);
  for (const event of ["$autocapture", "$snapshot", "$pageleave", "$exception", "session_ended_early"])
    assert.equal(allowedEvents.has(event), false);
});
