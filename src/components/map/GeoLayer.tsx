"use client";

import { useEffect, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { GeoJSON as LeafletGeoJSON, PathOptions } from "leaflet";
import type { UnitProperties } from "@/lib/geo";

// Estilo base tipo Seterra: unidades en amarillo pálido con borde marrón
export const BASE_STYLE: PathOptions = {
  fillColor: "#fbf2cc",
  fillOpacity: 1,
  color: "#9b8b5a",
  weight: 1,
};

interface GeoLayerProps {
  data: FeatureCollection;
  /** Estilo por feature según el estado del juego; si falta, estilo base. */
  getStyle?: (feature?: Feature) => PathOptions;
  onUnitClick?: (id: string) => void;
}

export default function GeoLayer({ data, getStyle, onUnitClick }: GeoLayerProps) {
  const layerRef = useRef<LeafletGeoJSON>(null);

  // La capa GeoJSON de Leaflet se crea una sola vez; los handlers y el estilo
  // se leen vía refs para que siempre usen el estado más reciente.
  const getStyleRef = useRef(getStyle);
  const onClickRef = useRef(onUnitClick);

  useEffect(() => {
    getStyleRef.current = getStyle;
    onClickRef.current = onUnitClick;
    layerRef.current?.setStyle((f) => getStyleRef.current?.(f) ?? BASE_STYLE);
  }, [getStyle, onUnitClick]);

  return (
    <GeoJSON
      ref={layerRef}
      data={data}
      style={(f) => getStyleRef.current?.(f) ?? BASE_STYLE}
      onEachFeature={(feature, layer) => {
        layer.on("click", () => {
          const props = feature.properties as UnitProperties;
          onClickRef.current?.(props.id);
        });
      }}
      attribution="Límites: INEI vía geogpsperu.com"
    />
  );
}
