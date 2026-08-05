# SC Loadout Advisor - Roadmap & Plan de Mejoras

## Estado Actual (Agosto 2026)

### Stack
- Next.js 16.3.0 (Turbopack) + TypeScript + Tailwind v4 + shadcn/ui
- SQLite (better-sqlite3) + Zustand + Recharts
- APIs: Star Citizen Wiki API + UEX Corp API

### Funciones Implementadas
| Función | Estado | Archivos |
|---------|--------|----------|
| Selector de versiones LIVE/PTU | ✅ | `VersionSelector.tsx`, `api/versions/` |
| Explorador de naves con búsqueda | ✅ | `ShipSelector.tsx`, `api/ships/` |
| Loadout Builder con stats | ✅ | `LoadoutBuilder.tsx`, `api/components/` |
| Optimizador con scoring | ✅ | `optimizer/page.tsx`, `api/optimize/` |
| Comparador de loadouts | ⚠️ DPS placeholder | `compare/page.tsx` |
| Importador manual PTU | ✅ | `import/page.tsx`, `api/import/` |
| Sincronización Wiki API | ✅ | `sync.ts` |
| Dashboard gráfico | ❌ No implementado | — |

### Problemas Conocidos
1. **Comparador DPS es placeholder** — `compare/page.tsx:58` usa `(hull_hp/1000)*2` en vez de datos reales
2. **Sync destruye datos** — `sync.ts:480-484` borra TODO antes de re-sincronizar
3. **Datos seed falsos** — `schema.ts:132-225` genera precios y ubicaciones fake
4. **better-sqlite3 no funciona en serverless** — bloquea deploy en Vercel
5. **Archivos monolíticos** — optimizer (800 líneas), LoadoutBuilder (623 líneas)
6. **Sin React Query** — dependencia instalada pero no usada
7. **Sin cache** — todas las API routes devuelven datos frescos sin cache headers
8. **Stats de componentes limitadas** — HP shields = 0, power output = 0

---

## Hoja de Ruta

### Fase 1: Dashboard Gráfico 🎯 (Paso 1)
Crear `/dashboard` como pantalla principal con estilo minimalista glass.

#### Widgets del Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  ⬡ SC LOADOUT ADVISOR           [4.9 LIVE ▼]  [🔄 Sync] [⚡]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 🚀 278   │ │ 🔧 579   │ │ 🏭 19    │ │ 📅 4.9   │          │
│  │ NAVES    │ │ COMPONENTES│ │ FABRICANTES│ │ LIVE     │          │
│  │ +12 vs 4.8│ │ +23 vs 4.8│ │          │ │ ✅ Sync  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌─────────────────────────┐ ┌─────────────────────────┐      │
│  │  🏭 DISTRIBUCIÓN        │ │  ⚡ TOP 5 DPS           │      │
│  │    [Pie Chart]          │ │  1. Eclipse      3200   │      │
│  │  Drake 35% Aegis 28%   │ │  2. Harbinger    2800   │      │
│  │  RSI 18% Otros 19%     │ │  3. Talon        2600   │      │
│  └─────────────────────────┘ └─────────────────────────┘      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📅 CAMBIOS 4.8 → 4.9                                  │  │
│  │  Naves: 273→278 (+5)  │  Armas: 164→172 (+8)          │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ⭐ LOADOUTS RECIENTES  │  📋 ACTIVITY FEED            │  │
│  │  [F7C] [Avenger] [Eclipse] [+] │ Sync 14:32, Save 14:28│  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ⚡ [Sync] [Importar] [Nuevo] [Optimizar] [Comparar]   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Estilo Visual: Minimalista Glass
- Fondo: `bg-card/50 backdrop-blur-sm border border-border/50`
- Bordes: `rounded-xl`
- Sombras: `shadow-lg shadow-black/20`
- Colores SC: azul primario, rojo alerts, dorado favorites
- Dark mode forzado (coherente con el juego)

#### Archivos a Crear
```
src/app/dashboard/page.tsx              # Página principal
src/components/dashboard/StatCard.tsx    # Widget de estadísticas
src/components/dashboard/PieChartFabricants.tsx  # Pie chart
src/components/dashboard/TopDpsTable.tsx # Tabla top 5 DPS
src/components/dashboard/VersionChanges.tsx  # Comparación versiones
src/components/dashboard/RecentLoadouts.tsx  # Loadouts recientes
src/components/dashboard/ActivityFeed.tsx    # Feed de actividad
src/components/dashboard/QuickActions.tsx    # Barra de acciones
```

---

### Fase 2: Fixes Críticos (Paso 2)

| Fix | Archivo | Descripción |
|-----|---------|-------------|
| Comparador DPS real | `compare/page.tsx` | Reemplazar placeholder con stats reales |
| Sync no destructivo | `sync.ts` | No borrar datos antes de confirmar sync exitoso |
| Quitar datos seed | `schema.ts` | Eliminar `seedMissingPricesAndLocations()` |
| Errores visibles | Múltiples | Agregar toast/error states en fetch failures |

---

### Fase 3: Simplificar UI (Paso 3)

#### LoadoutBuilder (623 → ~300 líneas)
Extraer componentes:
- `src/components/loadout/SlotList.tsx` — Lista de slots
- `src/components/loadout/ComponentPicker.tsx` — Selector de componente
- `src/components/loadout/StatsPanel.tsx` — Panel de stats
- `src/lib/optimizer/stats.ts` — Cálculo de stats

#### Optimizer (800 → ~400 líneas)
Extraer componentes:
- `src/components/optimizer/OptimizerForm.tsx` — Formulario de pesos
- `src/components/optimizer/OptimizerResults.tsx` — Resultados

#### Navegación
- Agregar breadcrumb en todas las páginas
- Unificar headers con ClientHeader
- Loading states al cambiar versión

---

### Fase 4: Migrar a Turso (Paso 4)

#### Por qué Turso
- SQLite en la nube (HTTP protocol, funciona en serverless)
- Free tier: 500 DBs, 9GB storage
- Migración mínima: prácticamente las mismas queries
- Embedded replicas para performance local

#### Cambios Necesarios
```
better-sqlite3 (sync, local)    →  @libsql/client (async, HTTP)
db.prepare("...").run([params])  →  await client.execute({sql, args})
```

#### Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `package.json` | Agregar `@libsql/client`, `drizzle-orm` |
| `src/lib/db/schema.ts` | Reemplazar better-sqlite3 por Turso client |
| `src/lib/db/queries.ts` | Hacer queries async |
| `src/lib/db/sync.ts` | Adaptar sync a async + error handling |
| `drizzle.config.ts` | Nuevo archivo de configuración |

#### Variables de Entorno (Vercel)
```
TURSO_DATABASE_URL=file:data/sc-loadout.db    # local
TURSO_DATABASE_URL=libsql://xxx.turso.io      # cloud
TURSO_AUTH_TOKEN=xxx
```

---

### Fase 5: Deploy Vercel (Paso 5)

#### Configuración
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [{
    "path": "/api/sync/cron",
    "schedule": "0 6 * * *"
  }]
}
```

#### Pasos
1. Push a GitHub repo
2. Import en Vercel dashboard
3. Configurar env vars (TURSO_*)
4. Deploy automático

#### Costo Total: $0
- Vercel free tier: 100GB bandwidth, 100k function invocations
- Turso free tier: 500 DBs, 9GB storage

---

### Fase 6: React Query + Performance (Paso 6)

#### Cambios
- Configurar `QueryClientProvider` en layout
- Reemplazar `fetch` + `useState` por `useQuery`
- Agregar `staleTime: 5 * 60 * 1000` (5 min cache)
- Loading/error states automáticos
- Lazy loading de componentes pesados
- Pagination en listados de naves

---

## Resumen de Prioridades

| Prioridad | Descripción | Impacto |
|-----------|-------------|---------|
| 🔴 Alta | Dashboard gráfico | UX principal |
| 🔴 Alta | Fix comparador DPS | Funcionalidad rota |
| 🔴 Alta | Migrar a Turso | Deploy bloqueado |
| 🟡 Media | Simplificar UI | Mantenibilidad |
| 🟡 Media | React Query | Performance |
| 🟢 Baja | Activity feed | Nice-to-have |

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Líneas de código (componentes principales) | ~1400 | ~700 |
| Tiempo de carga inicial | ~3s | <1s |
| Tiempo de sync | ~30s | <15s |
| Deployable en Vercel | ❌ | ✅ |
| Tests coverage | 0% | >50% |
