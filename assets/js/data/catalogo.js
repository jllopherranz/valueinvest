// ─────────────────────────────────────────────────────────────
// Catálogo de empresas: alias de ticker, símbolos TradingView/Yahoo, dominios y logos
// ─────────────────────────────────────────────────────────────
// ── Render dashboard ──
const DASH_COMPANIES=[
  {key:'CSU', name:'Constellation Software',ticker:'CSU.TO', fhTicker:'CSU.TO',    color:'#1e3a5f',score:77,verdict:'COMPRAR',vc:'#16a34a',
   earnings:'2026-08-06',elbl:'Q2 2026',
   drive:'https://docs.google.com/spreadsheets/d/1lgpQ7WpOg6ZF4MdqFpLQPVtdGQVg6al9bIlYmQ1NJ8U/edit?usp=drive_web'},
  {key:'ASML',name:'ASML Holding N.V.',     ticker:'ASML',fhTicker:'ASML',   color:'#0066cc',score:28,verdict:'EVITAR', vc:'#dc2626',
   earnings:'2026-07-16',elbl:'Q2 2026',
   drive:'https://docs.google.com/spreadsheets/d/1TGqeRkGGvfgJeVQ4AOj9ZANQHVfT_Hx9gRbsLed5mfk/edit?usp=drive_web&ouid=108702865563280575992'},
  {key:'AMZN',name:'Amazon.com Inc.',        ticker:'AMZN',fhTicker:'AMZN',   color:'#e47911',score:54,verdict:'MANTENER',vc:'#d97706',
   earnings:'2026-08-01',elbl:'Q2 2026',
   drive:'https://docs.google.com/spreadsheets/d/1facSdU7BR6Q-WTd6149zFEyrQ8h_Ym16uAiV_3r9gmk/edit?usp=drive_web'},
  {key:'MSFT',name:'Microsoft Corporation',  ticker:'MSFT',fhTicker:'MSFT',   color:'#00a4ef',score:71,verdict:'COMPRAR',vc:'#16a34a',
   earnings:'2026-07-30',elbl:'Q4 FY26',
   drive:'https://docs.google.com/spreadsheets/d/14Ae9FhaC0rz1EViqUYHj5sx2bsCCAkY7bftukoU0HL8/edit'},
  {key:'AAPL',name:'Apple Inc.',              ticker:'AAPL',fhTicker:'AAPL',   color:'#555',   score:43,verdict:'EVITAR', vc:'#dc2626',
   earnings:'2026-07-31',elbl:'Q3 FY26',
   drive:'https://docs.google.com/spreadsheets/d/1DZjsCNdxIPdPbK44w82MnoSqb2kObNaPBjf-OfMIKJ0/edit?usp=drive_web'},
  {key:'GOOGL',name:'Alphabet Inc.',          ticker:'GOOGL',fhTicker:'GOOGL', color:'#4285f4',score:57,verdict:'MANTENER',vc:'#d97706',
   earnings:'2026-07-29',elbl:'Q2 2026',
   drive:'https://docs.google.com/spreadsheets/d/1HitKQkGLmmaalHbDLg5e1F-IYb57co4o/edit?usp=drive_web'},
  {key:'META',name:'Meta Platforms Inc.',     ticker:'META',fhTicker:'META',   color:'#1877f2',score:16,verdict:'EVITAR', vc:'#dc2626',
   earnings:'2026-07-30',elbl:'Q2 2026',
   drive:'https://docs.google.com/spreadsheets/d/1v-6hPrH9_CjzeU4IzsaZWWjjFpIcoiKJ/edit?usp=drive_web&ouid=108702865563280575992&rtpof=true'},
  {key:'NVDA',name:'NVIDIA Corporation',      ticker:'NVDA',fhTicker:'NVDA',   color:'#76b900',score:46,verdict:'EVITAR', vc:'#dc2626',
   earnings:'2026-08-27',elbl:'Q2 FY27',
   drive:'https://docs.google.com/spreadsheets/d/1gFLvI4ThZ1brcPXU5NbAjPTSo1P0pWAavJz58cHLlE0/edit?usp=drive_web'},
  {key:'WDC', name:'Western Digital Corp.',   ticker:'WDC', fhTicker:'WDC',   color:'#005594',score:22,verdict:'EVITAR', vc:'#dc2626',
   earnings:'2026-04-30',elbl:'Q3 FY26',
   drive:'https://docs.google.com/spreadsheets/d/14f2Eq80UMkHYxPoTEQRDOPp85dSMz3tP7QXbKtmAxBk/edit?usp=drive_web'},
];

// Dominio de cada empresa → logo de marca real (Clearbit cerró en 2024; usamos DuckDuckGo + favicon Google de respaldo)
// Catálogo de empresas conocidas: aparecen por nombre en "Añadir/Importar" y autocompletan
// nombre, sector, color y logo (sin tener que escribirlo a mano). Amplíalo libremente.
const CATALOG={
  MSFT:{name:'Microsoft',domain:'microsoft.com',color:'#00a4ef',sector:'Software / Cloud / IA'},
  AAPL:{name:'Apple',domain:'apple.com',color:'#555555',sector:'Hardware / Consumo'},
  GOOGL:{name:'Alphabet (Google)',domain:'google.com',color:'#4285f4',sector:'Publicidad / IA / Cloud'},
  AMZN:{name:'Amazon',domain:'amazon.com',color:'#e47911',sector:'eCommerce / Cloud (AWS)'},
  META:{name:'Meta Platforms',domain:'meta.com',color:'#1877f2',sector:'Redes sociales / Publicidad'},
  NVDA:{name:'NVIDIA',domain:'nvidia.com',color:'#76b900',sector:'Semiconductores / IA'},
  ASML:{name:'ASML Holding',domain:'asml.com',color:'#0066cc',sector:'Semiconductores (litografía)'},
  CSU:{name:'Constellation Software',domain:'csisoftware.com',color:'#1e3a5f',sector:'Software (VMS)'},
  WDC:{name:'Western Digital',domain:'westerndigital.com',color:'#005594',sector:'Almacenamiento (HDD)'},
  AVGO:{name:'Broadcom',domain:'broadcom.com',color:'#cc092f',sector:'Semiconductores / Software'},
  AMD:{name:'Advanced Micro Devices',domain:'amd.com',color:'#ed1c24',sector:'Semiconductores'},
  TSM:{name:'TSMC',domain:'tsmc.com',color:'#d4002a',sector:'Semiconductores (foundry)',tv:'NYSE:TSM'},
  INTC:{name:'Intel',domain:'intel.com',color:'#0071c5',sector:'Semiconductores'},
  QCOM:{name:'Qualcomm',domain:'qualcomm.com',color:'#3253dc',sector:'Semiconductores / Móvil'},
  TXN:{name:'Texas Instruments',domain:'ti.com',color:'#cc0000',sector:'Semiconductores (analógico)'},
  MU:{name:'Micron Technology',domain:'micron.com',color:'#0a2240',sector:'Memoria / Semiconductores'},
  STX:{name:'Seagate Technology',domain:'seagate.com',color:'#6ebe49',sector:'Almacenamiento (HDD)'},
  AMAT:{name:'Applied Materials',domain:'appliedmaterials.com',color:'#0077c8',sector:'Equipos semiconductores'},
  LRCX:{name:'Lam Research',domain:'lamresearch.com',color:'#00a3e0',sector:'Equipos semiconductores'},
  KLAC:{name:'KLA Corporation',domain:'kla.com',color:'#005eb8',sector:'Equipos semiconductores'},
  ORCL:{name:'Oracle',domain:'oracle.com',color:'#f80000',sector:'Software / Cloud'},
  CRM:{name:'Salesforce',domain:'salesforce.com',color:'#00a1e0',sector:'Software (CRM)'},
  ADBE:{name:'Adobe',domain:'adobe.com',color:'#ed2224',sector:'Software (creativo)'},
  NOW:{name:'ServiceNow',domain:'servicenow.com',color:'#62d84e',sector:'Software (workflow)'},
  INTU:{name:'Intuit',domain:'intuit.com',color:'#365ebf',sector:'Software / Fintech'},
  SAP:{name:'SAP',domain:'sap.com',color:'#0faaff',sector:'Software empresarial'},
  NFLX:{name:'Netflix',domain:'netflix.com',color:'#e50914',sector:'Streaming'},
  TSLA:{name:'Tesla',domain:'tesla.com',color:'#cc0000',sector:'Automoción / Energía'},
  V:{name:'Visa',domain:'visa.com',color:'#1a1f71',sector:'Pagos'},
  MA:{name:'Mastercard',domain:'mastercard.com',color:'#eb001b',sector:'Pagos'},
  PYPL:{name:'PayPal',domain:'paypal.com',color:'#003087',sector:'Pagos / Fintech'},
  COST:{name:'Costco',domain:'costco.com',color:'#e32737',sector:'Retail (membresía)'},
  SHOP:{name:'Shopify',domain:'shopify.com',color:'#95bf47',sector:'eCommerce SaaS'},
  UBER:{name:'Uber',domain:'uber.com',color:'#000000',sector:'Movilidad / Delivery'},
  PLTR:{name:'Palantir',domain:'palantir.com',color:'#101113',sector:'Software / Datos'},
  CRWD:{name:'CrowdStrike',domain:'crowdstrike.com',color:'#e01a22',sector:'Ciberseguridad'},
  SNOW:{name:'Snowflake',domain:'snowflake.com',color:'#29b5e8',sector:'Datos / Cloud'},
  PANW:{name:'Palo Alto Networks',domain:'paloaltonetworks.com',color:'#f04e23',sector:'Ciberseguridad'},
};
const LOGO_DOMAINS={CSU:'csisoftware.com',ASML:'asml.com',AMZN:'amazon.com',MSFT:'microsoft.com',AAPL:'apple.com',GOOGL:'google.com',META:'meta.com',NVDA:'nvidia.com',WDC:'westerndigital.com',AMD:'amd.com',NFLX:'netflix.com',STX:'seagate.com',V:'visa.com'};
// Variantes de ticker que apuntan a la misma empresa del catálogo (ADR, bolsa local, etc.)
const TICKER_ALIASES={TSMC:'TSM','2330':'TSM','2330.TW':'TSM','TSM.US':'TSM','GOOG':'GOOGL','FB':'META','BRK.B':'BRKB'};
// Símbolo que SÍ carga en el widget gratuito. Bolsas como Taiwán (TWSE) no están disponibles
// en el embed → se usa el ADR de EE.UU. (misma empresa/tendencia, en USD).
const TV_EMBED={'2330':'NYSE:TSM','2330.TW':'NYSE:TSM'};
// Símbolo de la bolsa LOCAL (moneda local) para el enlace "Ver en TradingView" (web completa)
const TV_LINK={'2330':'TWSE:2330','2330.TW':'TWSE:2330'};
function tvSymbolFor(key,ticker){
  for(const c of [key,ticker]){ if(c&&TV_EMBED[String(c).toUpperCase()]) return TV_EMBED[String(c).toUpperCase()]; }
  const cat=catalogFor(key)||catalogFor(ticker);
  return (cat&&cat.tv)||null;
}
function tvLinkFor(key,ticker){
  for(const c of [key,ticker]){ if(c&&TV_LINK[String(c).toUpperCase()]) return TV_LINK[String(c).toUpperCase()]; }
  return null;
}
// Símbolo de Yahoo Finance para bolsas locales (el ticker suelto no resuelve: Taiwán necesita .TW)
const YF_LOCAL={'2330':'2330.TW','2330.TW':'2330.TW'};
function yfSymbolFor(key,ticker){
  if(YF_TICKER[key]) return YF_TICKER[key];
  for(const c of [key,ticker]){ if(c&&YF_LOCAL[String(c).toUpperCase()]) return YF_LOCAL[String(c).toUpperCase()]; }
  // Normaliza formatos de ticker de bolsas asiáticas al símbolo de Yahoo
  let t=String(ticker||key||'').toUpperCase().trim();
  t=t.replace(/^TWSE:/,'').replace(/\s+(TT|TW)$/,'');   // "TWSE:2330", "2330 TT" → 2330
  if(/^\d{4}(\.TWO?)?$/.test(t)) return t.includes('.')?t:t+'.TW'; // código numérico taiwanés → .TW
  return t;
}
// Resuelve la entrada del CATÁLOGO tolerando alias y sufijos de bolsa (TSM.US, ASML.AS, 2330.TW…)
function catalogFor(key){
  if(!key) return null;
  const up=String(key).toUpperCase();
  if(CATALOG[up]) return CATALOG[up];
  if(TICKER_ALIASES[up]&&CATALOG[TICKER_ALIASES[up]]) return CATALOG[TICKER_ALIASES[up]];
  const base=up.split('.')[0];                       // quita sufijo de bolsa (.AS, .TO, .TW…)
  if(CATALOG[base]) return CATALOG[base];
  if(TICKER_ALIASES[base]&&CATALOG[TICKER_ALIASES[base]]) return CATALOG[TICKER_ALIASES[base]];
  return null;
}
function _domainFor(key){
  return domainOverride(key)||LOGO_DOMAINS[key]||(CATALOG[key]&&CATALOG[key].domain)
    ||(companyProfile(key)&&companyProfile(key).domain)
    ||(getImportedData(key)?.domain)||(catalogFor(key)&&catalogFor(key).domain);
}
// Logo: primero el que publica la propia empresa (vía Finnhub), luego el favicon de su web
function logoUrlFor(key){
  const prof=companyProfile(key);
  if(!domainOverride(key)&&prof&&prof.logo) return prof.logo;
  const dom=_domainFor(key);
  return dom?('https://icons.duckduckgo.com/ip3/'+dom+'.ico'):null;
}
function logoFallback(key){
  const dom=_domainFor(key);
  if(dom) return 'https://www.google.com/s2/favicons?sz=64&domain='+dom;
  const prof=companyProfile(key);
  return (prof&&prof.logo)||'';
}
const LOGOS_DASH=new Proxy({},{get:(_,k)=>typeof k==='string'?logoUrlFor(k):undefined}); // compat: LOGOS_DASH[key] sigue funcionando

const MACRO_CAL=[
  {date:'2026-05-21',title:'Actas FOMC',sub:'Publicación actas reunión 6-7 mayo',c:'#1e3a5f'},
  {date:'2026-06-06',title:'NFP Mayo',sub:'Empleos no agrícolas — clave para Fed',c:'#d97706'},
  {date:'2026-06-11',title:'IPC Mayo EE.UU.',sub:'Dato inflación mensual',c:'#dc2626'},
  {date:'2026-06-18',title:'Decisión Fed (FOMC)',sub:'¿Bajada en junio?',c:'#1e3a5f'},
  {date:'2026-07-02',title:'NFP Junio',sub:'Dato empleo mensual',c:'#d97706'},
  {date:'2026-07-15',title:'IPC Junio EE.UU.',sub:'Dato inflación',c:'#dc2626'},
  {date:'2026-07-29',title:'PIB EE.UU. Q2',sub:'1ª estimación trimestral',c:'#7c3aed'},
  {date:'2026-07-30',title:'Decisión Fed (FOMC)',sub:'Reunión julio',c:'#1e3a5f'},
  {date:'2026-09-17',title:'Decisión Fed (FOMC)',sub:'Reunión septiembre',c:'#1e3a5f'},
  {date:'2026-11-05',title:'Decisión Fed (FOMC)',sub:'Reunión noviembre',c:'#1e3a5f'},
  {date:'2026-12-16',title:'Decisión Fed (FOMC)',sub:'Reunión diciembre',c:'#1e3a5f'},
];
