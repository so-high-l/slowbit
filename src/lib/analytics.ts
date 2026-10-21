import type { FocusMood, Mood, SessionMode, SoundId } from "./types";
import posthog from "posthog-js";
import { allowedEvents, analyticsMode, type ProductCapture } from "./analytics-events";
import type { AnalyticsScene, AnalyticsMode } from "./analytics-events";
let initialized = false;

export function initializeAnalytics() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (initialized || typeof window === "undefined" || !token || !host) return;
  try {
    posthog.init(token, {
      api_host: host,
      defaults: "2026-05-30",
      persistence: "localStorage",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: false,
      capture_dead_clicks: false,
      rageclick: false,
      capture_exceptions: false,
      capture_performance: false,
      enable_heatmaps: false,
      disable_session_recording: true,
      disable_surveys: true,
      before_send: event => event && allowedEvents.has(event.event) ? event : null,
    });
    initialized = true;
    posthog.capture("app_visited", { entry_source: document.referrer ? "referral" : "direct" });
  } catch {
    // Analytics must never prevent entry, playback, or preference changes.
  }
}

export const captureProductEvent: ProductCapture = (event, properties) => {
  if (!initialized) return;
  try { posthog.capture(event, properties); } catch { /* Best-effort analytics. */ }
};

const sceneProperties = (scene: AnalyticsScene, mode: SessionMode, session_id?: string) => ({
  mode: analyticsMode(mode), scene: scene.name, scene_id: scene.id, scene_name: scene.name,
  ...(session_id ? { session_id } : {}),
});

export const analytics = {
  modeSelected(mode: SessionMode, previousMode: SessionMode | undefined, entry_source: string, activeSeconds = 0, context: { previousScene?: string; nextScene?: string; previousPlaylist?: string } = {}) {
    const next = analyticsMode(mode);
    let remembered: { mode?: AnalyticsMode; activeSeconds?: number; scene?: string; playlist?: string } = {};
    try { remembered = JSON.parse(sessionStorage.getItem("slowbit:last-mode-session") ?? "{}"); } catch { /* Storage may be unavailable. */ }
    const previous = previousMode ? analyticsMode(previousMode) : remembered.mode;
    captureProductEvent("mode_selected", { mode: next, ...(previous ? { previous_mode: previous } : {}), entry_source });
    const elapsed = remembered.mode === previous ? remembered.activeSeconds ?? activeSeconds : activeSeconds;
    if (previous && previous !== next) captureProductEvent("mode_switched", {
      previous_mode: previous, next_mode: next, active_time_before_switch: elapsed,
      active_seconds_in_previous_mode: elapsed,
      ...(remembered.scene ? { previous_scene: remembered.scene } : {}),
      ...(remembered.playlist ? { previous_playlist: remembered.playlist } : {}),
      ...context,
    });
  },
  recordModeActivity(mode: SessionMode, activeSeconds: number, scene: string, playlist?: string) {
    try { sessionStorage.setItem("slowbit:last-mode-session", JSON.stringify({ mode: analyticsMode(mode), activeSeconds: Math.round(activeSeconds), scene, playlist })); } catch { /* Storage may be unavailable. */ }
  },
  moodSelected: (mood: Mood | FocusMood, mode: SessionMode) => captureProductEvent("mood_selected", { mood, mode: analyticsMode(mode) }),
  sceneSelected(scene: AnalyticsScene, mode: SessionMode = "unwind", previousScene?: AnalyticsScene, source?: string, sessionId?: string) {
    const properties = { ...sceneProperties(scene, mode, sessionId), ...(previousScene ? { previous_scene: previousScene.name } : {}), ...(source ? { source } : {}) };
    captureProductEvent("scene_selected", properties);
    if (mode === "focus") captureProductEvent("focus_scene_selected", properties);
  },
  sceneFavorited: (scene: AnalyticsScene, mode: SessionMode = "unwind", sessionId?: string) => captureProductEvent("scene_favorited", sceneProperties(scene, mode, sessionId)),
  sceneUnfavorited: (scene: AnalyticsScene, mode: SessionMode = "unwind", sessionId?: string) => captureProductEvent("scene_unfavorited", sceneProperties(scene, mode, sessionId)),
  sceneHidden: (scene: AnalyticsScene, mode: SessionMode = "unwind", sessionId?: string) => captureProductEvent("scene_hidden", sceneProperties(scene, mode, sessionId)),
  sceneUnhidden: (scene: AnalyticsScene, mode: SessionMode = "unwind") => captureProductEvent("scene_unhidden", sceneProperties(scene, mode)),
  fullscreenEntered: (scene: AnalyticsScene, mode: SessionMode, session_id?: string) => captureProductEvent("fullscreen_entered", { ...sceneProperties(scene, mode), ...(session_id ? { session_id } : {}) }),
  fullscreenExited: (scene: AnalyticsScene, mode: SessionMode, active_duration_seconds: number, session_id?: string) => captureProductEvent("fullscreen_exited", { ...sceneProperties(scene, mode), active_duration_seconds, ...(session_id ? { session_id } : {}) }),
  soundMixerOpened: (scene: AnalyticsScene, mode: SessionMode, sessionId?: string) => captureProductEvent("sound_mixer_opened", sceneProperties(scene, mode, sessionId)),
  soundChanged(scene: AnalyticsScene, mode: SessionMode, sound: SoundId, soundName: string, previous: number, final: number, sessionId?: string) {
    const context = { ...sceneProperties(scene, mode, sessionId), sound, sound_id: sound, sound_name: soundName };
    if (previous <= 0 && final > 0) captureProductEvent("sound_enabled", { ...context, volume: final });
    else if (previous > 0 && final <= 0) captureProductEvent("sound_disabled", context);
    if (final > 0) captureProductEvent("sound_volume_changed", { ...context, final_volume: final });
  },
  masterVolumeChanged: (mode: SessionMode, final_volume: number, session_id?: string) => captureProductEvent("master_volume_changed", { mode: analyticsMode(mode), final_volume, ...(session_id ? { session_id } : {}) }),
  muteChanged: (mode: SessionMode, muted: boolean, session_id?: string) => captureProductEvent("mute_changed", { mode: analyticsMode(mode), muted, ...(session_id ? { session_id } : {}) }),
  focusAudioVolumeChanged: (playlist: string, final_volume: number) => captureProductEvent("focus_audio_volume_changed", { mode: "focus", playlist, final_volume }),
  tourStarted: (tour_id: string, step: number, target: string) => captureProductEvent("tour_started", { tour_id, step, target }),
  tourStepViewed: (tour_id: string, step: number, target: string) => captureProductEvent("tour_step_viewed", { tour_id, step, target }),
  tourCompleted: (tour_id: string, step: number, target: string) => captureProductEvent("tour_completed", { tour_id, step, target }),
  tourSkipped: (tour_id: string, step: number, target: string) => captureProductEvent("tour_skipped", { tour_id, step, target }),
};
export type { AnalyticsMode };
