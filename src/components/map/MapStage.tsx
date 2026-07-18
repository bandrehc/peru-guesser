"use client";

import { useMemo } from "react";
import type { Feature, FeatureCollection } from "geojson";
import L, { type PathOptions } from "leaflet";
import MapCanvas from "./MapCanvas";
import GeoLayer from "./GeoLayer";

interface MapStageProps {
  data: FeatureCollection;
  getStyle?: (feature?: Feature) => PathOptions;
  onUnitClick?: (id: string) => void;
}

/**
 * Mapa + capa de polígonos listos para el juego, encuadrado a los datos
 * (el país completo o un solo departamento en el nivel distrital).
 * Este módulo importa Leaflet, así que solo puede cargarse en el cliente
 * (vía next/dynamic con ssr: false).
 */
export default function MapStage({ data, getStyle, onUnitClick }: MapStageProps) {
  const bounds = useMemo(() => {
    const b = L.geoJSON(data).getBounds();
    return b.isValid() ? b : undefined;
  }, [data]);

  return (
    <MapCanvas bounds={bounds} maxBounds={bounds?.pad(0.6)}>
      <GeoLayer data={data} getStyle={getStyle} onUnitClick={onUnitClick} />
    </MapCanvas>
  );
}
