"use client";

import type { Feature, FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";
import MapCanvas from "./MapCanvas";
import GeoLayer from "./GeoLayer";

interface MapStageProps {
  data: FeatureCollection;
  getStyle?: (feature?: Feature) => PathOptions;
  onUnitClick?: (id: string) => void;
}

/**
 * Mapa + capa de polígonos listos para el juego. Este módulo importa Leaflet,
 * así que solo puede cargarse en el cliente (vía next/dynamic con ssr: false).
 */
export default function MapStage({ data, getStyle, onUnitClick }: MapStageProps) {
  return (
    <MapCanvas>
      <GeoLayer data={data} getStyle={getStyle} onUnitClick={onUnitClick} />
    </MapCanvas>
  );
}
