"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { PROVINCIAS } from "@/lib/provincias";

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
    detalle: "1874 distritos, por departamento o provincia",
    disponible: true,
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
    detalle: "¿Dónde se tomó esta foto? (nivel departamental)",
    disponible: true,
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
    "card-int rounded-xl border p-4 text-left " +
    (seleccionado
      ? "border-carmesi bg-white ring-1 ring-carmesi shadow-[0_2px_10px_rgba(217,20,56,0.10)]"
      : disponible
        ? "border-zinc-200 bg-white hover:border-carmesi/50"
        : "border-zinc-200 bg-zinc-50 opacity-60");

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-tinta">{nombre}</span>
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

const ALCANCES = [
  {
    id: "total",
    nombre: "Total",
    detalle: "Las 196 provincias de todo el país",
  },
  {
    id: "local",
    nombre: "Local",
    detalle: "Solo las provincias de un departamento",
  },
];

const SELECT_CLASS =
  "focus-hilo mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-tinta shadow-sm outline-none transition-colors duration-200 ease-in-out focus:border-carmesi sm:max-w-xs";

export default function Home() {
  const [nivel, setNivel] = useState("departamentos");
  const [modo, setModo] = useState("pin");
  const [alcance, setAlcance] = useState("total");
  const [dep, setDep] = useState("15"); // Lima por defecto
  // "" = todas las provincias del departamento
  const [prov, setProv] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const necesitaDep =
    modo !== "foto" &&
    (nivel === "distritos" || (nivel === "provincias" && alcance === "local"));

  // El filtro de provincia solo aplica al nivel distrital
  const necesitaProv = necesitaDep && nivel === "distritos";

  const provinciasDelDep = useMemo(
    () =>
      PROVINCIAS.filter((p) => p.id.startsWith(dep)).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es")
      ),
    [dep]
  );

  const cambiaDep = (id: string) => {
    setDep(id);
    setProv(""); // la provincia elegida pertenece al departamento anterior
  };

  // El modo fotográfico solo existe a nivel departamental en esta fase
  const seleccionaModo = (id: string) => {
    setModo(id);
    if (id === "foto") setNivel("departamentos");
  };

  // Animaciones de entrada (solo envoltorio visual; la lógica de arriba no
  // depende de ellas). Todo dentro de gsap.matchMedia: se limpia al desmontar
  // y respeta prefers-reduced-motion.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia(rootRef);

    mm.add(
      {
        motionOk: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 640px) and (pointer: fine)",
      },
      (ctx) => {
        const { motionOk, desktop } = ctx.conditions as {
          motionOk: boolean;
          desktop: boolean;
        };
        if (!motionOk) return;

        const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");

        if (desktop) {
          // Escritorio: el contenido "se teje" en secuencia mientras el
          // preloader levanta la cortina.
          gsap
            .timeline({ delay: 0.45, defaults: { ease: "power3.out" } })
            .fromTo(
              reveals,
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.15 }
            )
            .fromTo(
              "[data-hilo]",
              { scaleX: 0 },
              { scaleX: 1, duration: 0.5, stagger: 0.1 },
              "<0.25"
            );

          // Parallax sutil de los hilos decorativos, ligado al scroll
          gsap.to("[data-parallax]", {
            y: -90,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });

          // CTA magnético: leve atracción hacia el cursor
          const cta = ctaRef.current;
          if (cta) {
            const xTo = gsap.quickTo(cta, "x", { duration: 0.4, ease: "power3" });
            const yTo = gsap.quickTo(cta, "y", { duration: 0.4, ease: "power3" });
            const onMove = (e: MouseEvent) => {
              const r = cta.getBoundingClientRect();
              xTo(gsap.utils.clamp(-8, 8, (e.clientX - (r.left + r.width / 2)) * 0.06));
              yTo(gsap.utils.clamp(-6, 6, (e.clientY - (r.top + r.height / 2)) * 0.18));
            };
            const onLeave = () => {
              xTo(0);
              yTo(0);
            };
            cta.addEventListener("mousemove", onMove);
            cta.addEventListener("mouseleave", onLeave);
            return () => {
              cta.removeEventListener("mousemove", onMove);
              cta.removeEventListener("mouseleave", onLeave);
            };
          }
        } else {
          // Móvil: revelado simplificado, ligado a la entrada en viewport
          for (const el of reveals) {
            gsap.fromTo(
              el,
              { y: 16, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 88%" },
              }
            );
          }
          gsap.set("[data-hilo]", { scaleX: 1 });
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="bg-telar relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-10"
    >
      {/* Hilos decorativos verticales (parallax en escritorio) */}
      <div
        aria-hidden="true"
        data-parallax
        className="pointer-events-none absolute -top-[10%] right-[6%] hidden h-[120%] w-28 justify-between opacity-15 sm:flex"
      >
        <div className="w-px bg-gradient-to-b from-transparent via-carmesi to-transparent" />
        <div className="w-px bg-gradient-to-b from-transparent via-hilo to-transparent" />
        <div className="w-px bg-gradient-to-b from-transparent via-tinta to-transparent" />
      </div>

      <main className="relative w-full max-w-2xl">
        <div data-reveal>
          <h1 className="text-4xl font-bold tracking-tight text-tinta sm:text-5xl">
            Peru<span className="text-carmesi">Guesser</span>
          </h1>
          <div data-hilo className="hilo-sep mt-3 w-16" />
          <p className="mt-4 text-lg text-zinc-600">
            Aprende la geografía política del Perú jugando: departamentos,
            provincias y distritos.
          </p>
        </div>

        <div data-reveal>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Nivel
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {NIVELES.map((n) => (
              <OptionCard
                key={n.id}
                nombre={n.nombre}
                detalle={n.detalle}
                disponible={n.disponible && (modo !== "foto" || n.id === "departamentos")}
                seleccionado={n.id === nivel}
                onSelect={() => setNivel(n.id)}
              />
            ))}
          </div>
        </div>

        {nivel === "provincias" && modo !== "foto" && (
          <div className="animate-rise mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Alcance
            </h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {ALCANCES.map((a) => (
                <OptionCard
                  key={a.id}
                  nombre={a.nombre}
                  detalle={a.detalle}
                  disponible
                  seleccionado={a.id === alcance}
                  onSelect={() => setAlcance(a.id)}
                />
              ))}
            </div>
          </div>
        )}

        {necesitaDep && (
          <div className="animate-rise mt-4">
            <label
              htmlFor="dep-select"
              className="text-sm font-semibold uppercase tracking-widest text-zinc-500"
            >
              Departamento
            </label>
            <select
              id="dep-select"
              value={dep}
              onChange={(e) => cambiaDep(e.target.value)}
              className={SELECT_CLASS}
            >
              {DEPARTAMENTOS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {necesitaProv && (
          <div className="animate-rise mt-4">
            <label
              htmlFor="prov-select"
              className="text-sm font-semibold uppercase tracking-widest text-zinc-500"
            >
              Provincia
            </label>
            <select
              id="prov-select"
              value={prov}
              onChange={(e) => setProv(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Todas las provincias</option>
              {provinciasDelDep.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div data-reveal>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-zinc-500">
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
                onSelect={() => seleccionaModo(m.id)}
              />
            ))}
          </div>
        </div>

        <div data-reveal ref={ctaRef} className="mt-10 will-change-transform">
          <Link
            href={`/play?nivel=${nivel}&modo=${modo}${necesitaDep ? `&dep=${dep}` : ""}${necesitaProv && prov ? `&prov=${prov}` : ""}`}
            className="focus-hilo block w-full rounded-xl bg-carmesi px-6 py-4 text-center text-lg font-bold text-white shadow-[0_8px_24px_rgba(217,20,56,0.25)] transition-all duration-200 ease-in-out hover:bg-carmesi-ink hover:shadow-[0_10px_28px_rgba(217,20,56,0.32)] active:scale-[0.98]"
          >
            Jugar
          </Link>
        </div>

        <p data-reveal className="mt-8 text-center text-xs text-zinc-400">
          Límites político-administrativos: INEI, vía geogpsperu.com
        </p>
      </main>
    </div>
  );
}
