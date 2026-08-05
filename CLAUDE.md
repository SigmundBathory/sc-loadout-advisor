@AGENTS.md

# Proyecto: SC Loadout Advisor

## Comandos Importantes
```bash
npm run dev          # Iniciar servidor (puerto 3000)
npx tsc --noEmit     # Verificar TypeScript
```

## Convenciones
- Usa `better-sqlite3` para DB (no knex/orm)
- Params SQL como arrays: `stmt.run([a, b, c])`
- Componentes en `src/components/`, pages en `src/app/`
- API routes en `src/app/api/*/route.ts`

## Estructura de Datos
- Wiki API: `v.crew` es objeto `{min, max}`, `v.images[0].source`
- Wiki API: `page[number]=N` para paginación (no `page=N`)
- Wiki API: `items` endpoint ignora filtro `type`
- Version codes: `4.9.0-LIVE.12232306` (LIVE) o `4.10.0-PTU.12358556` (PTU)

## Limitaciones Conocidas
- UEX API necesita `NEXT_PUBLIC_UEX_API_KEY` en `.env.local`
- Stats de componentes limitadas (HP shields = 0, power output = 0)
- No hay persistencia de usuario (loadouts se pierden)
- START.bat mata proceso en puerto 3000 antes de iniciar
