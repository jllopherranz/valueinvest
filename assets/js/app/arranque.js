// ─────────────────────────────────────────────────────────────
// Arranque de la app: monta pestañas, hidrata empresas y abre el Dashboard
// ─────────────────────────────────────────────────────────────
(function(){
  const TABS=[
    {t:'resumen',l:'Resumen',ic:'layout'},
    {t:'graficos',l:'Gráficos',ic:'barchart'},
    {t:'alertas',l:'Análisis',ic:'search'},
    {t:'valoracion',l:'Valoración',ic:'dollar'},
    {t:'academia',l:'Academia',ic:'book'},
    {t:'tesis',l:'Tesis IA',ic:'cpu'},
  ];
  document.getElementById('tabs').innerHTML=TABS.map(t=>`<button class="tab" data-t="${t.t}" onclick="showTab('${t.t}')">${svgIcon(t.ic)}${t.l}</button>`).join('');
  // Iconos de línea en cabecera y navegación
  const _setIc=(id,name)=>{const e=document.getElementById(id);if(e)e.innerHTML=svgIcon(name,'ic-lg');};
  _setIc('brand-ic','activity'); _setIc('nic-dash','briefcase'); _setIc('nic-watch','eye'); _setIc('nic-anly','activity');
  _setIc('aic-add','plus'); _setIc('aic-imp','folder'); _setIc('aic-sync','refresh'); _setIc('aic-restore','refresh'); _setIc('aic-backup','share');
  _paintPrivadoBtn(); document.documentElement.classList.toggle('privado',privado());
  BUILTIN_KEYS=new Set(Object.keys(DB));        // empresas de fábrica
  _BUILTIN_DB={...DB};                            // snapshot para restaurar ocultas
  hydrateImportedIntoDB();                        // recupera empresas añadidas por el usuario (localStorage) tras recargar
  try{HIDDEN=new Set(JSON.parse(localStorage.getItem('vi_hidden')||'[]'));}catch(e){HIDDEN=new Set();}
  HIDDEN.forEach(k=>{delete DB[k];});             // aplica las ocultadas por el usuario
  // Recalcula medianas SOLO para empresas NO importadas; las importadas conservan las de tu hoja (col Q)
  Object.keys(DB).forEach(k=>{ if(!getImportedData(k)) computeMediansFor(DB[k]); });
  rebuildCoButtons();
  resetIS();
  switchCo(DB.MSFT?'MSFT':Object.keys(DB)[0]);
  startPriceRefresh();
  // Abrir siempre en dashboard como pantalla principal
  // ── API KEY FINNHUB — DEBE IR PRIMERO ──
  localStorage.setItem('finnhub_api_key','d82roc1r01qvkevnlkt0d82roc1r01qvkevnlktg');
  // Ocultar banner (key preconfigurada, no necesita input del usuario)
  const apiBanner=document.getElementById('finnhub-key-banner');
  if(apiBanner) apiBanner.style.display='none';
  // Abrir en dashboard o última vista. Diferido a la siguiente vuelta del event loop
  // para que TODAS las variables de módulo (let _cartera*) estén ya inicializadas
  // antes de que setView('cartera') llame a renderCartera (evita un TDZ al recargar).
  // La web SIEMPRE arranca en el Dashboard (página principal), sin recordar la última vista.
  if(typeof populateImportCatalog==='function') populateImportCatalog(); // empresas por nombre en el desplegable
  setTimeout(()=>setView('dash'),0);
  setTimeout(()=>{fetchDashPrices();},400);
  setTimeout(()=>{fetchDashNews();},1400);
})();
