import MapView from "@/components/map/MapView";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Peru<span className="text-red-600">Guesser</span>
          </h1>
          <p className="text-sm text-zinc-600">
            Aprende la geografía política del Perú jugando
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          Fase 1 · en construcción
        </span>
      </header>
      <main className="relative flex-1">
        <MapView />
      </main>
    </div>
  );
}
