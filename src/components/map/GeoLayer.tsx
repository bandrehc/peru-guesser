"use client";

import { GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";

// Estilo base tipo Seterra: unidades en amarillo pálido con borde marrón
const baseStyle: PathOptions = {
  fillColor: "#fbf2cc",
  fillOpacity: 1,
  color: "#9b8b5a",
  weight: 1,
};

export default function GeoLayer({ data }: { data: FeatureCollection }) {
  return (
    <GeoJSON
      data={data}
      style={() => baseStyle}
      attribution="Límites: INEI vía geogpsperu.com"
    />
  );
}
