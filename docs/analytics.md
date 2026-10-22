# Product analytics

PostHog receives explicit product events and route pageviews only after a visitor explicitly opts in. Analytics are disabled by default: the SDK is not initialized and no PostHog request or identifier is created before consent. Slowbit does not use autocapture, session recordings, heatmaps, surveys, `identify()`, or message-board text. For opted-in visitors, a persistent pseudonymous browser ID supports aggregate retention analysis.

Consent is stored separately at `slowbit:analytics-consent:v1`. A declined choice persists until the visitor changes it or clears site data; Slowbit does not periodically ask again. Declining does not initialize PostHog. Withdrawing consent calls PostHog's opt-out flow, disables persistence, clears its stored browser identity, and stops future product-event capture. It does not delete historical server-side events. Visitors can change the decision in Settings.

Slowbit uses PostHog Cloud EU. The current Free-plan event retention is a one-year query window; this is not documented as a guarantee that every underlying record is permanently erased at exactly one year. Settings can display and copy an already-existing pseudonymous PostHog distinct ID while consent is enabled. It never initializes PostHog merely to create or display an ID. Historical deletion requests are handled with the internal [PostHog deletion procedure](POSTHOG_DELETION_PROCEDURE.md).

Set both public values in production. Leave them unset locally to keep development and test traffic out of production data. Even when configured, PostHog remains dormant until consent:

```dotenv
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your_public_project_token
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

The public analytics mode is always `relax` or `focus`; the internal preference value `unwind` is mapped to `relax` at the analytics boundary. Session, scene, fullscreen, mixer, and sound events include the current mode and scene context where relevant. Session events also share a generated `session_id`.

## Event groups

| Area | Events |
| --- | --- |
| Entry and modes | `app_visited`, `mode_selected`, `mode_switched` |
| Shared sessions | `session_started`, `session_ended`, `session_timer_completed`, `session_completed`, `meaningful_session_3m`, `meaningful_session_5m` |
| Relax discovery | `mood_selected`, `scene_selected`, `scene_favorited`, `scene_unfavorited`, `scene_hidden`, `scene_unhidden` |
| Experience controls | `fullscreen_entered`, `fullscreen_exited`, `sound_mixer_opened`, `sound_enabled`, `sound_disabled`, `sound_volume_changed`, `master_volume_changed`, `mute_changed` |
| Focus sessions | `focus_session_started`, `focus_session_ended`, `focus_scene_selected`, `focus_meaningful_session_10m`, `focus_meaningful_session_25m`, `focus_meaningful_session_45m` |
| Focus audio | `playlist_started`, `playlist_paused`, `playlist_resumed`, `playlist_changed`, `focus_audio_volume_changed` |
| Onboarding | `tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped` |

`session_completed` remains for compatibility with existing dashboards and is emitted only when a configured timer reaches zero. `session_ended` records manual, navigation, and timer endings with `active_duration_seconds` and `end_reason`.

Session time advances only while the session is playing, the document is visible, and its window has focus. The visible timer uses the same rule. Time jumps are capped to avoid counting suspended browser or device time. Relax milestones occur at 3 and 5 active minutes; Focus milestones occur at 10, 25, and 45 active minutes.

Volume sliders emit on the final pointer or keyboard change, rather than on every input step. Playlist completion and restart events remain allowlisted for future finite playlists, but the current continuously crossfading stations do not falsely report a completion.

## Suggested PostHog views

- Activation: unique-user funnel `app_visited` → `session_started`, broken down by `mode`.
- Mode adoption: unique users of `mode_selected`, plus an insight comparing users with only `relax`, only `focus`, or both values.
- Cross-mode ritual: paths and funnels from `focus_session_ended` or `mode_switched` (`focus` → `relax`) into Relax milestones.
- Meaningful use: Relax 3/5-minute and Focus 10/25/45-minute events, separately.
- Session duration: histogram and median of `active_duration_seconds`, filtered by `mode`; use separate Focus duration buckets.
- Discovery: `scene_selected` by scene and source, favorites/hides, and the number of scene selections before the first meaningful event for each `session_id`.
- Audio: sound enable/disable combinations, final volumes, playlist starts, and scene + playlist combinations.
- Retention: returning unique users on `session_started`, broken down by `mode`, meaningful milestone, mixer use, playlist use, and mode-switch history.

Use Live Events to verify one Relax and one Focus journey, a direct mode switch, pause/resume, a finalized slider change, fullscreen entry/exit, manual finish, and timer completion. Hidden tabs and paused sessions should not advance active duration or milestones.
