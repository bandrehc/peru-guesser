"use client";

import Link from "next/link";
import { useState } from "react";

const NIVELES = [
  {
    id: "departamentos",
    nombre: "Departamental / Regional",
    detalle: "24 departamentos + Callao",
    disponible: true,
  },
  {
    id: "provincias",
    nombre: "Provincial",
    detalle: "196 provincias",
    disponible: true,
  },
  {
    id: "distritos",
    nombre: "Distrital",
    detalle: "~1874 distritos",
    disponible: false,
  },
];

const MODOS = [
  {
    id: "pin",
    nombre: "Pin",
    detalle: "Te damos el nombre, haz clic en el mapa",
    disponible: true,
  },
  {
    id: "escribir",
    nombre: "Escribir",
    detalle: "Resaltamos la unidad, escribe su nombre",
    disponible: true,
  },
  {
    id: "foto",
    nombre: "Fotográfico",
    detalle: "¿Dónde se tomó esta foto?",
    disponible: false,
  },
];

function OptionCard({
  nombre,
  detalle,
  disponible,
  seleccionado,
  onSelect,
}: {
  nombre: string;
  detalle: string;
  disponible: boolean;
  seleccionado: boolean;
  onSelect?: () => void;
}) {
  const className =
    "rounded-xl border p-4 text-left transition-colors " +
    (seleccionado
      ? "border-red-600 bg-red-50 ring-1 ring-red-600"
      : disponible
        ? "border-zinc-300 bg-white hover:border-red-400"
        : "border-zinc-200 bg-zinc-50 opacity-60");

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-zinc-900">{nombre}</span>
        {!disponible && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Próximamente
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-600">{detalle}</p>
    </>
  );

  if (!disponible) return <div className={className}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={seleccionado}
      className={className + " cursor-pointer"}
    >
      {content}
    </button>
  );
}

export default function Home() {
  const [nivel, setNivel] = useState("departamentos");
  const [modo, setModo] = useState("pin");

  return (
    <div className="flex min-h-dvh flex-col items-center bg-zinc-50 px-4 py-10">
      <main className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Peru<span className="text-red-600">Guesser</span>
        </h1>
        <p className="mt-2 text-lg text-zinc-600">
          Aprende la geografía política del Perú jugando: departamentos,
          provincias y distritos.
        </p>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nivel
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {NIVELES.map((n) => (
            <OptionCard
              key={n.id}
              nombre={n.nombre}
              detalle={n.detalle}
              disponible={n.disponible}
              seleccionado={n.id === nivel}
              onSelect={() => setNivel(n.id)}
            />
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Modo
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {MODOS.map((m) => (
            <OptionCard
              key={m.id}
              nombre={m.nombre}
              detalle={m.detalle}
              disponible={m.disponible}
              seleccionado={m.id === modo}
              onSelect={() => setModo(m.id)}
            />
          ))}
        </div>

        <Link
          href={`/play?nivel=${nivel}&modo=${modo}`}
          className="mt-10 block w-full rounded-xl bg-red-600 px-6 py-4 text-center text-lg font-bold text-white shadow-md transition-colors hover:bg-red-700"
        >
          Jugar
        </Link>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Límites político-administrativos: INEI, vía geogpsperu.com
        </p>
      </main>
    </div>
  );
}
