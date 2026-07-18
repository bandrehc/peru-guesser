// Optimiza los GeoJSON crudos de data/raw/ y los deja listos en public/geo/:
// simplifica la geometría (Visvalingam ponderado, sin perder polígonos),
// recorta la precisión de coordenadas y poda las propiedades al mínimo
// que necesita el juego: { id, nombre } (+ dep/prov en niveles inferiores).
//
// Uso: node scripts/build-geo.mjs [departamentos|provincias|distritos|all]

import { mkdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import mapshaper from "mapshaper";

const ROOT = path.join(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const OUT_DIR = path.join(ROOT, "public", "geo");

const LEVELS = {
  departamentos: {
    raw: "LIM_DEPARTAMENTAL_PERU.json",
    out: "departamentos.json",
    simplify: "3%",
    // CCDD es el código de departamento (2 dígitos); ancla del UBIGEO
    fields: "id=CCDD,nombre=NOMBDEP",
    expected: 25,
  },
  provincias: {
    raw: "LIM_PROVINCIAL_PERU.json",
    out: "provincias.json",
    simplify: "4%",
    fields: "id=IDPROV,nombre=NOMBPROV,dep=NOMBDEP",
    expected: 196,
  },
  distritos: {
    raw: "LIM_DISTRITAL_PERU.json",
    out: null, // se particiona por departamento en distritos/{CCDD}.json
    simplify: "5%",
    fields: "id=UBIGEO,nombre=NOMBDIST,dep=NOMBDEP,prov=NOMBPROV",
    expected: null, // ~1874, varía con la actualización de la fuente
  },
};

const arg = process.argv[2] ?? "departamentos";
const levels = arg === "all" ? Object.keys(LEVELS) : [arg];

await mkdir(OUT_DIR, { recursive: true });

for (const level of levels) {
  const cfg = LEVELS[level];
  if (!cfg) {
    console.error(`Nivel desconocido: ${level}`);
    process.exit(1);
  }
  const rawPath = path.join(RAW_DIR, cfg.raw);
  if (!existsSync(rawPath)) {
    console.error(`Falta ${cfg.raw}. Ejecuta antes: npm run data:fetch -- ${level}`);
    process.exit(1);
  }

  const keep = cfg.fields.split(",").map((f) => f.split("=")[1]);
  const renames = cfg.fields;

  if (level === "distritos") {
    const outDir = path.join(OUT_DIR, "distritos");
    await mkdir(outDir, { recursive: true });
    await mapshaper.runCommands(
      [
        `-i "${rawPath}"`,
        `-simplify visvalingam weighted keep-shapes ${cfg.simplify}`,
        `-filter-fields ${keep.join(",")},CCDD`,
        `-rename-fields ${renames}`,
        `-split CCDD`,
        `-o "${outDir}" format=geojson precision=0.00001`,
      ].join(" ")
    );
    console.log(`✓ distritos particionados en public/geo/distritos/`);
    continue;
  }

  const outPath = path.join(OUT_DIR, cfg.out);
  await mapshaper.runCommands(
    [
      `-i "${rawPath}"`,
      `-simplify visvalingam weighted keep-shapes ${cfg.simplify}`,
      `-filter-fields ${keep.join(",")}`,
      `-rename-fields ${renames}`,
      `-o "${outPath}" format=geojson precision=0.00001`,
    ].join(" ")
  );

  // Validación: conteo de features e ids únicos
  const geo = JSON.parse(await readFile(outPath, "utf8"));
  const n = geo.features.length;
  const ids = new Set(geo.features.map((f) => f.properties.id));
  const kb = ((await stat(outPath)).size / 1024).toFixed(0);
  const countOk = cfg.expected === null || n === cfg.expected;
  const idsOk = ids.size === n;
  console.log(
    `${countOk && idsOk ? "✓" : "✗"} ${cfg.out}: ${n} features` +
      (cfg.expected ? ` (esperadas ${cfg.expected})` : "") +
      `, ${ids.size} ids únicos, ${kb} KB`
  );
  if (!countOk || !idsOk) process.exit(1);
}
