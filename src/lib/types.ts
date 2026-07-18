export type LevelId = "departamentos" | "provincias" | "distritos";

export type Mode = "pin" | "escribir" | "foto";

/** Referencia mínima a una unidad territorial dentro de una partida. */
export interface UnitRef {
  id: string;
  /** Nombre a mostrar; puede llevar sufijo desambiguador, ej. "SAN ANTONIO (CAÑETE)". */
  nombre: string;
  /** Nombre base sin desambiguar, aceptado también como respuesta escrita. */
  alias?: string;
}
