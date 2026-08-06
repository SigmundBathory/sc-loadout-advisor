# SC Loadout Advisor - Roadmap & Plan de Mejoras

## Estado Actual (Agosto 2026)

### Stack
- Next.js 16.3.0 (Turbopack) + TypeScript + Tailwind v4 + shadcn/ui + Base UI
- SQLite (better-sqlite3, DB committeada a git) + Zustand + Recharts
- React Query 5 + Zustand (persistido) + lucide-react + tw-animate-css
- APIs: Star Citizen Wiki API + UEX Corp API + scfocus.org + Wikelo
- Deploy: Render (push a main → auto-deploy, ~2 min)

### Calidad del Código (verificado 06/08/2026)
| Check | Estado |
|-------|--------|
| `npm run lint` | ✅ 0 errores, 0 warnings |
| `npx tsc --noEmit` | ✅ limpio |
| `npm test` | ✅ 31/31 (4 archivos) |
| `npm run build` | ✅ OK |

### Funciones Implementadas
| Función | Estado | Archivos |
|---------|--------|----------|
| Selector de versiones LIVE/PTU | ✅ | `VersionSelector.tsx`, `api/versions/` |
| Dashboard gráfico con stats | ✅ | `dashboard/page.tsx`, `components/dashboard/` |
| Explorador de naves con búsqueda | ✅ | `ShipSelector.tsx`, `api/ships/` |
| Loadout Builder con stats reales | ✅ | `LoadoutBuilder.tsx`, `api/components/` |
| Optimizador con scoring + presets | ✅ | `optimizeLive.ts`, `ComponentPickerDialog.tsx` |
| Auto-carga del último loadout por nave | ✅ | `LoadoutBuilder.tsx` |
| Badge Optimizada/Estándar | ✅ | `LoadoutBuilder.tsx`, `ShipSelector.tsx` |
| Comparador por configuraciones | ✅ | `compare/page.tsx` |
| Editor en vivo con deltas | ✅ | `CompareEditor.tsx`, `StatsPanel.tsx` |
| Lista de compra con tiendas | ✅ | `ShoppingList.tsx` |
| Radar de balance | ✅ | `LoadoutRadarChart.tsx` |
| Importador manual PTU | ✅ | `import/page.tsx`, `api/import/` |
| Importación con filtro por tipo | ✅ | `api/import/route.ts` |
| Sincronización 3 pasos no destructiva | ✅ | `full-sync.ts`, `sync.ts` |
| Picker ordenado por stat principal | ✅ | `componentSort.ts`, `ComponentPickerDialog.tsx` |
| Captura consumo QT (SCU/GM) | ✅ | `sync.ts`, `ComponentStats` |
| Filtro de componentes placeholder | ✅ | `queries.ts` |
| React Query caching (5 min stale) | ✅ | `client.ts`, `QueryProvider` |
| Loadouts compartibles (URL base64) | ✅ | `share.ts`, `LoadLoadoutDialog` |
| Comparador deep-link por hash | ✅ | `compare/page.tsx` |
| Detalle de componentes (stats + tiendas) | ✅ | `ComponentDetailPanel.tsx`, `componentDetail.ts` |
| Export/Import JSON de loadouts | ✅ | `share.ts`, `LoadLoadoutDialog` |
| Sync incremental + registro de sync | ✅ | `sync.ts`, `sync_log` |
| Sync por versión con progreso | ✅ | `full-sync/route.ts`, `SyncPanel.tsx` |
| Tests de lógica pura (31) | ✅ | `src/lib/**/*.test.ts` |

### Problemas Resueltos en la Auditoría de Calidad (commit 796a550, 2c01575)
- Lint 240 problemas → 0 (181 errores de React 19 compiler + warnings de imports muertos).
- `SyncIndicator` reescrito con React Query (eliminado fetch manual + effect con setState).
- `CompareEditor` y `compare/page` migrados a patrón "adjust state during render" (React 19).
- `LoadoutBuilder` movido a store zustand para auto-load de loadouts.
- `any` tipados en toda la capa UI (OptimizeResult, BuyLocation, SyncStatusResponse, etc.).
- Selector de tipo de importación funcional (antes decorativo).
- `ActivityFeed` eliminado (siempre vacío).
- Código muerto eliminado: `getShipBuyLocations`, `getShipCountByClassification`, `getUexItemPricesByCategory`, `getLocations`, `getChangelog`, `getChangelogChanges`.
- Overrides ESLint acotados para la capa de datos (`no-explicit-any` en db/scripts/api) e imágenes de wikis remotas (`no-img-element`).

### Deuda Técnica / Problemas Conocidos
1. **DB committeada a git** — permite deploy sin backend, pero crece con cada versión y ocupa espacio. No migrable a serverless tal cual.
2. **Seed de precios/ubicaciones fake** — `seedMissingPricesAndLocations()` en `schema.ts:172` genera datos inventados cuando faltan.
3. **Archivos monolíticos** — `LoadoutBuilder.tsx` (~700 líneas), `compare/page.tsx` (~500), `sync.ts` (935).
4. **Sin cron automático de sync** — requiere acción manual en `SyncPanel`.
5. **`<select>` nativos sin estilizar** — `CompareEditor`, `ComparePage`, `ShipSelector`.
6. **Colores hardcodeados** — paletas recharts en hex, badges de stat duplicados en ~10 archivos.

---

## Hoja de Ruta

### Fase 1: React Query + Caché de Cliente ✅ (completada)
- `QueryProvider` en `layout.tsx` con `staleTime: 5min`, `gcTime: 30min`.
- Hooks `useShips`, `useLoadoutsByShip`, `useShipComponents`, `useOptimizedShipIds`, `useSyncStatus` en `client.ts`.
- `SyncIndicator` consumiendo `useSyncStatus` con `invalidateQueries`.

### Fase 2: Compartir y Exportar Loadouts ✅ (completada)
- `share.ts`: `encodeLoadoutShare`/`decodeLoadoutShare`, `encodeCompareShare`/`decodeCompareShare`, `serializeLoadoutForExport`/`parseLoadoutImport`, `downloadFile`.
- Loadouts compartibles por URL base64 + import desde archivo JSON.
- Deep-link del comparador por hash (`#compare=`).

### Fase 3: Detalles de Componentes ✅ (completada)
- `ComponentDetailPanel` con stats completas y tiendas (Shop/Location/precio).
- `componentDetail.ts` con filas por tipo de componente.
- `componentSort.ts`: orden por stat primario + trade-offs (range vs speed, etc.).
- Precios de tiendas UEX.

### Fase 4: Sync y Versiones ✅ (completada)
- Sync incremental por versión (`syncDataForVersion`).
- Registro de sync (`sync_log`) con `startSyncLog`/`finishSyncLog`/`getRecentSyncLogs`.
- `SyncHistory` y `VersionChanges` en el dashboard.
- Botón re-sync por versión en `SyncPanel` con progreso.

### Fase 5: Pulido UX/UI ⏳ (parcial — ver Fase UI A-D)
- Estados vacíos en dashboard/optimizer/compare ✅.
- Sticky header en tablas ✅.
- Contador de resultados en búsquedas ✅.
- Keyboard navigation en picker (↑/↓/Enter) ✅.
- Transiciones/motion: **pendiente** → ver "Modernización UI 2026".

### Fase 6: Tests + Refactor ✅ (completada)
- Vitest + 31 tests (componentSort, optimizeLive, scoring, share, queries, sync).
- `LoadoutBuilder` aún monolítico (refactor parcial).

---

## Modernización UI 2026 (Nueva) — Dinamismo + Impacto Visual

### Análisis de la industria (agosto 2026)
Tendencias aplicables: Glassmorphism 2.0 (frosted + layering + soft shadows), dark mode con neón (gradientes + glows), micro-interactions 150-300ms con springs, shared-element transitions (`layoutId`), densidad de datos con motion que guía la lectura, y accesibilidad (`prefers-reduced-motion`).

### Diagnóstico actual
- ✅ Base shadcn v4 sólida, dark mode, glassmorphism ya presente.
- ❌ Bug de fuente `--font-sans: var(--font-sans)` auto-referencial en `globals.css:10`.
- ❌ 3 "sabores" de contenedor compitiendo (`glass-panel`, `bg-card/50`, `Card`).
- ❌ Sin librería de motion, sin stagger/count-up/shared-elements.
- ❌ Colores hardcodeados (recharts hex, badges de stat duplicados).
- ❌ `<select>` nativos sin estilizar.
- ❌ Sin tokens de motion ni `prefers-reduced-motion`.

### Fase UI-A: Fundamentos (tokens + motion engine) ✅ (completada)
- **Fix `--font-sans`** → `--font-geist-sans` (auto-referencia circular en `globals.css`).
- **Tokens de motion**: `--motion-fast/base/slow`, easings, y `prefers-reduced-motion` global.
- **Instalado `motion@13`** (framer-motion) compatible React 19/Next 16.
- **Primitivas**: `Reveal` (scroll fade+slide), `CountUp` (números animados), `Stagger`/`StaggerItem` (listas), `AnimatedIcon` (flotación).

### Fase UI-B: Micro-interacciones ✅ (completada)
- Nav active pill con `layoutId` (shared-element transition en el navbar).
- Count-up en StatCards del dashboard y score del ResultHeader.
- Stagger reveal en TopDpsTable, RecentLoadouts, grid de naves (ShipSelector) y ComponentPickerDialog.
- Tabs animados con `TabsIndicator` (Base UI, glide CSS) en optimizer y LoadoutBuilder.

### Fase UI-C: Refinamiento visual ✅ (completada)
- Paleta de gráficos centralizada en `lib/chartColors.ts` (PieChartFabricants + radar).
- Selects nativos estilizados con `.native-select` (CompareEditor, compare page, ShipSelector).
- `Skeleton` con shimmer (`animate-skeleton`) reemplazando pulse en ShipSelector.
- Gradientes sobre imágenes de naves + glow hover en cards.

### Fase UI-D: Detalles premium ✅ (completada)
- Radar chart con área en gradiente radial y stroke con glow.
- Empty states del optimizer y comparador con `AnimatedIcon` (flotación + hover).
- Hover con profundidad (elevación + glow + zoom de imagen) en tarjetas de naves.

---

## Resumen de Prioridades

| Prioridad | Descripción | Estado | Impacto |
|-----------|-------------|--------|---------|
| 🔴 Alta | React Query + caché | ✅ | Performance y UX |
| 🔴 Alta | Compartir loadouts | ✅ | Valor de comunidad |
| 🔴 Alta | Auditoría de calidad (lint 0/0) | ✅ | Mantenibilidad |
| 🟡 Media | Detalle de componentes | ✅ | Profundidad de datos |
| 🟡 Media | Sync incremental + registro | ✅ | Mantenibilidad |
| 🟡 Media | Tests (31) | ✅ | Calidad |
| 🟢 Baja | Pulido UX/UI básico | ✅ | Acabado |
| 🟢 Baja | **UI 2026: motion + micro-interacciones** | ⏳ UI-A→D | **Dinamismo premium** |

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo de carga inicial | ~2s | <1s |
| Refetch duplicados al cambiar versión | 0 (dedupe) | 0 |
| Tiempo de sync full | ~90s | <45s |
| Tests coverage (lógica pura) | 31 tests | >40% |
| Lint/typecheck/build | ✅ 0/0 | mantener |
| Fases de roadmap completadas | F1–F6 + auditoría | + UI-A→D |
