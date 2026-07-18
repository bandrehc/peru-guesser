# peru-guesser
¿Cuánto sabes de Perú? PeruGuesser es un juego inspirado en GeoGuesser donde tendrás que adivinar lugares, ciudades y paisajes del Perú. Desde las alturas de los Andes hasta la selva amazónica, demuestra que conoces cada rincón de este país lleno de historia y biodiversidad.

## Juego

- **Niveles:** Departamental/Regional (25), Provincial (196, con alcance total o local por departamento) y Distrital (1874, por departamento).
- **Modos:** Pin (te damos el nombre, haz clic en el mapa), Escribir (resaltamos la unidad, escribe su nombre con autocompletado y tolerancia a tildes) y Fotográfico (adivina en qué departamento se tomó una foto real).
- Sin cuentas ni datos personales: todo el progreso vive en el navegador (fase 1).

## Desarrollo

Stack: Next.js + TypeScript, react-leaflet, Tailwind CSS. Deploy en Vercel.

```bash
npm install
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run lint         # eslint
```

### Datos geográficos

Los GeoJSON optimizados ya están versionados en `public/geo/`. Para regenerarlos:

```bash
npm run data:fetch -- all        # descarga los crudos a data/raw/ (no versionado)
npm run data:build -- all        # simplifica con mapshaper → public/geo/
node scripts/gen-departamentos.mjs  # regenera la lista de departamentos
```

Fuente: [josedaniel-cb/limites-peru-geojson](https://github.com/josedaniel-cb/limites-peru-geojson) (límites INEI vía geogpsperu.com). El nivel distrital se particiona en 25 archivos por departamento para carga perezosa.

### Banco de fotos (modo Fotográfico)

```bash
npm run data:fotos   # regenera src/data/fotos-departamentos.json desde Wikimedia Commons
```

El script busca fotos geolocalizadas alrededor de cada capital departamental, filtra por calidad y licencia libre, y verifica con punto-en-polígono que cada foto cae dentro del departamento que se da por respuesta. El JSON resultante es curable a mano (borra las fotos poco representativas; el juego se adapta).

## Atribuciones

- Límites político-administrativos: INEI, vía geogpsperu.com y el repositorio limites-peru-geojson (MIT).
- Fotografías: Wikimedia Commons, cada una con su autor y licencia libre (CC BY / CC BY-SA / CC0), mostrados en la interfaz.
