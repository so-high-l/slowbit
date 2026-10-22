import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("privacy route, controls, and operations match the confirmed launch configuration", async () => {
  const [policy, settings, controls, notice, composer, worker, review, posthogProcedure, boardProcedure] = await Promise.all([
    readFile("src/app/privacy/page.tsx", "utf8"),
    readFile("src/app/settings/page.tsx", "utf8"),
    readFile("src/components/AnalyticsPrivacyControls.tsx", "utf8"),
    readFile("src/components/AnalyticsConsent.tsx", "utf8"),
    readFile("src/components/board/MessageComposer.tsx", "utf8"),
    readFile("src/worker/index.ts", "utf8"),
    readFile("docs/PRIVACY_REVIEW.md", "utf8"),
    readFile("docs/POSTHOG_DELETION_PROCEDURE.md", "utf8"),
    readFile("docs/BOARD_MESSAGE_DELETION_PROCEDURE.md", "utf8"),
  ]);
  assert.doesNotMatch(policy, /Owner review needed|TODO|\[CONFIRM/i);
  assert.match(policy, /Souhail EL MAHDANI/);
  assert.match(policy, /elmahdanisouhail@gmail\.com/);
  assert.match(policy, /PostHog Cloud EU/);
  assert.match(policy, /one-year query window/);
  assert.match(policy, /Vercel Hobby runtime logs are currently retained for one hour/);
  assert.match(policy, /Workers Logs are enabled and currently retained for three days/);
  assert.match(policy, /R2 Data Access Logs are disabled/);
  assert.match(policy, /retained indefinitely/);
  assert.match(policy, /expire after 24 hours/);
  assert.match(policy, /not directed to children/);
  assert.match(policy, /operated from Morocco and is available worldwide/);
  assert.match(settings, /AnalyticsPrivacyControls/);
  assert.match(controls, /Optional usage analytics/);
  assert.match(controls, /Historical analytics deletion/);
  assert.match(controls, /getExistingAnalyticsDistinctId/);
  assert.match(controls, /Read the Privacy Policy/);
  assert.match(notice, />Decline</);
  assert.match(notice, />Allow</);
  assert.match(composer, /Public to everyone/);
  assert.match(composer, /remain visible/);
  assert.match(worker, /now \+ 24 \* 60 \* 60 \* 1000/);
  assert.match(review, /## Confirmed/);
  assert.match(review, /## Implemented/);
  assert.match(review, /## Requires owner or legal review/);
  assert.match(posthogProcedure, /data_deletion_requests\/preview/);
  assert.match(posthogProcedure, /data_deletion:write/);
  assert.match(posthogProcedure, /https:\/\/eu\.posthog\.com/);
  assert.match(boardProcedure, /DELETE FROM board_messages/);
  assert.match(boardProcedure, /VALIDATED_UUID/);
});
