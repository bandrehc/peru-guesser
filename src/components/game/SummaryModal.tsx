"use client";

import Link from "next/link";
import { formatTime } from "./GameHud";

interface SummaryModalProps {
  total: number;
  perfectas: number;
  errores: number;
  tiempoMs: number;
  onRestart: () => void;
  /** "identificacion": rondas pin/escribir; "foto": una oportunidad por foto. */
  variant?: "identificacion" | "foto";
}

export default function SummaryModal({
  total,
  perfectas,
  errores,
  tiempoMs,
  onRestart,
  variant = "identificacion",
}: SummaryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
      className="animate-backdrop-in absolute inset-0 z-[1000] flex items-center justify-center bg-tinta/45 p-4 backdrop-blur-sm"
    >
      <div className="animate-modal-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="summary-title" className="text-2xl font-bold text-tinta">
          ¡Ronda completada! 🎉
        </h2>
        <div className="hilo-sep mt-3 w-14" />
        <dl className="mt-4 space-y-2 text-zinc-700">
          <div className="flex justify-between">
            <dt>{variant === "foto" ? "Fotos jugadas" : "Unidades identificadas"}</dt>
            <dd className="font-semibold tabular-nums">{total}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{variant === "foto" ? "Aciertos" : "Al primer intento"}</dt>
            <dd className="font-semibold tabular-nums text-emerald-700">
              {perfectas} ({Math.round((perfectas / total) * 100)}%)
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Errores</dt>
            <dd className="font-semibold tabular-nums text-carmesi">{errores}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tiempo</dt>
            <dd className="font-semibold tabular-nums">{formatTime(tiempoMs)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onRestart}
            autoFocus
            className="focus-hilo flex-1 rounded-lg bg-carmesi px-4 py-2 font-semibold text-white shadow-[0_4px_14px_rgba(217,20,56,0.25)] transition-all duration-200 ease-in-out hover:bg-carmesi-ink active:scale-[0.98]"
          >
            Jugar de nuevo
          </button>
          <Link
            href="/"
            className="focus-hilo flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-center font-semibold text-zinc-700 transition-colors duration-200 ease-in-out hover:border-carmesi/50 hover:bg-zinc-50"
          >
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
