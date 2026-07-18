// Genera el banco de fotos del modo Fotográfico (nivel departamental) desde
// Wikimedia Commons: busca imágenes geolocalizadas alrededor de la capital de
// cada departamento, filtra calidad/licencia y verifica con punto-en-polígono
// contra public/geo/departamentos.json que la foto cae dentro del departamento
// que se dará por respuesta correcta.
//
// Salida: src/data/fotos-departamentos.json (curable a mano después).
// Uso: node scripts/fetch-fotos.mjs
//
// Nota: Mapillary (fuente principal recomendada en el plan) requiere token.
// Cuando exista MAPILLARY_TOKEN se puede añadir aquí una segunda pasada.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const OUT_PATH = path.join(ROOT, "src", "data", "fotos-departamentos.json");
const UA = "PeruGuesser/0.1 (juego educativo; ba.herrerac@alum.up.edu.pe)";
const MAX_POR_DEP = 6;
const RADIO_M = 10000; // máximo permitido por la API

// Capital de cada departamento como punto de búsqueda
const CAPITALES = [
  { ccdd: "01", lat: -6.229, lng: -77.871 }, // Chachapoyas
  { ccdd: "02", lat: -9.5278, lng: -77.5278 }, // Huaraz
  { ccdd: "03", lat: -13.6373, lng: -72.8814 }, // Abancay
  { ccdd: "04", lat: -16.409, lng: -71.5375 }, // Arequipa
  { ccdd: "05", lat: -13.1588, lng: -74.2239 }, // Ayacucho
  { ccdd: "06", lat: -7.1638, lng: -78.5003 }, // Cajamarca
  { ccdd: "07", lat: -12.0508, lng: -77.126 }, // Callao
  { ccdd: "08", lat: -13.532, lng: -71.9675 }, // Cusco
  { ccdd: "09", lat: -12.7862, lng: -74.976 }, // Huancavelica
  { ccdd: "10", lat: -9.9306, lng: -76.2422 }, // Huánuco
  { ccdd: "11", lat: -14.0678, lng: -75.7286 }, // Ica
  { ccdd: "12", lat: -12.0651, lng: -75.2049 }, // Huancayo
  { ccdd: "13", lat: -8.112, lng: -79.0288 }, // Trujillo
  { ccdd: "14", lat: -6.7714, lng: -79.8409 }, // Chiclayo
  { ccdd: "15", lat: -12.0464, lng: -77.0428 }, // Lima
  { ccdd: "16", lat: -3.7491, lng: -73.2538 }, // Iquitos
  { ccdd: "17", lat: -12.5933, lng: -69.1891 }, // Puerto Maldonado
  { ccdd: "18", lat: -17.1948, lng: -70.9357 }, // Moquegua
  { ccdd: "19", lat: -10.6864, lng: -76.2561 }, // Cerro de Pasco
  { ccdd: "20", lat: -5.1945, lng: -80.6328 }, // Piura
  { ccdd: "21", lat: -15.8402, lng: -70.0219 }, // Puno
  { ccdd: "22", lat: -6.0341, lng: -76.9714 }, // Moyobamba
  { ccdd: "23", lat: -18.0066, lng: -70.2463 }, // Tacna
  { ccdd: "24", lat: -3.5669, lng: -80.4515 }, // Tumbes
  { ccdd: "25", lat: -8.3791, lng: -74.5539 }, // Pucallpa
];

// Títulos que no sirven como foto de juego (mapas, escudos, logos…)
const TITULO_VETADO =
  /map|mapa|plano|escudo|flag|bandera|logo|coat of arms|diagram|chart|locator|montaje|collage/i;

function stripHtml(s) {
  return s.replace(/<[^>]*>/g, "").trim();
}

// --- punto en polígono (ray casting, anillo exterior con huecos) ---
function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInGeometry(pt, geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  return polys.some(
    (rings) =>
      pointInRing(pt, rings[0]) && !rings.slice(1).some((h) => pointInRing(pt, h))
  );
}

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    format: "json",
    ...params,
  })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}: ${url}`);
  return res.json();
}

const departamentos = JSON.parse(
  await readFile(path.join(ROOT, "public", "geo", "departamentos.json"), "utf8")
);

function depDe(lat, lng) {
  const f = departamentos.features.find((f) =>
    pointInGeometry([lng, lat], f.geometry)
  );
  return f ? f.properties.id : null;
}

const porDep = new Map(); // ccdd -> fotos[]
const vistos = new Set(); // pageids

for (const cap of CAPITALES) {
  const geo = await api({
    action: "query",
    list: "geosearch",
    gscoord: `${cap.lat}|${cap.lng}`,
    gsradius: String(RADIO_M),
    gslimit: "40",
    gsnamespace: "6",
  });
  const hallados = geo.query?.geosearch ?? [];
  const candidatos = hallados.filter(
    (p) => !vistos.has(p.pageid) && !TITULO_VETADO.test(p.title)
  );
  candidatos.forEach((p) => vistos.add(p.pageid));
  if (candidatos.length === 0) {
    console.warn(`⚠ ${cap.ccdd}: sin candidatos en Commons`);
    continue;
  }

  // Detalles en lotes de 25
  for (let i = 0; i < candidatos.length; i += 25) {
    const lote = candidatos.slice(i, i + 25);
    const info = await api({
      action: "query",
      pageids: lote.map((p) => p.pageid).join("|"),
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: "1024",
    });
    for (const p of lote) {
      const page = info.query?.pages?.[p.pageid];
      const ii = page?.imageinfo?.[0];
      if (!ii || ii.mime !== "image/jpeg" || ii.width < 640) continue;

      const meta = ii.extmetadata ?? {};
      const licencia = meta.LicenseShortName?.value;
      if (!licencia) continue;

      // La respuesta correcta es el departamento que CONTIENE la foto
      const dep = depDe(p.lat, p.lon);
      if (!dep) continue;

      const fotos = porDep.get(dep) ?? [];
      if (fotos.length >= MAX_POR_DEP) continue;
      fotos.push({
        dep,
        titulo: stripHtml(meta.ObjectName?.value ?? page.title.replace(/^File:/, "")),
        url: ii.thumburl ?? ii.url,
        pagina: ii.descriptionurl,
        autor: stripHtml(meta.Artist?.value ?? "Autor desconocido"),
        licencia: stripHtml(licencia),
        licenciaUrl: meta.LicenseUrl?.value ?? null,
        lat: p.lat,
        lng: p.lon,
      });
      porDep.set(dep, fotos);
    }
  }
  console.log(`✓ ${cap.ccdd}: acumulado ${porDep.get(cap.ccdd)?.length ?? 0} fotos`);
}

const banco = [...porDep.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([, fotos]) => fotos);

await mkdir(path.dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, JSON.stringify(banco, null, 2));

const cubiertos = new Set(banco.map((f) => f.dep));
console.log(
  `\n✓ ${banco.length} fotos en ${cubiertos.size}/25 departamentos → src/data/fotos-departamentos.json`
);
for (const cap of CAPITALES) {
  if (!cubiertos.has(cap.ccdd)) console.warn(`⚠ sin fotos: ${cap.ccdd}`);
}
