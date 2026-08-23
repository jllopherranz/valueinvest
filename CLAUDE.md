# ValueInvest JLH — mapa del código

App de análisis de inversión *value*. **Estática, sin build**: se publica tal cual en GitHub Pages
(`jllopherranz.github.io/valueinvestjlh`). `index.html` es sólo el armazón (HTML + la lista de
módulos); todo el CSS vive en `assets/css/app.css` y toda la lógica en `assets/js/**`.

> **Cómo navegar:** cada módulo hace una cosa y ninguno pasa de ~500 líneas. Busca por **área**
> en la tabla de abajo y abre ese fichero entero — no hace falta escanear nada más.
> Para localizar un símbolo concreto: `grep -rn "function renderCartera" assets/js`.

---

## Reglas de oro (no romper)

1. **Datos válidos = del Excel del usuario.** El histórico y las proyecciones "buenas" vienen de su
   hoja de Google Drive (import). Nunca inventar datos como si fueran suyos. Las empresas añadidas
   **sin** Excel se marcan `estimated:true` y muestran un **banner ámbar "NO son de tu Excel"**
   (`estimatedBanner()`); sus proyecciones se rellenan por márgenes o consenso FMP.
2. **Secretos fuera del código.** Las API keys van en `localStorage`, no commiteadas.
   ⚠️ Deuda técnica conocida: hay una **key de Finnhub incrustada** en `assets/js/app/arranque.js`
   (`localStorage.setItem('finnhub_api_key',…)`). No propagar el patrón.
3. **Verificar antes de publicar.** Siempre, en este orden:
   ```bash
   bash tools/check.sh                 # sintaxis + orden de módulos + colisiones de símbolos
   python3 -m http.server 8137         # y probar en el navegador
   git add -A && git commit && git push
   ```
   Mensajes de commit en español, `Co-Authored-By: Claude`.
4. **Un símbolo global, un solo sitio.** Todos los módulos comparten el ámbito global (son
   `<script>` clásicos, no ES modules). Declarar dos veces el mismo `const`/`function` en ficheros
   distintos **rompe la app entera**. `tools/check.sh` lo detecta.

---

## Estructura del repositorio

```
index.html              armazón: <head> (tema, preconnect, CSS, 49 <script defer>) + HTML del <body>
assets/css/app.css      todo el CSS. Modo oscuro con la clase .dark (variables en :root y .dark)
assets/js/**            la lógica, un módulo por área (tabla abajo)
tools/modules.txt       ORDEN DE CARGA canónico de los módulos
tools/check.sh          verificación previa a publicar
```

### Cómo se cargan los módulos

`index.html` los lista como `<script defer src="assets/js/…">` en el orden de `tools/modules.txt`:
se descargan en paralelo y se ejecutan en ese orden con el DOM ya completo.
**Al añadir o mover un módulo hay que tocar los dos sitios** (`tools/check.sh` avisa si divergen).

Sólo tres reglas de orden importan de verdad; el resto son declaraciones de función y se elevan:

1. `data/empresas.js` antes que `core/estado.js` — porque `estado.js` hace `let co=DB.MSFT`.
2. `app/arranque.js` **el último** — arranca con todo ya declarado.
3. Los módulos con código suelto de nivel superior son autocontenidos:
   `market/divisas.js` (restaura la caché de FX), `app/navegacion.js` (listener de clic global) e
   `import/importar.js` (listener del selector de ticker).

### Librerías externas: bajo demanda

`Chart.js` (~200 KB) y `SheetJS/XLSX` (~430 KB) **ya no se cargan al abrir la app**.
`assets/js/core/cdn.js` las pide sólo cuando hacen falta:

- `await ensureChart()` — al principio de cualquier función que use `Chart`.
- `await ensureXLSX()` — antes de llamar a `parseExcelData()`.
- `precargarChart()` — sin `await`, al entrar en la vista Análisis (adelanta la descarga).

Si añades un gráfico nuevo, **empieza la función con `await ensureChart()`** y hazla `async`.

---

## Índice de módulos

| Módulo (`assets/js/…`) | Líneas | Qué hay dentro |
|---|--:|---|
| `core/cdn.js` | 41 | `ensureChart` · `ensureXLSX` · `precargarChart` |
| `data/empresas.js` | 499 | `DB` (9 empresas de fábrica) · `FICHA` (cualitativo/trimestral) |
| `data/catalogo.js` | 147 | `CATALOG` · `catalogFor` · `TICKER_ALIASES` · `tvSymbolFor`/`tvLinkFor` · `yfSymbolFor` · `logoUrlFor` · `MACRO_CAL` |
| `data/sec.js` | 95 | `fetchAnnualFinancials` (Finnhub/SEC) · `buildImportFromFinancials` · `_GAAP` |
| `core/estado.js` | 69 | estado global (`co`, `price`, `tEVF/tPER/…`, `_projSource`, `BUILTIN_KEYS`) · formateadores `N`/`P`/`cagr`/`_dm` · `resetIS` · `estimatedBanner` |
| `core/privado.js` | 29 | modo privado: `privado()` · `mny()` · `togglePrivado` |
| `market/divisas.js` | 205 | `curOf`/`curSymOf` · `yfSymbolForKey`/`fhSymbolForKey` · `listingCandidates`/`promptListing` (elegir cotización) · `fetchFX`/`toBase`/`fmtBase` |
| `market/yahoo.js` | 37 | `fetchQuoteYF` + `_parseYF` (cierre diario vía proxy CORS) · `curSymG` |
| `market/ultimo-precio.js` | 16 | caché `vi_lastpx_<KEY>` |
| `market/precio-vivo.js` | 155 | `fetchLivePrice`/`_fetchFinnhub` · `_applyPrice` · badge LIVE · `startPriceRefresh` · fecha de resultados |
| `company/perfil-datos.js` | 78 | `fetchCompanyProfile` · `sectorOf` · `industriaES` · dominio del logo |
| `company/perfil-auto.js` | 78 | `rPerfilAuto` · `refrescarPerfil` · `editarDominioLogo` |
| `valuation/multiplos.js` | 125 | `computeMediansFor` · `getCompanyMults`/`applyCompanyMults` · `avgTargetsFor`/`evfTargetsFor` (precios objetivo) · `coKeyOf` |
| `valuation/motor.js` | 55 | `calcDCF` · `calcMult` · `calcISModel` (proyección a 5 años) |
| `valuation/proyecciones.js` | 218 | `ensureWebProj` (consenso FMP o modelo SEC) · `setProjSource` · `autoISDFromFinancials` · `projectFromISD` · `fetchFMPEstimates` |
| `valuation/veredicto.js` | 189 | `calcMoat` · `calcReverseDCF` · `calcStressDCF` · `calcFCFQuality` · `calcVerdict` (COMPRAR/MANTENER/EVITAR) |
| `valuation/estilo.js` | 57 | `computeStyleFor` · `classifyStyle` (Growth/Value/Quality) |
| `ui/iconos.js` | 58 | `svgIcon` · `_ICONS` · `setLogo` |
| `ui/kpi.js` | 140 | acordeón de KPIs y popups educativos |
| `ui/tips.js` | 50 | `TIPS` · `showTip` · `injectTips` |
| `ui/graficos.js` | 53 | `buildCharts(tab)` — despacha los Chart.js de cada pestaña |
| `ui/tecnico.js` | 82 | `buildFairValueChart` · `computeTechnicals`/`renderTechnicals` (SMA/RSI) · `fetchDailyHistory` |
| `ui/panel-empresa.js` | 95 | `rSidebarEmpresa` · `rFichaEmpresa` |
| `user/mi-posicion.js` | 57 | precio de compra por empresa (`pos_<KEY>`) · `setCarteraPos` |
| `user/mi-posicion-render.js` | 132 | `rMiPosicion` (bloque dentro de Análisis) |
| `user/copia-seguridad.js` | 92 | exportar/importar los datos del usuario (base64 url-safe) |
| `tabs/resumen.js` | 467 | `rResumen` — la pestaña más grande |
| `tabs/graficos.js` | 98 | `rGraficos` · `buildMultHistChart` · escenarios de múltiplos |
| `tabs/valoracion.js` | 211 | `rValoracion` |
| `tabs/proyecciones.js` | 42 | `rProyecciones` (tabla editable) |
| `tabs/moat-dcf.js` | 120 | `rMoat` · `rDCF` · `openMetricChart` |
| `tabs/analisis.js` | 119 | `rAnalisis` · `rAlertas` |
| `tabs/tesis.js` | 77 | `rTesis` · `genTesis` (prompt IA) · `fmtAI` |
| `tabs/academia.js` | 24 | `rAcademia` |
| `dashboard/panel.js` | 115 | `renderDashboard` · `_startTicker` |
| `dashboard/mercado.js` | 167 | `fetchDashPrices` · `fetchEuribor` (BCE) · `fetchFearGreed` (CNN) · `updateDashMktTile` |
| `dashboard/noticias.js` | 254 | `fetchDashNews` · `scoreNews` · `newsImpact` · dedup (`newsSim`) · `_translateNews` |
| `cartera/nucleo.js` | 205 | `getImportedData` · `getAllPortfolioCompanies` · `carteraMetrics` · `calcPortfolioVI` · `renderStyleCompare` |
| `cartera/tabla.js` | 268 | `renderCartera` · orden/filtros · `verdictFor` · `sectorBucket` |
| `cartera/ayuda.js` | 136 | `COL_INFO` · `showColInfo`/`showGvHelp`/`showCarteraHelp` |
| `cartera/resumen.js` | 195 | `portfolioStats` · `renderPortfolioSummary` · `renderTodayPanel` · rejilla de múltiplos |
| `cartera/precios.js` | 75 | `fetchCarteraPrices` · `updateCarteraRow` · pesos |
| `watchlist/seguimiento.js` | 187 | `computePreAnalysis` · `fetchFundamentals` · `getWatchlist` |
| `watchlist/render.js` | 139 | `renderWatchlist` · `promoteToAnalysis` · alta/baja |
| `import/importar.js` | 486 | `doImport` · `parseExcelData` · `buildDbEntryFromImport` · `hydrateImportedIntoDB` · `importFromLink`/`refreshAllImports` · `deleteCompanyFull` |
| `app/navegacion.js` | 49 | `switchCo` · `toggleAnalysisMenu` |
| `app/recalculo.js` | 174 | `recalc` + los `_refresh*` del DOM · `showTab` |
| `app/vistas.js` | 103 | `setView` (dash/watch/analysis) · `startDashRefresh` |
| `app/arranque.js` | 44 | IIFE de arranque: monta pestañas, hidrata empresas, abre el Dashboard |

---

## Modelo de datos

- **`DB`** (`data/empresas.js`): `{KEY: {…}}` con las 9 empresas de fábrica (MSFT, ASML, AMZN, CSU,
  AAPL, GOOGL, META, NVDA, WDC). Por empresa: `name, ticker, tvSymbol, shares, price, color, wacc,
  sector`, series de 10 años (`sales, ebit, ebitda, netIncome, fcf, eps, fcfps, roic, ebitdaM,
  ebitM, fcfM, netDebt, years`), múltiplos históricos (`hEvF, hPER, hEvEbitda, hEvEbit`), medianas
  (`medPER, medEvFcf, medEvEbitda, medEvEbit`, `med5*`), proyecciones (`pY, pS, pEB, pF, pEPS, pND`) e `isD`.
- **`FICHA`** (`data/empresas.js`): datos cualitativos/trimestrales/mercado por empresa.
- **`CATALOG`** (`data/catalogo.js`): catálogo para importar. `catalogFor(key)` resuelve alias
  (`TSMC→TSM`, `2330→TSM`) y sufijos de bolsa.
- **Empresas del usuario**: en `localStorage` (`vi_import_*`), recuperadas a `DB` al arrancar con
  `hydrateImportedIntoDB()` → `buildDbEntryFromImport()`.

### Claves de `localStorage`

Datos del usuario (entran en la copia de seguridad): `vi_import_<KEY>` · `pos_<KEY>` ·
`vi_drive_<KEY>` · `vi_mults_<KEY>` · `vi_watchlist` · `vi_hidden` · `finnhub_api_key` · `fmp_api_key`.
Cachés/ajustes (no críticos): `vi_autoval_*` · `vi_euribor` · `vi_feargreed` · `vi_news_es` ·
`vi_lastpx_<KEY>` · `vi_view` · `vi_dark` · `vi_gv_open` · `vi_fx_<BASE>` · `vi_cur_<KEY>` ·
`vi_yf_<KEY>` · `vi_profile_<KEY>` · `vi_domain_<KEY>` · `vi_privado` · `vi_base_cur`.

---

## Fuentes de datos externas (todo en cliente, con proxies CORS)

- **Finnhub** (`finnhub.io`): precio en vivo, cuentas anuales SEC, earnings, noticias. Key en `localStorage`.
- **Yahoo Finance** (chart API vía `corsproxy.io` / `allorigins.win`): cierre diario e histórico para el técnico.
- **FMP** (`financialmodelingprep.com`): consenso de analistas. Key opcional.
- **BCE** (`data-api.ecb.europa.eu`): Euríbor 12M · **CNN**: fear & greed · **Google translate** gtx: noticias.
- **TradingView**: widget embebido por `<iframe>` (las bolsas no-US como Taiwán no cargan → se usa el ADR).

---

## Convenciones y trampas

- **`_dm()` es una función** (`document.documentElement.classList.contains('dark')`). Llamarla
  siempre como `_dm()`, nunca `_dm` (siempre truthy).
- Los renders mezclan color claro/oscuro con `${_dm()?osc:claro}` **dentro de template literals**.
  Nunca meter `${_dm()…}` en reglas CSS de `app.css` (ahí no hay JS que lo interpole).
- **Ámbito global compartido**: los módulos son `<script>` clásicos. Las `function` declaradas
  arriba del todo quedan en `window` (por eso funcionan los `onclick="…"` del HTML); los
  `const`/`let` de nivel superior **no** están en `window`, aunque sí los ven los demás módulos.
  Un handler `onclick` sólo puede llamar a `function` declaradas, no a `const f = () => …`.
- **Nada de duplicar símbolos** entre módulos (ver regla de oro 4).
- La app no tiene tests automáticos: la red de seguridad es `tools/check.sh` + probarla en el navegador.
- Empresas: 9 de fábrica (`BUILTIN_KEYS`) + las añadidas por el usuario. Al borrar, las de fábrica
  se **ocultan** (restaurables) y las añadidas se **eliminan**.
