// Regenera src/lib/departamentos.ts a partir de public/geo/departamentos.json
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const geo = JSON.parse(
  await readFile(path.join(ROOT, "public", "geo", "departamentos.json"), "utf8")
);

const items = geo.features
  .map((f) => ({ id: f.properties.id, nombre: f.properties.nombre }))
  .sort((a, b) => a.id.localeCompare(b.id));

const lines = items
  .map((d) => `  { id: "${d.id}", nombre: "${d.nombre}" },`)
  .join("\n");

const out = `import type { UnitRef } from "./types";

/**
 * Los 25 departamentos (código UBIGEO de 2 dígitos).
 * Generado por scripts/gen-departamentos.mjs; no editar a mano.
 */
export const DEPARTAMENTOS: UnitRef[] = [
${lines}
];
`;

await writeFile(path.join(ROOT, "src", "lib", "departamentos.ts"), out);
console.log(`✓ src/lib/departamentos.ts (${items.length} departamentos)`);
