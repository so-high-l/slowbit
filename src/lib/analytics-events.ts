import type { Mood, FocusMood, SessionMode, Visual } from "./types";
export type AnalyticsScene = Pick<Visual, "id" | "name">;
export interface ProductEvents {
  session_started: { duration_minutes: number | null; mood: Mood | FocusMood; mode?: SessionMode; initial_scene_id: Visual["id"] };
  scene_selected: { scene_id: Visual["id"]; scene_name: string; mode?: SessionMode };
  session_completed: { duration_minutes: number | null; mood: Mood | FocusMood; mode?: SessionMode; final_scene_id: Visual["id"]; completed_naturally: true };
  scene_favorited: { scene_id: Visual["id"]; scene_name: string; mode?: SessionMode };
  scene_hidden: { scene_id: Visual["id"]; scene_name: string; mode?: SessionMode };
  tour_started: { tour_id: string; step: number; target: string };
  tour_step_viewed: { tour_id: string; step: number; target: string };
  tour_completed: { tour_id: string; step: number; target: string };
  tour_skipped: { tour_id: string; step: number; target: string };
}
export type ProductCapture = <E extends keyof ProductEvents>(event: E, properties: ProductEvents[E]) => void;
export const allowedEvents = new Set(["$pageview", "session_started", "scene_selected", "session_completed", "scene_favorited", "scene_hidden", "tour_started", "tour_step_viewed", "tour_completed", "tour_skipped"]);

// Lives for one mounted session, not one render. An extension after a finished
// timer is a new session; resuming an early finish continues the original one.
export function createSessionAnalytics(capture: ProductCapture) {
  let started = false;
  let completed = false;
  let duration: number | null = null;
  let mode: SessionMode | undefined;
  let mood: Mood | FocusMood | null = null;
  return {
    start(minutes: number | null, sessionMood: Mood | FocusMood, scene: AnalyticsScene, sessionMode?: SessionMode) {
      if (started) return;
      started = true;
      duration = minutes;
      mood = sessionMood;
      mode = sessionMode;
      capture("session_started", { duration_minutes: minutes, mood: sessionMood, initial_scene_id: scene.id, ...(mode ? { mode } : {}) });
    },
    complete(scene: AnalyticsScene) {
      if (!started || completed || duration === null) return;
      completed = true;
      capture("session_completed", { duration_minutes: duration, mood: mood!, final_scene_id: scene.id, completed_naturally: true, ...(mode ? { mode } : {}) });
    },
    extend() {
      if (completed) { started = false; completed = false; }
    },
  };
}
