// ─────────────────────────────────────────────────────────────
// setView(): Dashboard / Seguimiento / Análisis + refresco del dashboard
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// DASHBOARD — funciones
// ═══════════════════════════════════════════════════════════════════

// Auto-refresco de precios del dashboard (mercado + cartera) cada 90s mientras estás en esa vista
let _dashInterval=null;
function startDashRefresh(){
  if(_dashInterval) clearInterval(_dashInterval);
  _dashInterval=setInterval(()=>{
    if((localStorage.getItem('vi_view')||'dash')!=='dash'){clearInterval(_dashInterval);_dashInterval=null;return;}
    fetchCarteraPrices(); fetchDashPrices();
    if(Date.now()-_dashNewsTs>20*60000) fetchDashNews();   // noticias frescas cada ~20 min
  },90000);
}

// ── Navegación entre vistas ──
function setView(v){
  if(v==='analysis') precargarChart();   // el usuario va a ver gráficos: pídelos ya, en paralelo
  if(v==='cartera') v='dash'; // Cartera fusionada en el Dashboard
  _curView=(v==='dash'||v==='watch')?v:'analysis';
  if(v!=='analysis'){const _dd=document.getElementById('co-dropdown');if(_dd)_dd.style.display='none';}
  const dash=document.getElementById('view-dash');
  const cartera=document.getElementById('view-cartera');
  const watch=document.getElementById('view-watch');
  const cnt=document.getElementById('cnt');
  const tabs=document.getElementById('tabs');
  const coBtns=document.getElementById('co-btns');
  const btnD=document.getElementById('nav-dash');
  const btnC=document.getElementById('nav-cartera');
  const btnW=document.getElementById('nav-watch');
  const btnA=document.getElementById('nav-analysis');
  const hdrAnalysis=document.getElementById('hdr-analysis-zone');
  const _navIdle=b=>{if(b)b.classList.remove('active');}, _navOn=b=>{if(b)b.classList.add('active');};

  // hide all panels first
  dash.style.display='none';
  if(cartera) cartera.style.display='none';
  if(watch) watch.style.display='none';
  cnt.style.display='none';
  if(tabs) tabs.style.display='none';
  if(coBtns) coBtns.style.display='none';
  if(hdrAnalysis) hdrAnalysis.style.display='none';
  // 'co-quickinfo' = « · $483 · Cap 3,5 B » — solo tiene sentido dentro del análisis de UNA empresa,
  // en Cartera/Seguimiento confunde (no corresponde a lo que se está viendo) → oculto.
  ['co-info','co-name','co-quickinfo'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  const coLogoWrap=document.getElementById('co-logo-wrap');if(coLogoWrap)coLogoWrap.style.display='none';
  const hdrPG=document.getElementById('hdr-price-group');if(hdrPG) hdrPG.style.display='none';
  _navIdle(btnD);_navIdle(btnC);_navIdle(btnW);_navIdle(btnA);
  // Ticker de mercado (Bitcoin, S&P 500, Euríbor…): solo en Cartera/Seguimiento, no dentro del análisis
  const _mktBar=document.getElementById('dash-mkt-bar'); if(_mktBar) _mktBar.style.display=(v==='analysis')?'none':'';

  if(v==='watch'){
    if(watch) watch.style.display='block';
    _navOn(btnW);
    localStorage.setItem('vi_view','watch');
    renderWatchlist();
    if(getFinnhubKey()) setTimeout(()=>fetchWatchPrices(),250);
    document.getElementById('earnings-badge')?.classList.remove('visible');
  } else if(v==='cartera'){
    if(cartera) cartera.style.display='block';
    _navOn(btnC);
    localStorage.setItem('vi_view','cartera');
    renderCartera();
    if(getFinnhubKey()) setTimeout(()=>fetchCarteraPrices(),300);
  } else if(v==='dash'){
    dash.style.display='block';
    _navOn(btnD);
    localStorage.setItem('vi_view','dash');
    renderDashboard();
    renderCartera();                              // tabla rica de la cartera (fusionada)
    // Fichas públicas que falten (logo, sector, bolsa) — se guardan y no se vuelven a pedir
    ensureProfiles().then(ok=>{ if(ok&&_curView==='dash') renderCartera(); });
    // Tipos de cambio y S&P 500: hacen falta para los totales y la comparación con el índice
    Promise.allSettled([fetchFX(),_loadSPHistory()]).then(()=>{ if(_curView==='dash') renderCartera(); });
    setTimeout(()=>fetchCarteraPrices(),250);     // precios en vivo de la tabla rica
    setTimeout(()=>fetchDashPrices(),200);         // barra de mercado (Yahoo, no necesita Finnhub)
    if(_dashAllNews.length===0) setTimeout(()=>fetchDashNews(),1000);
    startDashRefresh();                            // auto-refresco periódico de precios
    document.getElementById('earnings-badge')?.classList.remove('visible'); // resultados NO en el dashboard
  } else {
    cnt.style.display='block';
    if(tabs) tabs.style.display='flex';
    if(coBtns) coBtns.style.display='';
    if(hdrAnalysis) hdrAnalysis.style.display='';
    ['co-info','co-name','co-quickinfo'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='';});
    if(coLogoWrap) coLogoWrap.style.display='flex';
    if(hdrPG) hdrPG.style.display='';
    _navOn(btnA);
    localStorage.setItem('vi_view','analysis');
    updateEarningsBadge();                          // resultados de la empresa actual
    if(!document.querySelector('.tab.active')) showTab('resumen');
  }
}

// ── Finnhub key helpers ──
function saveFinnhubKey(){
  const k=document.getElementById('fh-key-inp')?.value?.trim();
  if(!k) return;
  localStorage.setItem('finnhub_api_key',k);
  document.getElementById('finnhub-key-banner').style.display='none';
  alert('✅ API key guardada. Los precios se actualizarán automáticamente.');
  fetchDashPrices();
  fetchLivePrice();
}
