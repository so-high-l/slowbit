import type { FocusMood, Mood, SessionMode, Visual } from "./types";

export type AnalyticsMode = "relax" | "focus";
export type AnalyticsScene = Pick<Visual, "id" | "name">;
export type SessionEndReason = "manual" | "timer_completed" | "navigation";

type SceneProperties = {
  mode: AnalyticsMode;
  scene: string;
  scene_id: Visual["id"];
  scene_name: string;
  session_id?: string;
};

type SessionProperties = SceneProperties & {
  session_id: string;
  mood: Mood | FocusMood;
  selected_duration: number | null;
};

export interface ProductEvents {
  app_visited: { entry_source: string };
  mode_selected: { mode: AnalyticsMode; previous_mode?: AnalyticsMode; entry_source: string };
  mode_switched: { previous_mode: AnalyticsMode; next_mode: AnalyticsMode; active_time_before_switch: number; active_seconds_in_previous_mode: number; previous_scene?: string; next_scene?: string; previous_playlist?: string };
  session_started: SessionProperties & { duration_minutes: number | null; initial_scene_id: Visual["id"] };
  session_ended: SessionProperties & { active_duration_seconds: number; end_reason: SessionEndReason };
  session_completed: SessionProperties & { duration_minutes: number | null; final_scene_id: Visual["id"]; completed_naturally: true };
  meaningful_session_3m: SceneProperties & { session_id: string };
  meaningful_session_5m: SceneProperties & { session_id: string };
  session_timer_completed: SessionProperties & { active_duration_seconds: number };
  mood_selected: { mode: AnalyticsMode; mood: Mood | FocusMood };
  scene_selected: SceneProperties & { previous_scene?: string; source?: string; recommendation_source?: string };
  scene_favorited: SceneProperties;
  scene_unfavorited: SceneProperties;
  scene_hidden: SceneProperties;
  scene_unhidden: SceneProperties;
  fullscreen_entered: SceneProperties & { session_id?: string };
  fullscreen_exited: SceneProperties & { session_id?: string; active_duration_seconds: number };
  sound_mixer_opened: SceneProperties;
  sound_enabled: SceneProperties & { sound: string; sound_id: string; sound_name: string; volume: number };
  sound_disabled: SceneProperties & { sound: string; sound_id: string; sound_name: string };
  sound_volume_changed: SceneProperties & { sound: string; sound_id: string; sound_name: string; final_volume: number };
  master_volume_changed: { mode: AnalyticsMode; final_volume: number; session_id?: string };
  mute_changed: { mode: AnalyticsMode; muted: boolean; session_id?: string };
  focus_session_started: SessionProperties & { playlist?: string; playlist_id?: string; playlist_name?: string };
  focus_session_ended: SessionProperties & { playlist?: string; playlist_id?: string; playlist_name?: string; active_duration_seconds: number; end_reason: SessionEndReason };
  focus_scene_selected: SceneProperties & { previous_scene?: string };
  playlist_started: SceneProperties & { playlist: string; playlist_id: string; playlist_name: string; category: string; source: string };
  playlist_paused: SceneProperties & { playlist: string; playlist_id: string; playlist_name: string; elapsed_seconds: number };
  playlist_resumed: SceneProperties & { playlist: string; playlist_id: string; playlist_name: string };
  playlist_changed: SceneProperties & { previous_playlist: string; next_playlist: string; elapsed_seconds_before_change: number };
  playlist_completed: SceneProperties & { playlist: string; playlist_id: string; playlist_name: string; active_listening_seconds: number };
  playlist_restarted: SceneProperties & { playlist: string; playlist_id: string; playlist_name: string };
  focus_audio_volume_changed: { mode: "focus"; playlist: string; final_volume: number };
  focus_meaningful_session_10m: SceneProperties & { session_id: string; playlist?: string };
  focus_meaningful_session_25m: SceneProperties & { session_id: string; playlist?: string };
  focus_meaningful_session_45m: SceneProperties & { session_id: string; playlist?: string };
  tour_started: { tour_id: string; step: number; target: string };
  tour_step_viewed: { tour_id: string; step: number; target: string };
  tour_completed: { tour_id: string; step: number; target: string };
  tour_skipped: { tour_id: string; step: number; target: string };
}

export type ProductCapture = <E extends keyof ProductEvents>(event: E, properties: ProductEvents[E]) => void;
export const allowedEvents = new Set(["$pageview", ...[
  "app_visited", "mode_selected", "mode_switched", "session_started", "session_ended", "session_completed",
  "meaningful_session_3m", "meaningful_session_5m", "session_timer_completed", "mood_selected", "scene_selected",
  "scene_favorited", "scene_unfavorited", "scene_hidden", "scene_unhidden", "fullscreen_entered", "fullscreen_exited",
  "sound_mixer_opened", "sound_enabled", "sound_disabled", "sound_volume_changed", "master_volume_changed", "mute_changed",
  "focus_session_started", "focus_session_ended", "focus_scene_selected", "playlist_started", "playlist_paused",
  "playlist_resumed", "playlist_changed", "playlist_completed", "playlist_restarted", "focus_audio_volume_changed",
  "focus_meaningful_session_10m", "focus_meaningful_session_25m", "focus_meaningful_session_45m",
  "tour_started", "tour_step_viewed", "tour_completed", "tour_skipped",
] as const]);

export const analyticsMode = (mode: SessionMode | undefined): AnalyticsMode => mode === "focus" ? "focus" : "relax";
const makeSessionId = () => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// The page supplies time only while playback is running and the document is
// visible and focused, so milestones never count a tab that was left open.
export function createSessionAnalytics(capture: ProductCapture) {
  let started = false;
  let ended = false;
  let activeSeconds = 0;
  let duration: number | null = null;
  let mode: AnalyticsMode = "relax";
  let mood: Mood | FocusMood = "fried";
  let sessionId = makeSessionId();
  const milestones = new Set<number>();
  const sceneProps = (scene: AnalyticsScene): SceneProperties => ({ mode, scene: scene.name, scene_id: scene.id, scene_name: scene.name });
  const sessionProps = (scene: AnalyticsScene): SessionProperties => ({ ...sceneProps(scene), session_id: sessionId, mood, selected_duration: duration });
  const emitMilestone = (seconds: number, scene: AnalyticsScene, playlist?: string) => {
    if (milestones.has(seconds) || activeSeconds < seconds) return;
    milestones.add(seconds);
    if (mode === "relax") {
      capture(seconds === 180 ? "meaningful_session_3m" : "meaningful_session_5m", { ...sceneProps(scene), session_id: sessionId });
    } else {
      const event = seconds === 600 ? "focus_meaningful_session_10m" : seconds === 1500 ? "focus_meaningful_session_25m" : "focus_meaningful_session_45m";
      capture(event, { ...sceneProps(scene), session_id: sessionId, ...(playlist ? { playlist } : {}) });
    }
  };
  return {
    start(minutes: number | null, sessionMood: Mood | FocusMood, scene: AnalyticsScene, sessionMode?: SessionMode, playlist?: string) {
      if (started) return;
      started = true; duration = minutes; mood = sessionMood; mode = analyticsMode(sessionMode);
      capture("session_started", { ...sessionProps(scene), duration_minutes: minutes, initial_scene_id: scene.id });
      if (mode === "focus") capture("focus_session_started", { ...sessionProps(scene), ...(playlist ? { playlist, playlist_id: playlist, playlist_name: playlist } : {}) });
    },
    addActiveSeconds(seconds: number, scene: AnalyticsScene, playlist?: string) {
      if (!started || ended || !Number.isFinite(seconds) || seconds <= 0) return;
      activeSeconds += seconds;
      (mode === "relax" ? [180, 300] : [600, 1500, 2700]).forEach(mark => emitMilestone(mark, scene, playlist));
    },
    end(reason: SessionEndReason, scene: AnalyticsScene, playlist?: string) {
      if (!started || ended) return;
      ended = true;
      const rounded = Math.round(activeSeconds);
      capture("session_ended", { ...sessionProps(scene), active_duration_seconds: rounded, end_reason: reason });
      if (mode === "focus") capture("focus_session_ended", { ...sessionProps(scene), ...(playlist ? { playlist, playlist_id: playlist, playlist_name: playlist } : {}), active_duration_seconds: rounded, end_reason: reason });
      if (reason === "timer_completed" && duration !== null) {
        capture("session_timer_completed", { ...sessionProps(scene), active_duration_seconds: rounded });
        capture("session_completed", { ...sessionProps(scene), duration_minutes: duration, final_scene_id: scene.id, completed_naturally: true });
      }
    },
    complete(scene: AnalyticsScene, playlist?: string) { this.end("timer_completed", scene, playlist); },
    activeSeconds: () => activeSeconds,
    sessionId: () => sessionId,
    extend() {
      if (!ended) return;
      started = false; ended = false; activeSeconds = 0; milestones.clear(); sessionId = makeSessionId();
    },
  };
}
