"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

export default function Home() {
  useEffect(() => {
    // Trigger visitor logging on initial load
    // Try browser geolocation first (better for local dev); fallback to path-only
    const pathPayload = { path: "/" };
    let sent = false;
    const send = (body: Record<string, unknown>) => {
      if (sent) return;
      sent = true;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {});
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          send({ ...pathPayload, latitude, longitude });
        },
        () => {
          send(pathPayload);
        },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 5000 }
      );
      // Safety timeout in case the prompt is dismissed
      setTimeout(() => send(pathPayload), 6000);
    } else {
      send(pathPayload);
    }
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Live Visitor Map</h1>
      <Map />
    </div>
  );
}
