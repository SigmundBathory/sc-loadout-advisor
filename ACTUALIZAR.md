# Cómo actualizar los datos de SC Loadout Advisor

## Requisitos previos
- Node.js instalado
- Git configurado con acceso al repo
- SSH key configurada en `C:\Users\Sig\.ssh\id_ed25519`

## Paso 1: Sincronizar datos frescos

Desde la carpeta del proyecto:

```bash
npx tsx sync-now.ts
```

Esto descarga datos de:
- **Wiki API** (`api.star-citizen.wiki`): naves, componentes, precios, estadísticas
- **UEX Corp** (`api.uexcorp.space`): ubicaciones de terminales de compra

Tiempo estimado: ~2-3 minutos.

## Paso 2: Push a GitHub (actualiza Render)

```bash
git add data/sc-loadout.db
git commit -m "sync: [versión] ([N] ships, [N] components)"
git push
```

Render auto-despliega al hacer push al branch `main`.

## Paso 3: Verificar en Render

1. Ir a `https://sc-loadout-advisor.onrender.com/dashboard`
2. Esperar ~30s (Render free tier cold start)
3. Verificar que aparecen naves y componentes

## Datos que se sincronizan

| Tipo | Fuente | Endpoint |
|------|--------|----------|
| Naves (278) | Wiki API | `/api/vehicles` |
| Armas (172) | Wiki API | `/api/vehicle-weapons` |
| Componentes (579) | Wiki API | `/api/items` (Shield, PowerPlant, Cooler, QD, Radar, FC, LifeSupport) |
| Precios | Wiki API | `uec_prices.purchase[].price_buy` |
| Ubicaciones (825) | UEX Corp | `/terminals` |
| Versiones | Wiki API | `/api/game-versions` |

## Versión actual
- **4.9.0-LIVE.12232306** (LIVE)

## Archivos importantes
- `data/sc-loadout.db` — Base de datos SQLite (committeada en git)
- `sync-now.ts` — Script de sincronización
- `src/lib/db/sync.ts` — Lógica de sync
- `src/lib/api/starCitizenWiki.ts` — Cliente Wiki API
- `src/lib/api/uexCorp.ts` — Cliente UEX Corp API

## Errores conocidos
- **Wiki API desde Render**: retorna 500 (bloquea IPs de cloud). Por eso los datos se sincronizan local y se pushen.
- **Algunos vehículos sin imagen**: Wiki API no siempre tiene `thumbnail_url`. Se usa fallback a `original_url`.

## Si cambia la versión del juego

La Wiki API detecta automáticamente la versión LIVE actual. Si sale una nueva versión:
1. Ejecutar `npx tsx sync-now.ts`
2. La versión se detecta automáticamente
3. Push a GitHub

## Si necesitas datos PTU

Los datos PTU no están en la Wiki API. Se importan manualmente desde **erkul.games**:
1. Ir a `/import` en la app
2. Subir archivo JSON exportado de erkul
3. O usar la API: `POST /api/import` con el JSON
