"use client";

import { useEffect, useMemo } from "react";
import type { Feature, FeatureCollection } from "geojson";
import L, { type LatLngBounds, type PathOptions } from "leaflet";
import { Marker, useMap } from "react-leaflet";
import MapCanvas from "./MapCanvas";
import GeoLayer from "./GeoLayer";
import type { UnitProperties } from "@/lib/geo";

export interface FocusRequest {
  id: string;
  /** Distingue peticiones seguidas sobre la misma unidad. */
  seq: number;
}

interface MapStageProps {
  data: FeatureCollection;
  getStyle?: (feature?: Feature) => PathOptions;
  onUnitClick?: (id: string) => void;
  /** Unidades acertadas: reciben un ✓ además del color (daltonismo). */
  doneIds?: string[];
  /** Unidad con destello de error: recibe un ✕ transitorio. */
  wrongId?: string | null;
  /** Petición de encuadrar una unidad (botón "ver en el mapa" del modo escribir). */
  focus?: FocusRequest | null;
}

const CHECK_ICON = L.divIcon({
  className: "unit-badge unit-badge-ok",
  html: "✓",
  iconSize: [20, 20],
});

const CROSS_ICON = L.divIcon({
  className: "unit-badge unit-badge-fail",
  html: "✕",
  iconSize: [20, 20],
});

function FocusOn({
  focus,
  boundsById,
}: {
  focus: FocusRequest;
  boundsById: Map<string, LatLngBounds>;
}) {
  const map = useMap();
  useEffect(() => {
    const b = boundsById.get(focus.id);
    if (!b) return;
    const opts = { maxZoom: 11, padding: [40, 40] as [number, number] };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      map.fitBounds(b, opts);
    } else {
      map.flyToBounds(b, { ...opts, duration: 0.8 });
    }
  }, [focus.id, focus.seq, boundsById, map]);
  return null;
}

/**
 * Mapa + capa de polígonos listos para el juego, encuadrado a los datos
 * (el país completo o un solo departamento en niveles locales).
 * Este módulo importa Leaflet, así que solo puede cargarse en el cliente
 * (vía next/dynamic con ssr: false).
 */
export default function MapStage({
  data,
  getStyle,
  onUnitClick,
  doneIds,
  wrongId,
  focus,
}: MapStageProps) {
  const boundsById = useMemo(() => {
    const m = new Map<string, LatLngBounds>();
    for (const f of data.features) {
      const id = (f.properties as UnitProperties).id;
      m.set(id, L.geoJSON(f).getBounds());
    }
    return m;
  }, [data]);

  const bounds = useMemo(() => {
    const b = L.geoJSON(data).getBounds();
    return b.isValid() ? b : undefined;
  }, [data]);

  const wrongBounds = wrongId ? boundsById.get(wrongId) : undefined;

  return (
    <MapCanvas bounds={bounds} maxBounds={bounds?.pad(0.6)}>
      <GeoLayer data={data} getStyle={getStyle} onUnitClick={onUnitClick} />
      {doneIds?.map((id) => {
        const b = boundsById.get(id);
        return b ? (
          <Marker
            key={id}
            position={b.getCenter()}
            icon={CHECK_ICON}
            interactive={false}
            keyboard={false}
          />
        ) : null;
      })}
      {wrongBounds && (
        <Marker
          position={wrongBounds.getCenter()}
          icon={CROSS_ICON}
          interactive={false}
          keyboard={false}
        />
      )}
      {focus && <FocusOn focus={focus} boundsById={boundsById} />}
    </MapCanvas>
  );
}
