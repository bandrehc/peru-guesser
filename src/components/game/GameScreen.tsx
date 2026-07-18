"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";
import { loadGeo, type UnitProperties } from "@/lib/geo";
import type { UnitRef } from "@/lib/types";
import { useGame } from "@/hooks/useGame";
import GameHud from "./GameHud";
import SummaryModal from "./SummaryModal";

const MapStage = dynamic(() => import("@/components/map/MapStage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500">
      Cargando mapa…
    </div>
  ),
});

const BASE_STYLE: PathOptions = {
  fillColor: "#fbf2cc",
  fillOpacity: 1,
  color: "#9b8b5a",
  weight: 1,
};

// Acierto: verde permanente (el patrón/ícono para daltonismo llega en el paso 8)
const DONE_STYLE: PathOptions = {
  fillColor: "#5cb85c",
  fillOpacity: 1,
  color: "#3d8b3d",
  weight: 1,
};

// Error: destello rojo sobre la unidad clickeada
const FLASH_STYLE: PathOptions = {
  fillColor: "#e05252",
  fillOpacity: 1,
  color: "#b03030",
  weight: 1.5,
};

const FLASH_MS = 650;

export default function GameScreen() {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState(false);
  const { state, start, guess, clearFlash } = useGame();

  useEffect(() => {
    loadGeo("departamentos")
      .then(setGeo)
      .catch(() => setLoadError(true));
  }, []);

  const units = useMemo<UnitRef[]>(() => {
    if (!geo) return [];
    return geo.features.map((f) => {
      const p = f.properties as UnitProperties;
      return { id: p.id, nombre: p.nombre };
    });
  }, [geo]);

  // Arranca la ronda apenas hay datos
  useEffect(() => {
    if (units.length > 0 && state.status === "loading") start(units);
  }, [units, state.status, start]);

  // Apaga el destello rojo tras un momento
  useEffect(() => {
    if (!state.flash) return;
    const id = setTimeout(clearFlash, FLASH_MS);
    return () => clearTimeout(id);
  }, [state.flash, clearFlash]);

  const completadas = useMemo(() => new Set(state.completadas), [state.completadas]);

  const getStyle = useCallback(
    (feature?: Feature): PathOptions => {
      const id = (feature?.properties as UnitProperties | undefined)?.id;
      if (!id) return BASE_STYLE;
      if (state.flash?.unitId === id) return FLASH_STYLE;
      if (completadas.has(id)) return DONE_STYLE;
      return BASE_STYLE;
    },
    [state.flash, completadas]
  );

  const target = state.queue[0] ?? null;
  const total = units.length;
  const perfectas = useMemo(
    () =>
      state.completadas.filter((id) => (state.fallosPorUnidad[id] ?? 0) === 0)
        .length,
    [state.completadas, state.fallosPorUnidad]
  );

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <p className="text-zinc-700">No se pudo cargar el mapa. Revisa tu conexión.</p>
        <Link href="/" className="font-semibold text-red-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-10 flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          ←
        </Link>
        <GameHud
          targetName={target?.nombre ?? null}
          done={state.completadas.length}
          total={total}
          errores={state.errores}
          startedAt={state.startedAt}
          finishedAt={state.finishedAt}
        />
      </header>
      <main className="relative flex-1">
        {geo ? (
          <MapStage data={geo} getStyle={getStyle} onUnitClick={guess} />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Cargando datos…
          </div>
        )}
        {state.status === "finished" && state.finishedAt && (
          <SummaryModal
            total={total}
            perfectas={perfectas}
            errores={state.errores}
            tiempoMs={state.finishedAt - state.startedAt}
            onRestart={() => start(units)}
          />
        )}
      </main>
    </div>
  );
}
