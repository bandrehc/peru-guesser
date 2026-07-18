export type LevelId = "departamentos" | "provincias" | "distritos";

export type Mode = "pin" | "escribir" | "foto";

/** Referencia mínima a una unidad territorial dentro de una partida. */
export interface UnitRef {
  id: string;
  nombre: string;
}
