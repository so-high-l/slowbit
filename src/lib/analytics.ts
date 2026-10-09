import posthog from "posthog-js";
import { allowedEvents, type ProductCapture } from "./analytics-events";
import type { AnalyticsScene } from "./analytics-events";
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
      // Keep remote settings or future SDK defaults from expanding this MVP.
      before_send: event => event && allowedEvents.has(event.event) ? event : null,
    });
    initialized = true;
  } catch {
    // Analytics must never prevent entry, playback, or preference changes.
  }
}

export const captureProductEvent: ProductCapture = (event, properties) => {
  if (!initialized) return;
  try { posthog.capture(event, properties); } catch { /* Best-effort analytics. */ }
};
export const analytics = {
  sceneSelected: (scene: AnalyticsScene) => captureProductEvent("scene_selected", { scene_id: scene.id, scene_name: scene.name }),
  sceneFavorited: (scene: AnalyticsScene) => captureProductEvent("scene_favorited", { scene_id: scene.id, scene_name: scene.name }),
  sceneHidden: (scene: AnalyticsScene) => captureProductEvent("scene_hidden", { scene_id: scene.id, scene_name: scene.name }),
};
