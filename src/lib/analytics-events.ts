import type { Mood, Visual } from "./types";
export type AnalyticsScene = Pick<Visual, "id" | "name">;
export interface ProductEvents {
  session_started: { duration_minutes: number | null; mood: Mood; initial_scene_id: Visual["id"] };
  scene_selected: { scene_id: Visual["id"]; scene_name: string };
  session_completed: { duration_minutes: number | null; mood: Mood; final_scene_id: Visual["id"]; completed_naturally: true };
  scene_favorited: { scene_id: Visual["id"]; scene_name: string };
  scene_hidden: { scene_id: Visual["id"]; scene_name: string };
}
export type ProductCapture = <E extends keyof ProductEvents>(event: E, properties: ProductEvents[E]) => void;
export const allowedEvents = new Set(["$pageview", "session_started", "scene_selected", "session_completed", "scene_favorited", "scene_hidden"]);

// Lives for one mounted session, not one render. An extension after a finished
// timer is a new session; resuming an early finish continues the original one.
export function createSessionAnalytics(capture: ProductCapture) {
  let started = false;
  let completed = false;
  let duration: number | null = null;
  let mood: Mood | null = null;
  return {
    start(minutes: number | null, sessionMood: Mood, scene: AnalyticsScene) {
      if (started) return;
      started = true;
      duration = minutes;
      mood = sessionMood;
      capture("session_started", { duration_minutes: minutes, mood: sessionMood, initial_scene_id: scene.id });
    },
    complete(scene: AnalyticsScene) {
      if (!started || completed || duration === null) return;
      completed = true;
      capture("session_completed", { duration_minutes: duration, mood: mood!, final_scene_id: scene.id, completed_naturally: true });
    },
    extend() {
      if (completed) { started = false; completed = false; }
    },
  };
}
