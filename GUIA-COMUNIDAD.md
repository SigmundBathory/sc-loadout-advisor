# SC Loadout Advisor — Guía para la Comunidad

**SC Loadout Advisor** es una herramienta web de Star Citizen que te permite **explorar naves, configurar loadouts, optimizarlos automáticamente, comparar configuraciones y localizar dónde comprar cada componente** en el universo del juego.

Los datos provienen de múltiples fuentes de la comunidad: la **Star Citizen Wiki API**, **UEX Corp** (precios y tiendas), **scfocus.org** (ubicaciones de naves) y **Wikelo** (naves de evento obtenibles por misiones).

> Nota: la interfaz está en español. Toda la app funciona en el navegador sin instalar nada.

---

## Índice de secciones

| Sección | Qué hace |
|---|---|
| [Dashboard (Inicio)](#1-dashboard-inicio) | Resumen del juego, estadísticas y acceso rápido |
| [Naves](#2-naves) | Catálogo completo con filtros y detalle por nave |
| [Detalle de nave / Loadout Builder](#3-detalle-de-nave--loadout-builder) | Configura componentes a mano, optimiza y guarda |
| [Optimizador](#4-optimizador) | Genera el mejor loadout según tus prioridades |
| [Comparador](#5-comparador) | Compara naves y configuraciones lado a lado |
| [Importar](#6-importar) | Importa datos JSON externos (erkul.games, etc.) |
| [Sincronización](#7-sincronizacion-y-version) | Actualiza la base de datos y cambia de versión del juego |
| [Centro de Actualizaciones](#8-centro-de-actualizaciones) | Cambios entre versiones del juego |

---

## 1. Dashboard (Inicio)

Es la pantalla principal al abrir la app. Muestra una vista general de la base de datos:

- **Tarjetas de estadísticas**: total de naves, componentes, fabricantes y fecha de la última sincronización.
- **Distribución de fabricantes**: gráfico de tarta con cuántas naves tiene cada fabricante.
- **Top DPS**: las 5 naves con mayor daño por segundo potencial.
- **Cambios de versión**: novedades entre la versión actual y la anterior del juego.
- **Loadouts recientes**: configuraciones guardadas por otros usuarios.
- **Acciones rápidas**: atajos a Sync, Importar, Nuevo Loadout, Optimizar, Comparar y Config.
- **Versión del juego activa**: se muestra en la esquina superior derecha (ej. `4.9.0 LIVE`).

Si la base de datos está vacía, el dashboard muestra el **panel de sincronización** para cargar todos los datos por primera vez (ver [Sincronización](#7-sincronizacion-y-version)).

---

## 2. Naves

Sección para explorar todo el catálogo de naves de Star Citizen.

### Qué puedes ver
- **Vista de cuadrícula** (tarjetas con imagen) o **vista de lista**.
- Cada nave muestra: nombre, fabricante, clasificación (caza, carga, exploración, etc.), tripulación, velocidad SCM, puntos de casco, capacidad de carga y precio en aUEC.
- **Badge "Optimizada"**: las naves que tienen un loadout guardado como optimizado muestran una insignia verde.

### Qué puedes configurar / hacer
- **Buscar** por nombre, modelo o fabricante.
- **Filtrar por fabricante** y por **clasificación**.
- **Limpiar filtros** con un clic.
- **Entrar al detalle** de cualquier nave haciendo clic en su tarjeta, para configurar su loadout.

---

## 3. Detalle de nave / Loadout Builder

Al entrar en una nave (desde la lista de naves o desde el Optimizador) se abre esta página. Es el **corazón de la aplicación**: aquí configuras y guardas los loadouts.

### Disponibilidad In-Game
Panel superior con cómo conseguir la nave en el juego:
- **Compra**: tienda, ubicación y precio en aUEC.
- **Alquiler (1 día)**: tienda y precio.
- **Obtener (Misiones/Wikelo)**: misiones de evento, requisitos, reputación y componentes incluidos.

### Loadout Builder
El constructor tiene 3 columnas:

1. **Información de la nave + Métricas del Loadout** (izquierda):
   - Ficha de la nave (fabricante, velocidad, casco, carga, etc.).
   - **Métricas del Loadout** con barras que se actualizan en vivo: DPS de armas, HP de escudos, regeneración de escudos, salida de energía, enfriamiento, velocidad quantum y costo estimado.
   - Cada métrica muestra un **delta (+/- en verde o rojo)** frente a la configuración de referencia (el loadout cargado o el stock de la nave), para que veas **qué ganas o pierdes** con cada cambio.

2. **Configuración Actual** (centro):
   - Lista de todos los slots (armas, torretas, escudos, planta de energía, enfriadores, salto quantum, radar, control de vuelo, soporte vital).
   - Cada slot muestra el componente equipado, su precio, primera tienda donde comprarlo y sus stats clave.
   - **Click en un slot** para abrir el selector de componentes.
   - Botón **X** para vaciar el slot.

3. **Métricas del Loadout — Radar** (derecha):
   - Gráfico radial que compara tu loadout contra el stock de la nave (casco, escudos, DPS, velocidad, energía, enfriamiento).

### Selector de componentes (al hacer click en un slot)
- La lista se muestra **ordenada por la estadística principal** del tipo de componente (mejor primero):
  - Armas → **DPS**; Escudos → **HP**; Planta de energía → **Salida**; Enfriadores → **Enfriamiento**; Salto quantum → **Alcance**; Radar → **Alcance**; Control de vuelo → **SCM Speed**.
- Debajo de cada componente se muestran sus **stats de trade-off** para que decidas:
  - Ej. en un **salto quantum** ves: `Alcance · Velocidad · Consumo (SCU/Gm) · Spool · Enfriado`. Si el mejor en alcance sacrifica velocidad, ves justo debajo las alternativas con su velocidad/consumo.
- El componente **actualmente equipado va arriba** marcado como "Equipado".
- Cada componente muestra su **precio y hasta 3 tiendas** donde comprarlo (tienda + planeta).
- **Buscar** por nombre o fabricante.

### Botones de acción (arriba)
- **Cargar**: abre la lista de loadouts guardados para esa nave (y para todas).
- **Optimizar**: abre el diálogo de optimización con **7 presets**:
  - ⚡ Más Rápida · 🛰️ Mayor Alcance · 🔫 Mejor Armamento · 🛡️ Mejor Defensa · 💰 Más Barata · 👻 Sigilo · ⚖️ Equilibrado.
  - Aplica los mejores componentes en vivo, **sin necesidad de guardar**.
- **Guardar**: guarda el loadout actual con un nombre. Si viene del optimizador se marca como **Optimizada** (y se guarda su preset + estadísticas).
- **Badge de estado**: muestra si la configuración actual es **Estándar** o **Optimizada**.

### Pestaña Comprar
Lista todos los componentes del loadout con sus **tiendas, ubicaciones y precios** para que sepas exactamente dónde adquirirlos.

---

## 4. Optimizador

Sección dedicada a generar **el mejor loadout automáticamente** según tus prioridades.

### Cómo usarlo (izquierda → derecha)
1. **Selecciona una nave** (busca por nombre o fabricante).
2. **Ajusta las prioridades** con sliders:
   - `Ataque` (DPS), `Defensa`, `Velocidad`, `Alcance`, `Coste`.
   - O elige un **preset** rápido (Equilibrado, Más Rápida, Mayor Alcance, Mejor Armamento, Mejor Defensa, Más Barata, Sigilo) que ajusta los sliders automáticamente.
3. **Elige qué slots optimizar**: armas, escudos, salto quantum, planta de energía, enfriadores, misiles (desmarca los que no quieras tocar).
4. **Presupuesto máximo opcional** (en aUEC).
5. **"Ejecutar Optimización"**.

### Resultados
- **Resumen**: nave, puntuación total, costo y mejor componente destacado.
- **Detalle del quantum drive elegido**: velocidad de salto, tiempo de spool y capacidad de combustible.
- **Pestaña Componentes**: lista de todos los componentes elegidos, con tiendas y precios.
- **Pestaña Comprar**: lista de compra completa con ubicaciones.
- **Pestaña Radar**: gráfico radial de las métricas del loadout generado.

### Acciones sobre el resultado
- **"Aplicar al Constructor"**: carga el loadout optimizado en el builder de esa nave para editarlo o guardarlo.
- **"Guardar Loadout"**: guarda la configuración optimizada directamente (aparecerá como "Optimizada" en el selector de naves y será usable en el comparador).

---

## 5. Comparador

Permite comparar **hasta 4 configuraciones** a la vez: distintas naves, la misma nave con distintos loadouts, o mezclas (ej. una nave Estándar contra otra Optimizada).

### Cómo usarlo
1. **Busca y añade naves** en el buscador (máx. 4). El buscador indica cuántos loadouts guardados tiene cada nave.
2. **Añade la misma nave varias veces** para comparar su configuración Estándar contra sus loadouts guardados.
3. En cada chip superior puedes **cambiar el loadout** con el desplegable: `Estándar (stock)` o cualquier loadout guardado (los optimizados llevan ⚡).
4. **Borra una configuración** con la X.

### Editor en vivo (por cada configuración)
Cada nave añadida muestra un **editor de slots**:
- Cambia componentes individuales con los desplegables (ordenados por stat principal, como en el builder).
- **Optimizar**: ejecuta la optimización de esa nave en el momento con el preset elegido.
- **Estándar**: vuelve a la configuración de stock.
- Todo se refleja **al instante** en el radar y la tabla.

### Qué ves
- **Gráfico radar** (Comparación Visual): DPS, escudos, casco, velocidad y tripulación de cada configuración, cada una con su color.
- **Tabla de estadísticas detalladas**:
  - Base de la nave: fabricante, clasificación, crew, masa, velocidades, casco, escudo, carga, slots.
  - **Del loadout (en vivo)**: DPS, regeneración de escudo, potencia, refrigeración, alcance QT, costo.
  - **Tipo**: Estándar, Manual u Optimizada.

---

## 6. Importar

Permite cargar datos JSON externos a la base de datos, útil si no puedes usar la sincronización automática.

### Cómo usarlo
1. **Versión del juego** (ej. `4.10.0-PTU.12358556`). Se autodetecta desde el nombre del archivo si es posible.
2. **Tipo de importación**: Completo, Naves, Componentes o Armas.
3. **Selecciona el archivo JSON** (arrastra o haz click).
4. Pulsa **Importar Datos**.

### De dónde sacar archivos JSON
Instrucciones incluidas en la propia página para **erkul.games**:
1. Abre erkul.games en tu navegador.
2. Pulsa **F12** → pestaña **Network (Red)**.
3. Recarga la página y localiza las llamadas a la API.
4. Click derecho sobre la respuesta → **"Copy response"**.
5. Pega el contenido en un archivo `.json` y súbelo aquí.

---

## 7. Sincronización y Versión

### Sincronización completa (3 pasos)
Desde la **barra superior** (indicador de sincronización) o desde el dashboard puedes ejecutar una sincronización completa:
1. **Wiki API + UEX**: naves, componentes, precios y tiendas.
2. **Ubicaciones de naves (scfocus.org)**: dónde comprar/alquilar cada nave.
3. **Wikelo (Google Sheets)**: naves de evento obtenibles por misiones.

> La sincronización automática desde el navegador puede fallar si el servidor no tiene acceso a la wiki. En ese caso, la app incluye una base de datos precargada; o bien ejecuta la sincronización en local con `npm run sync` y sube la base de datos.

### Selector de versión
En la barra superior puedes **cambiar la versión activa del juego** (LIVE / PTU). Los datos (naves, componentes, precios) se filtran según la versión seleccionada. La versión activa se muestra en el dashboard.

### Indicador de sincronización
Muestra el estado de la base de datos (OK / pendiente / error). También existe el botón **"Sincronizar Todo"** en el panel de sincronización.

---

## 8. Centro de Actualizaciones

Botón **"Actualizaciones"** en la barra superior. Muestra el **historial de cambios** del juego entre versiones (naves, componentes, armas modificadas), para que sepas qué ha cambiado en la versión que estás usando.

---

## Consejos rápidos

- **No necesitas guardar para probar**: usa "Optimizar" y edita slots libremente; las métricas se actualizan en vivo. Guarda solo cuando quieras conservar una configuración o usarla en el comparador.
- **El badge verde "Optimizada"** te permite identificar de un vistazo qué naves tienen un loadout optimizado.
- **Compara la misma nave dos veces** (una Estándar, una con su loadout optimizado) para ver exactamente cuánto mejora.
- **Orden del selector**: los componentes siempre se ordenan por la stat principal del tipo, con el equipado arriba — usa los datos de trade-off (velocidad vs consumo, HP vs regen, etc.) para decidir.

---

*Documentación para la comunidad — SC Loadout Advisor. Los datos provienen de Star Citizen Wiki, UEX Corp, scfocus.org y Wikelo; Star Citizen es una marca de Cloud Imperium Games.*
