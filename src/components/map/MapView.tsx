"use client";

import dynamic from "next/dynamic";

// Leaflet accede a `window`, así que el mapa solo puede montarse en el cliente.
const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500">
      Cargando mapa…
    </div>
  ),
});

export default function MapView() {
  return <MapCanvas />;
}
