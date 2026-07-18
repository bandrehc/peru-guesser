"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Centro aproximado del territorio peruano
const PERU_CENTER: [number, number] = [-9.19, -75.0152];

// Límites amplios alrededor del Perú para que el jugador no se pierda paneando
const PERU_BOUNDS: [[number, number], [number, number]] = [
  [2.5, -84.5],
  [-20.5, -66.5],
];

export default function MapCanvas() {
  return (
    <MapContainer
      center={PERU_CENTER}
      zoom={5}
      minZoom={4}
      maxBounds={PERU_BOUNDS}
      maxBoundsViscosity={0.8}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
