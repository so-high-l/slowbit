"use client";

import Link from "next/link";
import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";

export default function AnalyticsConsentNotice() {
  const { consent, ready, storageError, choose } = useAnalyticsConsent();
  if (!ready || consent !== null) return null;

  return (
    <aside className="analytics-consent" aria-labelledby="analytics-consent-title">
      <div className="analytics-consent-copy">
        <strong id="analytics-consent-title">Help improve Slowbit?</strong>
        <p>
          Allow optional, pseudonymous usage analytics. Slowbit works the same if
          you decline. <Link href="/privacy/">Privacy details</Link>
        </p>
        {storageError && <p className="analytics-consent-error" role="status">This browser could not save your choice.</p>}
      </div>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => choose("declined")}>Decline</button>
        <button type="button" onClick={() => choose("granted")}>Allow</button>
      </div>
    </aside>
  );
}
