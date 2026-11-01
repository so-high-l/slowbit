"use client";

import { useEffect, useState } from "react";

export type ConnectionStatus = "online" | "offline" | "reconnecting";

export function connectionStatusMessage(status: ConnectionStatus) {
  if (status === "offline") return "Offline — loaded sounds will keep playing.";
  if (status === "reconnecting") return "Back online — reconnecting sounds…";
  return "";
}

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("online");

  useEffect(() => {
    let settled: ReturnType<typeof setTimeout> | undefined;
    const offline = () => {
      clearTimeout(settled);
      setStatus("offline");
    };
    const online = () => {
      clearTimeout(settled);
      setStatus("reconnecting");
      settled = setTimeout(() => setStatus("online"), 3500);
    };

    if (navigator.onLine === false) offline();
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      clearTimeout(settled);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);

  return status;
}
