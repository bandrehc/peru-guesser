"use client";

import { MapContainer } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Extremos del territorio peruano, con un pequeño margen
const PERU_BOUNDS: LatLngBoundsExpression = [
  [-18.5, -81.5],
  [0.2, -68.5],
];

const PERU_MAX_BOUNDS: LatLngBoundsExpression = [
  [-24, -88],
  [6, -62],
];

// Color de "océano": fondo liso, sin mapa base (estilo Seterra)
const OCEAN = "#a5c9e3";

interface MapCanvasProps {
  children?: React.ReactNode;
  /** Encuadre inicial; por defecto, todo el Perú. */
  bounds?: LatLngBoundsExpression;
  /** Límite de paneo; por defecto, alrededor del Perú. */
  maxBounds?: LatLngBoundsExpression;
}

export default function MapCanvas({ children, bounds, maxBounds }: MapCanvasProps) {
  return (
    <MapContainer
      bounds={bounds ?? PERU_BOUNDS}
      boundsOptions={{ padding: [12, 12] }}
      maxBounds={maxBounds ?? PERU_MAX_BOUNDS}
      maxBoundsViscosity={0.8}
      minZoom={4}
      maxZoom={13}
      zoomSnap={0.25}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: OCEAN }}
    >
      {children}
    </MapContainer>
  );
}
