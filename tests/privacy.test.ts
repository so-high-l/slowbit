
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("privacy route and controls match the confirmed launch configuration", async () => {
  const [
    policy,
    settings,
    controls,
    notice,
    composer,
    worker,
  ] = await Promise.all([
    readFile("src/app/privacy/page.tsx", "utf8"),
    readFile("src/app/settings/page.tsx", "utf8"),
    readFile("src/components/AnalyticsPrivacyControls.tsx", "utf8"),
    readFile("src/components/AnalyticsConsent.tsx", "utf8"),
    readFile("src/components/board/MessageComposer.tsx", "utf8"),
    readFile("src/worker/index.ts", "utf8"),
  ]);

  // Public privacy policy
  assert.doesNotMatch(
    policy,
    /Owner review needed|TODO|\[CONFIRM/i
  );
  assert.deepEqual(
    [...policy.matchAll(/<h2>(.*?)<\/h2>/g)].map((match) => match[1]),
    [
      "1. Introduction",
      "2. Who operates Slowbit?",
      "3. Information Slowbit processes",
      "4. Browser storage and local preferences",
      "5. Optional PostHog analytics",
      "6. Anonymous public message board",
      "7. Hosting and third-party service providers",
      "8. Data retention",
      "9. International data processing and transfers",
      "10. Privacy choices and rights",
      "11. Historical data-deletion requests",
      "12. Security",
      "13. Children&apos;s privacy",
      "14. Changes to this policy",
      "15. Contact",
    ]
  );

  assert.match(policy, /Souhail EL MAHDANI/);
  assert.match(policy, /elmahdanisouhail@gmail\.com/);
  assert.match(policy, /PostHog Cloud EU/);
  assert.match(policy, /one-year query window/);
  assert.match(
    policy,
    /Vercel Hobby runtime logs are currently retained for one hour/
  );
  assert.match(
    policy,
    /Workers Logs are enabled and currently retained for three days/
  );
  assert.match(policy, /R2 Data Access Logs are disabled/);
  assert.match(policy, /retained indefinitely/);
  assert.match(policy, /expire after 24 hours/);
  assert.match(policy, /not directed to children/);
  assert.match(
    policy,
    /operated from Morocco and is available worldwide/
  );

  // Settings and privacy controls
  assert.match(settings, /AnalyticsPrivacyControls/);
  assert.match(controls, /Optional usage analytics/);
  assert.match(controls, /Historical analytics deletion/);
  assert.match(controls, /getExistingAnalyticsDistinctId/);
  assert.match(controls, /Read the Privacy Policy/);

  // Consent buttons
  assert.match(notice, />Decline</);
  assert.match(notice, />Allow</);

  // Public message board disclosures
  assert.match(composer, /Public to everyone/);
  assert.match(composer, /remain visible/);

  // Board token expiration: 24 hours
  assert.match(
    worker,
    /now\s*\+\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/
  );

});
