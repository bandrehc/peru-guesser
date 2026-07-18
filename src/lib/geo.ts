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

async function fetchGeo(path: string): Promise<FeatureCollection> {
  const cached = cache.get(path);
  if (cached) return cached;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
  const data = (await res.json()) as FeatureCollection;
  cache.set(path, data);
  return data;
}

/** Carga un nivel completo servido como estático desde public/geo. */
export function loadGeo(
  level: "departamentos" | "provincias"
): Promise<FeatureCollection> {
  return fetchGeo(`/geo/${level}.json`);
}

/**
 * Carga perezosa del nivel distrital: solo los distritos del departamento
 * indicado (ccdd = código UBIGEO de 2 dígitos), servidos como archivo aparte.
 */
export function loadDistritos(ccdd: string): Promise<FeatureCollection> {
  return fetchGeo(`/geo/distritos/${ccdd}.json`);
}
