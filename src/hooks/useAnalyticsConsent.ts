"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics";

export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const sync = () => setConsent(getAnalyticsConsent());
    sync();
    setReady(true);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const choose = useCallback((next: Exclude<AnalyticsConsent, null>) => {
    const saved = setAnalyticsConsent(next);
    setStorageError(!saved);
    if (saved) setConsent(next);
    return saved;
  }, []);

  return { consent, ready, storageError, choose };
}
