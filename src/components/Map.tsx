"use client";
import "leaflet/dist/leaflet.css";
import L, { Map as LeafletMap, TileLayer, CircleMarker, LatLngExpression } from "leaflet";
import { useEffect, useRef } from "react";
import useSWR from "swr";

type Point = { lat: number; lon: number; count: number };
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const { data } = useSWR<{ points: Point[] }>("/api/points", fetcher, {
    refreshInterval: 30000,
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center: LatLngExpression = [20, 0];
    const map = L.map(containerRef.current, { center, zoom: 2, worldCopyJump: true });
    mapRef.current = map;

    const tiles = new TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    tiles.addTo(map);

    const layer = L.layerGroup();
    layer.addTo(map);
    layerRef.current = layer;

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.clearLayers();
    const points = data?.points ?? [];
    for (const p of points) {
      const radius = Math.min(20, Math.max(3, Math.sqrt(p.count)));
      const marker = new CircleMarker([p.lat, p.lon], {
        radius,
        color: "#dc2626", // red border
        fillColor: "#f97316", // orange fill
        fillOpacity: 0.6,
        stroke: false,
      });
      marker.bindTooltip(`Visits: ${p.count}`, { direction: "top" });
      marker.addTo(layer);
    }
  }, [data]);

  return <div ref={containerRef} style={{ height: "70vh", width: "100%", borderRadius: 12 }} />;
}
