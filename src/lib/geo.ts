import type { FeatureCollection } from "geojson";

export type Level = "departamentos" | "provincias" | "distritos";

/** Propiedades mínimas de cada unidad territorial en los GeoJSON optimizados. */
export interface UnitProperties {
  /** Código UBIGEO (2 dígitos dep., 4 prov., 6 dist.) */
  id: string;
  nombre: string;
  dep?: string;
  prov?: string;
}

const cache = new Map<string, FeatureCollection>();

/**
 * Carga un nivel completo servido como estático desde public/geo.
 * (El nivel distrital se carga por departamento: /geo/distritos/{ccdd}.json)
 */
export async function loadGeo(
  level: "departamentos" | "provincias"
): Promise<FeatureCollection> {
  const cached = cache.get(level);
  if (cached) return cached;
  const res = await fetch(`/geo/${level}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar /geo/${level}.json (${res.status})`);
  const data = (await res.json()) as FeatureCollection;
  cache.set(level, data);
  return data;
}
