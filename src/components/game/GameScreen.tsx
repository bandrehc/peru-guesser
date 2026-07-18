"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";
import { loadDistritos, loadGeo, type UnitProperties } from "@/lib/geo";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { PROVINCIAS } from "@/lib/provincias";
import { normalizeName } from "@/lib/normalize";
import type { UnitRef } from "@/lib/types";
import { useGame } from "@/hooks/useGame";
import GameHud from "./GameHud";
import SummaryModal from "./SummaryModal";
import TypeAnswerInput from "./TypeAnswerInput";

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

// Error: destello rojo
const FLASH_STYLE: PathOptions = {
  fillColor: "#e05252",
  fillOpacity: 1,
  color: "#b03030",
  weight: 1.5,
};

// Modo escribir: unidad objetivo resaltada
const TARGET_STYLE: PathOptions = {
  fillColor: "#f6b93b",
  fillOpacity: 1,
  color: "#8a5a00",
  weight: 2,
};

const FLASH_MS = 650;
const RESULT_MS = 1200;

export type PlayableMode = "pin" | "escribir";
export type PlayableLevel = "departamentos" | "provincias" | "distritos";

const ESCRIBIR_PROMPT: Record<PlayableLevel, string> = {
  departamentos: "¿Qué departamento está resaltado?",
  provincias: "¿Qué provincia está resaltada?",
  distritos: "¿Qué distrito está resaltado?",
};

export default function GameScreen({
  nivel,
  modo,
  dep,
  prov,
}: {
  nivel: PlayableLevel;
  modo: PlayableMode;
  /**
   * Código UBIGEO del departamento. Requerido cuando nivel === "distritos";
   * opcional en "provincias" (alcance local: solo las provincias de ese
   * departamento, mostrando únicamente su polígono).
   */
  dep?: string;
  /**
   * Código UBIGEO de provincia (4 dígitos). Solo en nivel "distritos":
   * acota la ronda a los distritos de esa provincia.
   */
  prov?: string;
}) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lastResult, setLastResult] = useState<"ok" | "fail" | null>(null);
  const [focus, setFocus] = useState<{ id: string; seq: number } | null>(null);
  const { state, start, resolve, clearFlash } = useGame();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let data =
          nivel === "distritos" && dep
            ? await loadDistritos(dep)
            : await loadGeo(nivel as "departamentos" | "provincias");
        // Alcance local del nivel provincial: solo las provincias del
        // departamento elegido (sus 2 primeros dígitos de UBIGEO)
        if (nivel === "provincias" && dep) {
          data = {
            ...data,
            features: data.features.filter((f) =>
              (f.properties as UnitProperties).id.startsWith(dep)
            ),
          };
        }
        // Filtro provincial del nivel distrital: solo los distritos de la
        // provincia elegida (sus 4 primeros dígitos de UBIGEO)
        if (nivel === "distritos" && prov) {
          data = {
            ...data,
            features: data.features.filter((f) =>
              (f.properties as UnitProperties).id.startsWith(prov)
            ),
          };
        }
        if (!cancelled) setGeo(data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nivel, dep, prov]);

  const units = useMemo<UnitRef[]>(() => {
    if (!geo) return [];
    // Nombres repetidos dentro de la ronda (ej. dos "SAN ANTONIO" en Lima)
    // se desambiguan con la provincia; el nombre base queda como alias.
    const repetidos = new Map<string, number>();
    for (const f of geo.features) {
      const n = (f.properties as UnitProperties).nombre;
      repetidos.set(n, (repetidos.get(n) ?? 0) + 1);
    }
    return geo.features.map((f) => {
      const p = f.properties as UnitProperties;
      if ((repetidos.get(p.nombre) ?? 0) > 1 && p.prov) {
        return { id: p.id, nombre: `${p.nombre} (${p.prov})`, alias: p.nombre };
      }
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

  // Apaga el mensaje de correcto/incorrecto del input
  useEffect(() => {
    if (!lastResult) return;
    const id = setTimeout(() => setLastResult(null), RESULT_MS);
    return () => clearTimeout(id);
  }, [lastResult]);

  const completadas = useMemo(() => new Set(state.completadas), [state.completadas]);
  const target = state.queue[0] ?? null;

  const handleUnitClick = useCallback(
    (id: string) => {
      if (modo !== "pin" || !target || state.status !== "playing") return;
      // Clic sobre una unidad ya completada: no cuenta como error
      if (completadas.has(id)) return;
      resolve(id === target.id, id === target.id ? null : id);
    },
    [modo, target, state.status, completadas, resolve]
  );

  const handleAnswer = useCallback(
    (text: string) => {
      if (!target || state.status !== "playing") return;
      const typed = normalizeName(text);
      const ok =
        typed === normalizeName(target.nombre) ||
        (target.alias !== undefined && typed === normalizeName(target.alias));
      // En error, el destello rojo cae sobre la unidad resaltada
      resolve(ok, ok ? null : target.id);
      setLastResult(ok ? "ok" : "fail");
    },
    [target, state.status, resolve]
  );

  const getStyle = useCallback(
    (feature?: Feature): PathOptions => {
      const id = (feature?.properties as UnitProperties | undefined)?.id;
      if (!id) return BASE_STYLE;
      if (state.flash?.unitId === id) return FLASH_STYLE;
      if (completadas.has(id)) return DONE_STYLE;
      if (modo === "escribir" && target?.id === id) return TARGET_STYLE;
      return BASE_STYLE;
    },
    [state.flash, completadas, modo, target]
  );

  const remainingNames = useMemo(
    () => state.queue.map((u) => u.nombre).sort((a, b) => a.localeCompare(b, "es")),
    [state.queue]
  );

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
      <header className="z-10 border-b border-zinc-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="focus-hilo rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-700 transition-colors duration-200 ease-in-out hover:border-carmesi/50 hover:bg-zinc-50"
          >
            ←
          </Link>
          {dep && nivel !== "departamentos" && (
            <span className="shrink-0 rounded-full bg-carmesi/10 px-2.5 py-0.5 text-xs font-medium text-carmesi-ink">
              {nivel === "distritos" ? "Distritos" : "Provincias"} de{" "}
              {prov
                ? `${PROVINCIAS.find((p) => p.id === prov)?.nombre ?? prov} (${
                    DEPARTAMENTOS.find((d) => d.id === dep)?.nombre ?? dep
                  })`
                : (DEPARTAMENTOS.find((d) => d.id === dep)?.nombre ?? dep)}
            </span>
          )}
          <GameHud
            prompt={
              modo === "pin" ? (
                <>
                  <span className="text-zinc-500">Encuentra: </span>
                  <span className="font-bold text-zinc-900">
                    {target?.nombre ?? "—"}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-zinc-900">
                  {ESCRIBIR_PROMPT[nivel]}
                </span>
              )
            }
            done={state.completadas.length}
            total={total}
            errores={state.errores}
            startedAt={state.startedAt}
            finishedAt={state.finishedAt}
          />
        </div>
        {modo === "escribir" && state.status === "playing" && (
          <div className="mt-2 flex items-start gap-2">
            <div className="flex-1">
              <TypeAnswerInput
                options={remainingNames}
                onSubmit={handleAnswer}
                result={lastResult}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                target &&
                setFocus((f) => ({ id: target.id, seq: (f?.seq ?? 0) + 1 }))
              }
              title="Encuadrar la unidad resaltada en el mapa"
              className="focus-hilo shrink-0 rounded-lg border-2 border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 transition-colors duration-200 ease-in-out hover:border-carmesi/50 hover:bg-zinc-50"
            >
              📍 <span className="hidden sm:inline">Ver en el mapa</span>
            </button>
          </div>
        )}
      </header>
      <main className="relative flex-1">
        {geo ? (
          <MapStage
            data={geo}
            getStyle={getStyle}
            onUnitClick={modo === "pin" ? handleUnitClick : undefined}
            doneIds={state.completadas}
            wrongId={state.flash?.unitId ?? null}
            focus={focus}
          />
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
