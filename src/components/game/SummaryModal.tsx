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
      className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="summary-title" className="text-2xl font-bold text-zinc-900">
          ¡Ronda completada! 🎉
        </h2>
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
            <dd className="font-semibold tabular-nums text-red-600">{errores}</dd>
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
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
          >
            Jugar de nuevo
          </button>
          <Link
            href="/"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-center font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
