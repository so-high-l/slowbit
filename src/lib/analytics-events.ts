import type { Mood, VisualId } from "./types";
export interface ProductEvents {
  session_started: { duration_minutes: number | null; mood: Mood; initial_scene: VisualId };
  scene_selected: { scene: VisualId };
  session_completed: { duration_minutes: number | null; final_scene: VisualId; completed_naturally: true };
  scene_favorited: { scene: VisualId };
  scene_hidden: { scene: VisualId };
}
export type ProductCapture = <E extends keyof ProductEvents>(event: E, properties: ProductEvents[E]) => void;
export const allowedEvents = new Set(["$pageview", "session_started", "scene_selected", "session_completed", "scene_favorited", "scene_hidden"]);

// Lives for one mounted session, not one render. An extension after a finished
// timer is a new session; resuming an early finish continues the original one.
export function createSessionAnalytics(capture: ProductCapture) {
  let started = false;
  let completed = false;
  let duration: number | null = null;
  return {
    start(minutes: number | null, mood: Mood, scene: VisualId) {
      if (started) return;
      started = true;
      duration = minutes;
      capture("session_started", { duration_minutes: minutes, mood, initial_scene: scene });
    },
    complete(scene: VisualId) {
      if (!started || completed || duration === null) return;
      completed = true;
      capture("session_completed", { duration_minutes: duration, final_scene: scene, completed_naturally: true });
    },
    extend() {
      if (completed) { started = false; completed = false; }
    },
  };
}
