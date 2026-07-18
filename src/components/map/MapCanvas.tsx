"use client";

import { useEffect, useState } from "react";
import { MapContainer } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import "leaflet/dist/leaflet.css";
import GeoLayer from "./GeoLayer";
import { loadGeo } from "@/lib/geo";

// Extremos del territorio peruano, con un pequeño margen
const PERU_BOUNDS: [[number, number], [number, number]] = [
  [-18.5, -81.5],
  [0.2, -68.5],
];

// Color de "océano": fondo liso, sin mapa base (estilo Seterra)
const OCEAN = "#a5c9e3";

export default function MapCanvas() {
  const [departamentos, setDepartamentos] = useState<FeatureCollection | null>(
    null
  );

  useEffect(() => {
    loadGeo("departamentos").then(setDepartamentos).catch(console.error);
  }, []);

  return (
    <MapContainer
      bounds={PERU_BOUNDS}
      boundsOptions={{ padding: [12, 12] }}
      maxBounds={[
        [-24, -88],
        [6, -62],
      ]}
      maxBoundsViscosity={0.8}
      minZoom={4}
      maxZoom={11}
      zoomSnap={0.25}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: OCEAN }}
    >
      {departamentos && <GeoLayer data={departamentos} />}
    </MapContainer>
  );
}
