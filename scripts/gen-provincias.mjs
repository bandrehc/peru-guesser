// Regenera src/lib/provincias.ts a partir de public/geo/provincias.json
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const geo = JSON.parse(
  await readFile(path.join(ROOT, "public", "geo", "provincias.json"), "utf8")
);

const items = geo.features
  .map((f) => ({ id: f.properties.id, nombre: f.properties.nombre }))
  .sort((a, b) => a.id.localeCompare(b.id));

const lines = items
  .map((p) => `  { id: "${p.id}", nombre: "${p.nombre}" },`)
  .join("\n");

const out = `import type { UnitRef } from "./types";

/**
 * Las 196 provincias (código UBIGEO de 4 dígitos; los 2 primeros son el
 * departamento). Generado por scripts/gen-provincias.mjs; no editar a mano.
 */
export const PROVINCIAS: UnitRef[] = [
${lines}
];
`;

await writeFile(path.join(ROOT, "src", "lib", "provincias.ts"), out);
console.log(`✓ src/lib/provincias.ts (${items.length} provincias)`);
