// ─────────────────────────────────────────────────────────────
// Cambio de empresa activa y menú desplegable de empresas
// ─────────────────────────────────────────────────────────────
// ── COMPANY SWITCH ──
function switchCo(k){
  co=DB[k];price=_lastKnownPrice(k)||co.price;simPrice=null;simMode=false;_livePrice=null;_priceLive=false;_projSource='sheet';_projManual=false;
  document.getElementById('price-inp').value=price;
  document.getElementById('price-change').textContent='';
  const b=_getLiveBadge();if(b)b.classList.remove('visible');
  document.getElementById('co-name-txt').textContent=co.name;
  if(!co.sector){const _s=sectorOf(k); if(_s) co.sector=_s;}
  document.getElementById('co-info').textContent=co.ticker+(co.sector?' · '+co.sector:'');
  setLogo(co);
  // Solo los botones de EMPRESA (dentro de #co-btns). Antes recorría todos los .co-btn y
  // pisaba con estilos en línea los de navegación y los de la derecha (Privado, Noche),
  // que se quedaban con el texto blanco sobre fondo transparente = invisibles.
  document.querySelectorAll('#co-btns .co-btn').forEach(btn=>{
    const act=btn.dataset.k===k;
    btn.classList.toggle('active',act);
    btn.style.background=act?co.color:'transparent';
    btn.style.borderColor=act?co.color:'';
    btn.style.color=act?'#fff':'';
  });
  resetIS();applyCompanyMults(co);updateEarningsBadge();fetchEarningsDate();fetchLivePrice();showTab(curTab);recalc();
  // Ficha pública (logo, sector, bolsa, web): si falta, se trae y se repinta el resumen
  if(!companyProfile(k)){
    fetchCompanyProfile(k).then(pr=>{
      if(!pr||coKeyOf(co)!==k) return;
      setLogo(co);
      if(!co.sector&&pr.industry) co.sector=industriaES(pr.industry);
      document.getElementById('co-info').textContent=co.ticker+(co.sector?' · '+co.sector:'');
      if(curTab==='resumen') showTab('resumen');
    });
  }
  if(isEstimatedCo(co)) _preferFMPIfAvailable(k);   // empresa sin Excel: preferir consenso FMP si existe
  const _dd=document.getElementById('co-dropdown'); if(_dd) _dd.style.display='none'; // cerrar desplegable al elegir empresa
}

// Abre/cierra el desplegable de empresas al pulsar "Análisis"
function toggleAnalysisMenu(ev){
  if(ev) ev.stopPropagation();
  setView('analysis');
  const d=document.getElementById('co-dropdown');
  if(d) d.style.display = (d.style.display==='block')?'none':'block';
}
// Cerrar el desplegable al hacer clic fuera
document.addEventListener('click',e=>{
  const d=document.getElementById('co-dropdown');
  if(d&&d.style.display==='block'&&!d.contains(e.target)&&e.target.id!=='nav-analysis') d.style.display='none';
});
