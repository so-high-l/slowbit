import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedEvents, createSessionAnalytics, type ProductCapture } from "../src/lib/analytics-events.ts";
function tracker() {
  const events: { name: string; properties: unknown }[] = [];
  const capture: ProductCapture = (name, properties) => { events.push({ name, properties }); };
  return { events, session: createSessionAnalytics(capture) };
}
const scene = (id: "rain" | "ocean" | "nightSky" | "stars" | "ink") => ({ id, name: id });
test("renders, scene changes, and pause/resume do not inflate session starts", () => {
  const { session, events } = tracker();
  session.start(10, "fried", scene("rain"));
  session.start(10, "fried", scene("ocean"));
  session.extend(); // A manual early finish resumes the unfinished session.
  session.start(10, "fried", scene("ocean"));
  assert.equal(events.length, 1);
  session.complete(scene("ocean"));
  session.complete(scene("ocean"));
  assert.deepEqual(events[0], { name: "session_started", properties: { duration_minutes: 10, mood: "fried", initial_scene_id: "rain" } });
  assert.deepEqual(events[1], { name: "session_completed", properties: { duration_minutes: 10, mood: "fried", final_scene_id: "ocean", completed_naturally: true } });
  assert.equal(events.length, 2);
  session.extend();
  session.start(5, "chill", scene("nightSky"));
  session.complete(scene("stars"));
  assert.equal(events.length, 4);
  assert.equal((events[3].properties as { duration_minutes: number }).duration_minutes, 5);
});
test("untimed sessions and sessions that never started cannot complete naturally", () => {
  const { session, events } = tracker();
  session.complete(scene("rain"));
  session.start(null, "chill", scene("ink"));
  session.complete(scene("ink"));
  assert.deepEqual(events.map(event => event.name), ["session_started"]);
});
test("only the six requested events are allowed", () => {
  assert.equal(allowedEvents.size, 6);
  for (const event of ["$autocapture", "$snapshot", "$pageleave", "$exception", "session_ended_early"])
    assert.equal(allowedEvents.has(event), false);
});
