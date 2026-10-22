"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getExistingAnalyticsDistinctId } from "@/lib/analytics";
import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";

export default function AnalyticsPrivacyControls() {
  const analyticsConsent = useAnalyticsConsent();
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    setAnalyticsId(
      analyticsConsent.consent === "granted"
        ? getExistingAnalyticsDistinctId()
        : null,
    );
    setCopyStatus("");
  }, [analyticsConsent.consent]);

  async function copyAnalyticsId() {
    if (!analyticsId) return;
    try {
      await navigator.clipboard.writeText(analyticsId);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed. Select the ID and copy it manually.");
    }
  }

  const enabled = analyticsConsent.consent === "granted";

  return (
    <>
      <div className="preference-row privacy-preference-row">
        <span>
          <strong>Optional usage analytics</strong>
          <small>{enabled ? "Enabled" : "Disabled"}</small>
        </span>
        <button
          className="secondary-button"
          type="button"
          role="switch"
          aria-label="Allow optional usage analytics"
          aria-checked={enabled}
          disabled={!analyticsConsent.ready}
          onClick={() => analyticsConsent.choose(enabled ? "declined" : "granted")}
        >
          {enabled ? "On" : "Off"}
        </button>
      </div>

      <div className="analytics-deletion-settings">
        <h3>Historical analytics deletion</h3>
        {analyticsId ? (
          <>
            <p>Copy this pseudonymous browser ID before switching analytics off if you may want previously collected events located.</p>
            <div className="analytics-id-row">
              <code aria-label="Current anonymous analytics ID">{analyticsId}</code>
              <button className="secondary-button" type="button" onClick={copyAnalyticsId}>Copy ID</button>
            </div>
            {copyStatus && <p className="analytics-copy-status" role="status">{copyStatus}</p>}
          </>
        ) : (
          <p>No current analytics browser ID is available. Slowbit does not initialize PostHog or create an ID just to display one here.</p>
        )}
        <p>
          A pseudonymous ID can help locate historical events, but it does not conclusively prove identity or ownership. To request deletion, email{" "}
          <a href="mailto:elmahdanisouhail@gmail.com">elmahdanisouhail@gmail.com</a>.
        </p>
      </div>

      {analyticsConsent.storageError && <p className="storage-warning" role="status">This browser could not save your analytics choice.</p>}
      <Link className="privacy-policy-link" href="/privacy/">Read the Privacy Policy</Link>
    </>
  );
}
