# SC Loadout Advisor - Roadmap & Plan de Mejoras

## Estado Actual (Agosto 2026)

### Stack
- Next.js 16.3.0 (Turbopack) + TypeScript + Tailwind v4 + shadcn/ui
- SQLite (better-sqlite3, DB committeada a git) + Zustand + Recharts
- APIs: Star Citizen Wiki API + UEX Corp API + scfocus.org + Wikelo
- Deploy: Render (push a main → auto-deploy, ~2 min)

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
| Sincronización 3 pasos no destructiva | ✅ | `full-sync.ts`, `sync.ts` |
| Picker ordenado por stat principal | ✅ | `componentSort.ts`, `ComponentPickerDialog.tsx` |
| Captura consumo QT (SCU/GM) | ✅ | `sync.ts`, `ComponentStats` |
| Filtro de componentes placeholder | ✅ | `queries.ts` |

### Problemas Conocidos / Deuda Técnica
1. **Sin React Query** — `@tanstack/react-query@5.101` instalado en `package.json` pero sin `QueryClientProvider` ni `useQuery`; los fetch se hacen con `useState` + `useEffect` (sin cache en cliente, sin dedupe).
2. **DB committeada a git** — permite deploy en Render sin backend externo, pero la DB crece con cada versión y ocupa espacio en el repo. No es migrable a serverless tal cual.
3. **Seed de precios/ubicaciones fake** — `seedMissingPricesAndLocations()` en `schema.ts:172` sigue generando datos inventados cuando faltan.
4. **Archivos monolíticos** — `LoadoutBuilder.tsx` (~700 líneas), `compare/page.tsx` grande, `sync.ts` (935 líneas).
5. **Sin tests** — coverage 0%.
6. **Sin estados de carga/empty pulidos** — `LoadLoadoutDialog` muestra solo texto; comparador y picker dependen de fetch manual.
7. **Datos seed en dev** — al inicializar sin datos, `SyncPanel` solo ofrece sync manual; no hay cron automático.

---

## Hoja de Ruta

### Fase 1: React Query + Caché de Cliente 🎯 (Paso 1)
**Objetivo:** centralizar fetch, dedupe, cache en memoria (5 min) y estados de carga automáticos.

#### Cambios
- `QueryClientProvider` en `layout.tsx` (o `Providers.tsx`).
- Migrar `useEffect + fetch` a `useQuery` en: `ShipSelector`, `LoadoutBuilder`, `compare/page.tsx`, `ComponentPickerDialog`.
- `staleTime: 5 * 60 * 1000`, `gcTime: 30 * 60 * 1000`.
- Loading skeletons (`Skeleton` de shadcn) + error states con retry button.

#### Archivos
| Archivo | Cambio |
|---------|--------|
| `src/app/providers.tsx` (nuevo) | QueryClientProvider + Toaster |
| `src/components/ships/ShipSelector.tsx` | useQuery ships |
| `src/components/loadout/LoadoutBuilder.tsx` | useQuery componentes + naves |
| `src/components/loadout/ComponentPickerDialog.tsx` | useQuery componentes |
| `src/app/compare/page.tsx` | useQuery + dedupe |
| `src/lib/api/client.ts` (nuevo) | fetch helpers tipados |

**Éxito:** sin refetch duplicado al cambiar de versión, <1s en recargas, skeletons en vez de "Cargando...".

---

### Fase 2: Compartir y Exportar Loadouts (Paso 2)
**Objetivo:** comunidad privada — compartir builds entre miembros sin fricción.

#### Cambios
- **Links compartibles**: encode del loadout en la URL (`/loadout#base64`) o endpoint `api/loadouts/share` con ID corto. Al abrir, botón "Importar" que lo guarda.
- **Exportar/Importar JSON**: botón en `LoadLoadoutDialog` para descargar/subir `.json`.
- **Deep-link del comparador**: persistir configs de comparación en la URL para reenviar por Discord.

#### Archivos
| Archivo | Cambio |
|---------|--------|
| `src/lib/loadout/share.ts` (nuevo) | encode/decode + schema validation |
| `src/components/loadout/LoadLoadoutDialog.tsx` | botones Export/Import |
| `src/app/compare/page.tsx` | sync de configs con URL |

---

### Fase 3: Detalles de Componentes (Paso 3)
**Objetivo:** profundidad de datos en el picker (el corazón de la app).

#### Cambios
- **Vista detalle de componente** en el picker: al hacer click, panel con stats completas, tiendas disponibles (Shop/Location/precio), y alternativas con el mismo slot.
- **Comparación lado a lado** del componente equipado vs. el seleccionado (deltas verdes/rojas como en `StatsPanel`).
- **Tooltip de consumos** QT (fuel_rate, SCU/GM) y peso en el build.
- **Precios UEX fallback**: integrar `getUexPrice` para componentes sin precio wiki.

#### Archivos
| Archivo | Cambio |
|---------|--------|
| `src/components/loadout/ComponentPickerDialog.tsx` | panel detalle + deltas |
| `src/lib/utils.ts` | formateadores de stats |

---

### Fase 4: Mejoras de Sync y Versiones (Paso 4)
**Objetivo:** sincronización robusta y transparente para la comunidad.

#### Cambios
- **Sync incremental**: comparar `last_synced_at` de versiones y solo re-fetch de lo cambiado (ahora borra y reinserta todo).
- **Comparación de versiones en Dashboard**: `VersionChanges.tsx` ya existe — enriquecer con diff real de stats (naves nuevas, componentes con cambios de HP/DPS).
- **Registro de sync**: tabla `sync_log` con fecha, versión, nº de items, duración.
- **Botón re-sync por versión** en `SyncPanel` con progreso por paso (ya existe `full-sync.ts` local — exponer estado al usuario).

---

### Fase 5: Pulido UX/UI (Paso 5)
**Objetivo:** acabado visual y micro-interacciones al nivel del juego.

#### Cambios
- **Estados vacíos** consistentes (sin loadouts, sin resultados de búsqueda, sin tiendas) con iconos + CTA.
- **Empty states del comparador** cuando no hay configs.
- **Transiciones** (`motion` / CSS) al cambiar slots, ordenar picker, deltas.
- **Sticky header en tablas** de componentes y tiendas.
- **Contador de resultados** en búsquedas de naves/componentes.
- **Keyboard navigation** en picker (↑/↓/Enter).

---

### Fase 6: Tests + Refactor (Paso 6)

#### Cambios
- `vitest` + `@testing-library/react`.
- Tests de: `componentSort.ts` (orden por stat), `optimizeLive.ts` (scoring, presets, budget), `share.ts` (roundtrip encode/decode), `queries.ts` (placeholder filter, compatibilidad).
- Extraer `LoadoutBuilder` en `SlotList.tsx` / `ShipLoadoutPanel.tsx` para reducir el monolito.

**Éxito:** >40% de coverage en lógica pura (no UI).

---

## Resumen de Prioridades

| Prioridad | Descripción | Impacto |
|-----------|-------------|---------|
| 🔴 Alta | React Query + caché | Performance y UX |
| 🔴 Alta | Compartir loadouts | Valor de comunidad |
| 🟡 Media | Detalle de componentes | Profundidad de datos |
| 🟡 Media | Sync incremental | Mantenibilidad |
| 🟢 Baja | Pulido UX/UI | Acabado |
| 🟢 Baja | Tests + refactor | Calidad |

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo de carga inicial | ~2s | <1s |
| Refetch duplicados al cambiar versión | Varios | 0 (dedupe) |
| Tiempo de sync full | ~90s | <45s |
| Fases de roadmap completadas | F0 (core) | F1–F6 |
| Tests coverage (lógica pura) | 0% | >40% |
