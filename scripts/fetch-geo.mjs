// Descarga los GeoJSON crudos de límites político-administrativos del Perú
// desde josedaniel-cb/limites-peru-geojson hacia data/raw/ (no versionado).
//
// Uso: node scripts/fetch-geo.mjs [departamentos|provincias|distritos|all]
// Por defecto descarga solo el nivel departamental.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL =
  "https://raw.githubusercontent.com/josedaniel-cb/limites-peru-geojson/main";

const FILES = {
  departamentos: "LIM_DEPARTAMENTAL_PERU.json",
  provincias: "LIM_PROVINCIAL_PERU.json",
  distritos: "LIM_DISTRITAL_PERU.json",
};

const RAW_DIR = path.join(import.meta.dirname, "..", "data", "raw");

const arg = process.argv[2] ?? "departamentos";
const levels = arg === "all" ? Object.keys(FILES) : [arg];

for (const level of levels) {
  const file = FILES[level];
  if (!file) {
    console.error(`Nivel desconocido: ${level}. Usa: ${Object.keys(FILES).join(", ")} o all`);
    process.exit(1);
  }
}

await mkdir(RAW_DIR, { recursive: true });

for (const level of levels) {
  const file = FILES[level];
  const dest = path.join(RAW_DIR, file);
  if (existsSync(dest)) {
    console.log(`✓ ${file} ya existe, se omite (borra data/raw para re-descargar)`);
    continue;
  }
  console.log(`Descargando ${file}…`);
  const res = await fetch(`${BASE_URL}/${file}`);
  if (!res.ok) {
    console.error(`Error ${res.status} al descargar ${file}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`✓ ${file} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}
