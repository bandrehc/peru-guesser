"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";
import type { PathOptions } from "leaflet";
import { loadGeo, type UnitProperties } from "@/lib/geo";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import type { UnitRef } from "@/lib/types";
import { useGame } from "@/hooks/useGame";
import GameHud from "./GameHud";
import SummaryModal from "./SummaryModal";
import fotosBanco from "@/data/fotos-departamentos.json";

const MapStage = dynamic(() => import("@/components/map/MapStage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500">
      Cargando mapa…
    </div>
  ),
});

interface FotoItem {
  dep: string;
  titulo: string;
  url: string;
  pagina: string;
  autor: string;
  licencia: string;
  licenciaUrl: string | null;
  lat: number;
  lng: number;
}

const BASE_STYLE: PathOptions = {
  fillColor: "#fbf2cc",
  fillOpacity: 1,
  color: "#9b8b5a",
  weight: 1,
};

const DONE_STYLE: PathOptions = {
  fillColor: "#5cb85c",
  fillOpacity: 1,
  color: "#3d8b3d",
  weight: 1,
};

const FLASH_STYLE: PathOptions = {
  fillColor: "#e05252",
  fillOpacity: 1,
  color: "#b03030",
  weight: 1.5,
};

const FLASH_MS = 650;
const REVEAL_MS = 1800;
const FOTOS_POR_RONDA = 10;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function PhotoGameScreen() {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Mensaje tras cada foto: "¡Correcto!" o "Era X"
  const [reveal, setReveal] = useState<{ ok: boolean; texto: string } | null>(null);
  const { state, start, resolve, clearFlash } = useGame();

  // Una foto aleatoria por departamento para la ronda actual
  const [fotosRonda, setFotosRonda] = useState<Record<string, FotoItem>>({});

  const startRound = useCallback(() => {
    const banco = fotosBanco as FotoItem[];
    const porDep = new Map<string, FotoItem[]>();
    for (const f of banco) {
      porDep.set(f.dep, [...(porDep.get(f.dep) ?? []), f]);
    }
    const deps = shuffle([...porDep.keys()]).slice(0, FOTOS_POR_RONDA);
    const seleccion: Record<string, FotoItem> = {};
    const units: UnitRef[] = deps.map((dep) => {
      const fotos = porDep.get(dep)!;
      seleccion[dep] = fotos[Math.floor(Math.random() * fotos.length)];
      return {
        id: dep,
        nombre: DEPARTAMENTOS.find((d) => d.id === dep)?.nombre ?? dep,
      };
    });
    setFotosRonda(seleccion);
    setReveal(null);
    start(units);
  }, [start]);

  useEffect(() => {
    let cancelled = false;
    loadGeo("departamentos")
      .then((data) => {
        if (cancelled) return;
        setGeo(data);
        startRound();
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [startRound]);

  useEffect(() => {
    if (!state.flash) return;
    const id = setTimeout(clearFlash, FLASH_MS);
    return () => clearTimeout(id);
  }, [state.flash, clearFlash]);

  useEffect(() => {
    if (!reveal) return;
    const id = setTimeout(() => setReveal(null), REVEAL_MS);
    return () => clearTimeout(id);
  }, [reveal]);

  const completadas = useMemo(() => new Set(state.completadas), [state.completadas]);
  const target = state.queue[0] ?? null;
  const foto = target ? fotosRonda[target.id] : null;
  const total = Object.keys(fotosRonda).length;
  const nroFoto = total - state.queue.length + (target ? 1 : 0);

  const handleUnitClick = useCallback(
    (id: string) => {
      if (!target || state.status !== "playing") return;
      const ok = id === target.id;
      // Una sola oportunidad por foto: si falla, igual se avanza
      resolve(ok, ok ? null : id, true);
      setReveal({ ok, texto: ok ? "¡Correcto!" : `Era ${target.nombre}` });
    },
    [target, state.status, resolve]
  );

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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="focus-hilo rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-700 transition-colors duration-200 ease-in-out hover:border-carmesi/50 hover:bg-zinc-50"
          >
            ←
          </Link>
          <span className="shrink-0 rounded-full bg-carmesi/10 px-2.5 py-0.5 text-xs font-medium text-carmesi-ink">
            Foto {Math.min(nroFoto, total)} de {total}
          </span>
          <GameHud
            prompt={
              <span className="font-semibold text-zinc-900">
                ¿En qué departamento se tomó esta foto?
              </span>
            }
            done={state.completadas.length}
            total={total}
            errores={state.errores}
            startedAt={state.startedAt}
            finishedAt={state.finishedAt}
          />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="relative h-56 shrink-0 border-b border-zinc-200 bg-zinc-900 md:h-auto md:w-96 md:border-b-0 md:border-r">
          {foto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt="Fotografía tomada en algún lugar del Perú"
                className="h-full w-full object-contain"
              />
              <p className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[11px] leading-tight text-zinc-200">
                {foto.autor} ·{" "}
                {foto.licenciaUrl ? (
                  <a
                    href={foto.licenciaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {foto.licencia}
                  </a>
                ) : (
                  foto.licencia
                )}{" "}
                ·{" "}
                <a
                  href={foto.pagina}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Wikimedia Commons
                </a>
              </p>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              {state.status === "finished" ? "Ronda terminada" : "Cargando foto…"}
            </div>
          )}
          {reveal && (
            <p
              aria-live="polite"
              className={
                "absolute left-1/2 top-2 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-bold text-white shadow " +
                (reveal.ok ? "bg-emerald-600" : "bg-carmesi")
              }
            >
              {reveal.texto}
            </p>
          )}
        </aside>
        <div className="relative min-h-0 flex-1">
          {geo ? (
            <MapStage
              data={geo}
              getStyle={getStyle}
              onUnitClick={handleUnitClick}
              doneIds={state.completadas}
              wrongId={state.flash?.unitId ?? null}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Cargando datos…
            </div>
          )}
          {state.status === "finished" && state.finishedAt && (
            <SummaryModal
              variant="foto"
              total={total}
              perfectas={state.completadas.length}
              errores={state.errores}
              tiempoMs={state.finishedAt - state.startedAt}
              onRestart={startRound}
            />
          )}
        </div>
      </main>
    </div>
  );
}
