# MVP analytics

PostHog Cloud receives pageviews and five custom events. No analytics backend,
user accounts, `identify()` calls, autocapture, session recordings, surveys, or
message-board text. A persistent anonymous browser ID supports retention; it is
not a person's identity and resets when browser storage is cleared.

Set these public values in `.env.local` for local testing and in Vercel's
Production environment, then rebuild/redeploy:

```dotenv
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=your_public_project_token
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Use `https://us.i.posthog.com` for a US project. Both values are required;
missing configuration disables analytics safely. Never use a personal API key.
Leave local configuration empty to keep development activity out of production.

| Event | Trigger / properties |
| --- | --- |
| `$pageview` | Initial visit and SPA route changes, managed by PostHog |
| `session_started` | Once per session; `duration_minutes`, `mood`, `initial_scene_id` |
| `scene_selected` | Explicit scene changes/picker/favorites; `scene_id`, `scene_name` |
| `session_completed` | Timer reaches zero; `duration_minutes`, `mood`, `final_scene_id`, `completed_naturally: true` |
| `scene_favorited` | Adding a favorite, not removing; `scene_id`, `scene_name` |
| `scene_hidden` | Hiding a scene; `scene_id`, `scene_name` |

Pauses and early finishes do not complete a session. Resuming an early finish
continues it. Extending after a completed timer starts a new session. Untimed
sessions have `duration_minutes: null` and no natural completion event.

## Dashboard in PostHog

- Unique visitors: `$pageview`, unique users.
- Session starts: `session_started`, total events.
- Activation: unique-user funnel `$pageview` → `session_started`.
- Completion: funnel `session_started` → `session_completed`; filter out
  `duration_minutes: null`. Use total events for session counts rather than
  confusing repeat sessions with unique users.
- Top scenes: `scene_selected` by `scene_id` or `scene_name`; also examine `session_started` by
  `initial_scene_id` to include defaults that users never changed.
- Favorites: `scene_favorited` by `scene_id` or `scene_name`.
- Seven-day retention: initial and returning events both `session_started`.

Check Live Events after configuring the token: visit, begin, switch scene,
favorite, hide, and let a timed session finish. Confirm pause/resume does not
create extra starts and early finish does not create completion. Browser
blocking, cleared storage, and closed tabs can reduce measured activity.
