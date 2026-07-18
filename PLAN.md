# PeruGuesser — Plan de la Fase 1

> Plan aprobado el 2026-07-17. Documento de referencia para la arquitectura, el
> pipeline de datos, la estrategia del modo fotográfico y la hoja de ruta.

## Visión

Plataforma web educativa para aprender la geografía política del Perú jugando,
con los polígonos reales de las divisiones territoriales en tres niveles:

1. **Departamental / Regional** — 24 departamentos + Provincia Constitucional del Callao (25 unidades). Un solo nivel: regional y departamental son lo mismo, sin duplicar lógica ni datos.
2. **Provincial** — 196 provincias.
3. **Distrital** — ~1874 distritos.

**Modos de juego** (los tres niveles en cada modo):

- **Identificación / Pin** (estilo Seterra): se indica el nombre, el jugador hace clic en el polígono correcto.
- **Identificación / Escribir**: se resalta un polígono, el jugador escribe el nombre (autocompletado, tolerancia a tildes y mayúsculas).
- **Fotográfico** (estilo GeoGuessr): se muestra una foto real y el jugador hace clic en el polígono donde cree que fue tomada.

**Fuera de alcance en fase 1:** cuentas/login, leaderboards persistentes, multijugador, analítica. Todo el estado vive en el cliente.

## 1. Arquitectura

**Stack:** Next.js (App Router) + TypeScript, react-leaflet, Tailwind CSS, deploy en Vercel. Estado del juego con `useReducer` + Context (sin librerías de estado externas).

```
peru-guesser/
├── public/
│   └── geo/
│       ├── departamentos.json        # 25 features, simplificado
│       ├── provincias.json           # 196 features
│       └── distritos/
│           └── {01..25}.json         # distritos particionados por departamento
├── data/
│   └── fotos/departamentos.json      # banco curado: url, coords, ubigeo, autor, licencia
├── scripts/
│   ├── fetch-geo.mjs                 # descarga la fuente cruda
│   └── build-geo.mjs                 # pipeline mapshaper → public/geo
├── src/
│   ├── app/
│   │   ├── page.tsx                  # home: selector de nivel y modo
│   │   └── play/page.tsx             # partida (lee ?nivel=&modo= de la URL)
│   ├── components/
│   │   ├── map/MapCanvas.tsx         # Leaflet vía next/dynamic con ssr:false
│   │   ├── map/GeoLayer.tsx          # pinta polígonos según estado (pendiente/acierto/error)
│   │   ├── game/GameHud.tsx          # unidad objetivo, contador, cronómetro
│   │   ├── game/TypeAnswerInput.tsx  # input con autocompletado accesible (combobox ARIA)
│   │   ├── game/PhotoPanel.tsx       # foto + atribución (modo fotográfico)
│   │   └── game/SummaryModal.tsx     # resumen: aciertos, errores, tiempo
│   ├── hooks/useGame.ts              # reducer: cola de objetivos, intentos, puntuación
│   └── lib/
│       ├── geo.ts                    # carga y caché de GeoJSON, tipos de Feature
│       ├── normalize.ts              # tolerancia a tildes/mayúsculas, matching de nombres
│       └── types.ts                  # Level, Mode, GameState, GameAction
```

Decisiones clave:

- **Un solo motor de juego para los tres modos.** El reducer maneja una cola barajada de unidades objetivo y transiciones `jugando → feedback → siguiente → resumen`. Entre modos solo cambia el tipo de pregunta y de respuesta (clic / texto / clic-con-foto).
- **Leaflet solo en cliente** (`next/dynamic`, `ssr: false`): Leaflet toca `window` y rompe el SSR.
- Progreso de la ronda en memoria (opcionalmente `sessionStorage` para sobrevivir un refresh). Sin backend de usuarios.

## 2. Pipeline de datos geográficos

Fuente principal: [`josedaniel-cb/limites-peru-geojson`](https://github.com/josedaniel-cb/limites-peru-geojson) (jerarquía completa con UBIGEO en cada feature). Pipeline reproducible con `npm run data:build`:

1. **Descarga** por script del GeoJSON crudo de los tres niveles.
2. **Validación**: conteos exactos (25 / 196 / ~1874), UBIGEOs únicos, contrastando con IDESEP del INEI (ide.inei.gob.pe) y Datos Abiertos (datosabiertos.gob.pe). Fuentes adicionales de verificación: GEO GPS Perú, geovisor del IDEP.
3. **Simplificación con mapshaper** (CLI): Visvalingam ponderado con `keep-shapes`, coordenadas a 5 decimales. Metas de peso: departamentos ≤ 300 KB, provincias ≤ 1 MB, distritos partidos en 25 archivos por departamento (~200–500 KB c/u).
4. **Poda de propiedades**: cada feature queda con `{id: ubigeo, nombre, dep, prov}`.
5. **Servir como estáticos** en `public/geo/` (CDN de Vercel, caché inmutable). Plan B si los distritos siguen pesados: TopoJSON + `topojson-client` en el navegador.

## 3. Modo fotográfico: fuente de imágenes

**Decisión: Mapillary como fuente principal + Wikimedia Commons como complemento. Google Street View descartado en fase 1.**

| Fuente | Veredicto | Motivo |
|---|---|---|
| Mapillary | Principal | Gratuito, API por bounding box, licencia CC BY-SA, cobertura urbana razonable en Perú. Calidad variable → curación manual sobre candidatos preseleccionados por script. |
| Wikimedia Commons | Complemento | Fotos geolocalizadas de paisajes e hitos, útil donde Mapillary no llega (selva, sierra rural). Licencia varía por foto: guardar autor y licencia por imagen. |
| Google Street View | Descartado (fase 1) | Requiere facturación y sus términos prohíben almacenar/derivar imágenes: imposible curar un banco estático. |

El banco es un JSON estático curado (`data/fotos/departamentos.json`) con: URL, coordenadas reales, UBIGEO de la respuesta, autor y licencia. **La atribución visible en la UI es obligatoria** (CC BY-SA).

**Priorización confirmada:** departamental primero (25 × 5–10 fotos ≈ 125–250, curable a mano), provincial después (semi-automatizado), distrital fotográfico como expansión futura.

## 4. Hoja de ruta

| # | Hito | Estado |
|---|---|---|
| 1 | Scaffold Next.js + TS + Tailwind + react-leaflet, mapa base centrado en Perú, deploy temprano a Vercel | ✅ Hecho |
| 2 | Pipeline de datos + capa departamental optimizada renderizando | ✅ Hecho (estilo Seterra: sin teselas, solo polígonos sobre fondo liso; provincias/distritos pendientes de correr por el mismo pipeline) |
| 3 | Motor de juego + Modo Pin departamental (juego completo jugable: pintado permanente, parpadeo rojo en error, resumen con tiempo) | ✅ Hecho |
| 4 | Modo Escribir: normalización tildes/mayúsculas, autocompletado accesible (combobox ARIA) | Pendiente |
| 5 | Nivel provincial en ambos modos de identificación | Pendiente |
| 6 | Nivel distrital: carga perezosa por departamento, rendimiento en móvil | Pendiente |
| 7 | Modo Fotográfico departamental: script de candidatos + curación + integración | Pendiente |
| 8 | Pulido: accesibilidad (ícono/patrón además de color para daltonismo), responsive, QA, deploy final | Pendiente |

Los pasos 1–3 son el camino crítico: validado el mapa departamental jugable, el resto es extensión del mismo motor.

## Accesibilidad (transversal)

- Acierto/error no dependen solo del color: ícono o patrón adicional (daltonismo).
- Navegación por teclado completa en el modo Escribir.
- Diseño responsivo: el mapa debe jugarse bien en escritorio y celular.
- Contraste suficiente en el coloreado progresivo.
