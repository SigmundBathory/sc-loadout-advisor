# SC Loadout Advisor

Herramienta web para configurar, comparar y optimizar loadouts de Star Citizen. Sincroniza datos desde la Star Citizen Wiki API y permite importar datos PTU manualmente.

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# O usar START.bat (mata procesos previos y pausa al cerrar)

# Abrir en navegador
http://localhost:3000
```

## Funciones Implementadas

### 1. Selector de Versiones
- **Dropdown** en el header muestra版本 LIVE actual (4.9) y版本 PTU importada (4.10)
- **Sincronización automática**: al cambiar版本, descarga datos nuevos desde la Wiki API
- **Importación manual**: sube JSON desde erkul.games para版本 PTU
- **Estado visual**: check verde = sincronizado, botón "Sincronizar" = pendiente

### 2. Explorador de Naves
- **Grid visual** con imágenes de cada nave
- **Búsqueda por nombre** o fabricante en tiempo real
- **Filtros por**: clasificación (Fighter, Freight, etc.) y fabricante
- **Paginación** con scroll infinito

### 3. Loadout Builder
- **Selector de componentes** por slot (armas, escudos, plantas de energía, etc.)
- **Estadísticas en tiempo real**: DPS, HP escudo, HP casco, potencia, enfriamiento
- **Radar chart** con stats comparativas
- **Asignación manual** de componente por componente

### 4. Optimizador
- **Algoritmo de scoring** que pondera: DPS, alcance, precio, durabilidad
- **Filtros predefinidos**: Máximo DPS, más barato, mejor alcance, más tanque
- **Resultado**: lista ordenada de componentes por prioridad

### 5. Comparador
- **Lado a lado** de 2-4 loadouts
- **Gráficos radar superpuestos** para comparación visual
- **Stats detalladas** de cada configuración

### 6. Sincronización de Datos
- **Wiki API**: obtiene vehículos, armas, componentes, versiones
- **Detección automática**: verifica si hay nueva versión LIVE
- **Batch loading**: carga todos los componentes de una vez (sin N+1 queries)
- **Extracción de componentes desde puertos** de vehículos

### 7. Importación Manual (PTU)
- **Endpoint `/api/import`**: acepta JSON con ships, weapons, components
- **UI en `/import`**: drag & drop con preview
- **Soporte formatos**: Wiki API format + formato erkul.games
- **Detección automática** de versión desde nombre del archivo

## Arquitectura

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── api/               # API routes
│   │   ├── sync/          # POST: sincroniza datos
│   │   ├── versions/      # GET/POST: maneja版本
│   │   ├── import/        # POST: importa JSON
│   │   ├── ships/         # GET: lista naves
│   │   ├── components/    # GET: componentes
│   │   ├── loadouts/      # CRUD loadouts
│   │   └── optimize/      # POST: optimiza
│   ├── ships/             # Páginas de naves
│   ├── compare/           # Comparador
│   ├── optimizer/         # Optimizador
│   └── import/            # Importador manual
├── components/            # Componentes React
│   ├── VersionSelector.tsx
│   ├── layout/ClientHeader.tsx
│   ├── ships/ShipSelector.tsx
│   ├── loadout/LoadoutBuilder.tsx
│   ├── stats/LoadoutRadarChart.tsx
│   └── sync/SyncIndicator.tsx
├── lib/
│   ├── api/               # Clientes API externos
│   │   ├── starCitizenWiki.ts
│   │   └── uexCorp.ts
│   ├── db/                # Base de datos SQLite
│   │   ├── schema.ts      # Schema y.tablas
│   │   ├── queries.ts     # Queries CRUD
│   │   └── sync.ts        # Lógica de sincronización
│   ├── optimizer/         # Algoritmo de optimización
│   └── types.ts           # TypeScript types
└── stores/                # Estado global (Zustand)
    └── loadoutStore.ts
```

## Base de Datos (SQLite)

| Tabla | Descripción |
|-------|-------------|
| `game_versions` | Versiones disponibles (LIVE/PTU) |
| `sync_meta` | Estado de sincronización |
| `ships` | 278 naves (4.9 LIVE) |
| `hardpoints` | Slots de componentes por nave |
| `components` | 579 componentes (armas + others) |
| `manufacturers` | 19 fabricantes |
| `buy_locations` | Ubicaciones de compra |
| `loadouts` | Loadouts guardados por usuario |

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/versions` | Lista versiones disponibles |
| POST | `/api/versions` | Selecciona versión activa |
| GET | `/api/sync` | Estado de sincronización |
| POST | `/api/sync` | Sincroniza datos (body: `{version}`) |
| POST | `/api/import` | Importa JSON (form: file, version) |
| GET | `/api/ships` | Lista naves (query: search, classification) |
| GET | `/api/components` | Componentes (query: compatibleShipId, slotType) |
| POST | `/api/optimize` | Optimiza loadout |

---

## Hoja de Ruta

### ✅ Completado (Fase 1 - MVP)
- [x] Scaffold del proyecto (Next.js + TypeScript + Tailwind + shadcn/ui)
- [x] Schema de base de datos SQLite
- [x] Cliente API Star Citizen Wiki
- [x] Sincronización automática de datos
- [x] Selector de versiones (LIVE/PTU)
- [x] Explorador de naves con búsqueda
- [x] Loadout Builder con estadísticas
- [x] Radar chart de stats
- [x] Optimizador con scoring algorithm
- [x] Importador manual para PTU
- [x] Header responsive con sync indicator

### 🔄 En Progreso (Fase 2 - Calidad de Datos)
- [ ] **Mejorar stats de componentes**: shields HP, power output, cooling rate
- [ ] **Manufacturer codes**: extraer de `equipped_item` en puertos
- [ ] **Precios UEX Corp**: necesita API key configurada
- [ ] **Ubicaciones de compra**: shops y precios en el juego
- [ ] **Imágenes de componentes**: URLs desde Wiki API

### 📋 Pendiente (Fase 3 - Funcionalidad)
- [ ] **Persistencia de loadouts**: guardar/cargar configuraciones
- [ ] **Comparador de loadouts**: selector múltiple + radar superpuesto
- [ ] **Exportar loadout**: compartir link o imagen
- [ ] **Historial de versiones**: ver cambios entre patches
- [ ] **Notificaciones**: alerta cuando nueva LIVE está disponible
- [ ] **Dark mode persistente**: guardar preferencia en localStorage

### 🚀 Futuro (Fase 4 - Experiencia)
- [ ] **Búsqueda avanzada**: filtros por stats (DPS mínimo, precio máximo)
- [ ] **Builds populares**: loadouts más usados por la comunidad
- [ ] **Simulador de daño**: calcular tiempo de muerte vs naves
- [ ] **Integración con Spectrum**: compartir builds en foros
- [ ] **PWA**: instalar como app en móvil
- [ ] **Offline mode**: datos cacheados para jugar sin internet
- [ ] **Multi-idioma**: español/inglés/portugués
- [ ] **API pública**: permitir que otros tools consuman datos

### 🐛 Conocido
- [ ] Stats de componentes limitadas (shields HP = 0, power output = 0)
- [ ] UEX Corp API requiere key (datos de precios no disponibles)
- [ ] No hay persistencia de usuario (loadouts se pierden al recargar)
- [ ] Imágenes de algunas naves no cargan

---

## Mejoras Sugeridas

### Prioridad Alta
1. **Mejorar cálculo de stats de componentes**: hacer fetch individual de items desde Wiki API para obtener HP, power, cooling
2. **Persistir loadouts en localStorage**: guardar automáticamente al modificar
3. **Precios y ubicaciones**: integrar UEX Corp API con key

### Prioridad Media
4. **Comparador funcional**: seleccionar 2-4 naves y comparar stats
5. **Exportar como imagen**: usar html2canvas para capturar radar chart
6. **Historial de sincronizaciones**: log de cuándo se sincronizó cada versión

### Prioridad Baja
7. **Búsqueda por stats**: "mostrar naves con DPS > 1000"
8. **Favoritos**: marcar naves/loadouts favoritos
9. **Tutorial interactivo**: guía paso a paso para nuevos usuarios

---

## Fuentes de Datos

| Fuente | URL | Uso |
|--------|-----|-----|
| Star Citizen Wiki API | `api.star-citizen.wiki` | Vehículos, armas, componentes, versiones |
| UEX Corp API | `uexcorp.space/api` | Precios, ubicaciones de compra |
| erkul.games | `erkul.games` | Datos PTU (importación manual) |

## Stack Técnico

- **Framework**: Next.js 16.3.0 (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: SQLite (better-sqlite3)
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Cómo Obtener Datos PTU (ej: 4.10)

1. Abre [erkul.games](https://erkul.games) en Chrome
2. Presiona **F12** → pestaña **Network**
3. Recarga la página (Ctrl+R)
4. Busca llamadas a la API (vehicles, weapons, items)
5. Click derecho en la respuesta → **Copy Response**
6. Guarda en archivo `.json`
7. En tu app, ve a **/import**
8. Sube el archivo con versión `4.10.0-PTU.XXXXXXXX`
