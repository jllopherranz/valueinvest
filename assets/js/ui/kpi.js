// ─────────────────────────────────────────────────────────────
// Acordeón de KPIs y popups educativos
// ─────────────────────────────────────────────────────────────
// KPI accordion config
const KPI_ACCORDION={
  ventas:{icon:'📦',label:'Ventas 2025',color:'#2563eb',
    def:'Total de ingresos cobrados a clientes. Primera línea del P&L.',
    analysis:(c)=>{const g=pct(c.sales[9],c.sales[8]);return`En 2025, ${c.name} generó ${curSymG()}${N(c.sales[9])}M en ventas (${g>0?'+':''}${g.toFixed(1)}% vs 2024). CAGR 10Y: ${P(cagr(c.sales[9],c.sales[0],9))}.`;},
    benchFn:(c)=>{const v=cagr(c.sales[9],c.sales[8],1);return{value:v,sector:15,label:'CAGR YoY',unit:'%'};},tipId:'ventas'},
  ebitda:{icon:'💼',label:'EBITDA 2025',color:'#b45309',
    def:'Beneficio antes de intereses, impuestos, amortización y depreciación.',
    analysis:(c)=>{const g=pct(c.ebitda[9],c.ebitda[8]);return`EBITDA ${curSymG()}${N(c.ebitda[9])}M, margen ${P(c.ebitdaM[9])} (${g>0?'+':''}${g.toFixed(1)}% vs 2024). Sector: ${P(c.sectorAvgEbitdaM)}.`;},
    benchFn:(c)=>{return{value:c.ebitdaM[9],sector:c.sectorAvgEbitdaM,label:'Margen EBITDA',unit:'%'};},tipId:'ebitda'},
  fcf:{icon:'💵',label:'FCF 2025',color:'#16a34a',
    def:'"Los beneficios son opinión, el cash es realidad." — Buffett.',
    analysis:(c)=>{const g=pct(c.fcf[9],c.fcf[8]);return`FCF ${curSymG()}${N(c.fcf[9])}M (margen ${P(c.fcfM[9])}), ${g>0?'+':''}${g.toFixed(1)}% vs 2024. CAGR 10Y: ${P(cagr(c.fcf[9],c.fcf[0],9))}.`;},
    benchFn:(c)=>{return{value:c.fcfM[9],sector:c.sectorAvgFcfM,label:'Margen FCF',unit:'%'};},tipId:'fcf'},
  roic:{icon:'🎯',label:'ROIC 2025',color:'#b45309',
    def:'Retorno sobre capital invertido. ROIC > WACC = crea valor.',
    analysis:(c)=>{const vs=c.roic[9]-c.wacc;return`ROIC ${P(c.roic[9])} vs WACC ~${c.wacc}% → spread +${vs.toFixed(1)}pp. Era ${P(c.roic[0])} en 2016.`;},
    benchFn:(c)=>{return{value:c.roic[9],sector:c.sectorAvgROIC,label:'ROIC vs sector',unit:'%'};},tipId:'roic'},
  eps:{icon:'📈',label:'EPS 2025',color:'#d97706',
    def:'Beneficio por acción. Validar siempre con FCF/acción.',
    analysis:(c)=>{const g=pct(c.eps[9],c.eps[8]);return`EPS ${curSymG()}${N(c.eps[9],2)} (${g>0?'+':''}${g.toFixed(1)}% vs 2024). FCF/acción ${curSymG()}${N(c.fcfps[9],2)}.`;},
    benchFn:(c)=>{const g=cagr(c.eps[9],c.eps[0],9);return{value:g,sector:12,label:'CAGR EPS 10Y',unit:'%'};},tipId:'eps'},
  netDebt:{icon:'🏦',label:'Deuda/EBITDA',color:'#dc2626',
    def:'Negativo = posición de caja neta — "fortín financiero".',
    analysis:(c)=>{const dd=(c.netDebt[9]/c.ebitda[9]);return`Deuda/EBITDA ${dd.toFixed(1)}x. ${c.netDebt[9]<0?'CAJA NETA de '+curSymG()+N(Math.abs(c.netDebt[9]))+'M.':'Deuda '+curSymG()+N(c.netDebt[9])+'M.'}`;},
    benchFn:(c)=>{const dd=(c.netDebt[9]/c.ebitda[9]);return{value:dd,sector:1.5,label:'vs sector 1.5x',unit:'x',inverted:true};},tipId:'netDebt'},
  evfcf:{icon:'🏆',label:'EV/FCF actual',color:'#7c3aed',
    def:'El múltiplo rey para empresas de calidad. Difícil de manipular.',
    analysis:(c)=>{const evfcf=Math.round((price*c.shares+c.netDebt[9])/c.fcf[9]);const d=((evfcf-c.medEvFcf)/c.medEvFcf*100);return`EV/FCF ${evfcf}x vs mediana ${c.medEvFcf}x. ${d<0?'Descuento del '+Math.abs(d).toFixed(0)+'%.':'Prima del '+d.toFixed(0)+'%.'}`;},
    benchFn:(c)=>{const evfcf=Math.round((price*c.shares+c.netDebt[9])/c.fcf[9]);return{value:evfcf,sector:c.medEvFcf,label:'vs med. histórica',unit:'x',inverted:true};},tipId:'evfcf'},
  mktcap:{icon:'🏢',label:'Market Cap',color:co.color,
    def:'Precio × acciones. Lo que el mercado cree que vale la empresa hoy.',
    analysis:(c)=>{const cs=curSymOf(coKeyOf(co));return`Capitalización ${fmtMC(price*c.shares)} al precio ${cs}${N(price,2)}.`;},
    benchFn:null,tipId:null},
};

function kpiAccordion(key,subVal,subLabel){
  const cfg=KPI_ACCORDION[key],k=key;
  const analysisText=cfg.analysis(co);
  let benchHtml='';
  if(cfg.benchFn){
    const b=cfg.benchFn(co);
    const isGood=b.inverted?(b.value<=b.sector):(b.value>=b.sector);
    const diff=b.value-b.sector;
    benchHtml=`<div style="margin-top:6px;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:4px;">Benchmark vs Sector</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:6px;background:#f0ede8;border-radius:3px;overflow:hidden;"><div style="width:${Math.min(100,Math.abs(b.value/Math.max(b.sector,b.value)*100))}%;height:100%;background:${isGood?'#16a34a':'#dc2626'};border-radius:3px;"></div></div>
        <span style="font-size:11px;font-weight:700;color:${isGood?'#16a34a':'#dc2626'};">${b.unit==='x'?b.value.toFixed(1)+'x':b.value.toFixed(1)+'%'} ${isGood?'✓':'▼'}</span>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:3px;">${b.label}: Sector ~${b.unit==='x'?b.sector+'x':b.sector+'%'} | Diferencia: ${diff>=0?'+':''}${b.unit==='x'?diff.toFixed(1)+'x':diff.toFixed(1)+'%'}</div>
    </div>`;
  }
  return`<div class="kpi" id="kpi-${key}" onclick="toggleKpi('${key}')">
    <div class="kpi-main">
      <div class="klbl" style="cursor:pointer;">${cfg.icon} ${cfg.label} <span class="kpi-expand-arrow">▾</span></div>
      <div class="kval" style="color:${cfg.color}">${subVal}</div>
      <div class="ksub">${subLabel}</div>
    </div>
    <div class="kpi-expand" id="kpi-expand-${key}">
      <div class="kpi-def" style="color:var(--sub);">${cfg.def}</div>
      <div class="kpi-analysis" style="background:${cfg.color}10;border-left:3px solid ${cfg.color};">${analysisText}</div>
      ${benchHtml}
    </div>
  </div>`;
}
function toggleKpi(key){
  const el=document.getElementById(`kpi-expand-${key}`),kpi=document.getElementById(`kpi-${key}`);
  if(!el||!kpi) return;
  const open=el.classList.contains('open');
  document.querySelectorAll('.kpi-expand.open').forEach(e=>e.classList.remove('open'));
  document.querySelectorAll('.kpi.expanded').forEach(e=>e.classList.remove('expanded'));
  if(!open){el.classList.add('open');kpi.classList.add('expanded');}
}
// KPI data store for popup
const _kpiPopupData={};
function regKpi2(key,data){_kpiPopupData[key]=data;}
// Abre la formación EN CONTEXTO de cada métrica (qué es + fórmula + situación de la empresa + rangos + quién la usa)
const KPI_TIP={sales:'ventas',fcf:'fcf',ebitda:'ebitda',eps:'eps',roic:'roic',evfcf:'evfcf',netDebt:'netDebt'};
function kpiEdu(key,event){
  if(event&&event.stopPropagation) event.stopPropagation();
  const tipKey=KPI_TIP[key]||key;
  const el=document.getElementById('kpi2-'+key)||(event&&(event.currentTarget||event.target));
  const extra=(_kpiPopupData[key]||{}).detail;
  if(typeof showTip==='function') showTip(tipKey,el,extra);
}
function toggleKpi2(key,event){
  const popup=document.getElementById('kpi-popup');
  const overlay=document.getElementById('kpi-popup-overlay');
  const d=_kpiPopupData[key];
  if(!popup||!d) return;
  // Already open same key → close
  if(popup.classList.contains('visible')&&popup.dataset.key===key){closeKpiPopup();return;}
  // Fill popup
  document.getElementById('kpp-icon').textContent=d.icon||'📊';
  document.getElementById('kpp-title').textContent=d.lbl;
  const tag=document.getElementById('kpp-tag');
  tag.textContent=d.key.toUpperCase();
  tag.style.cssText=`background:${d.c}18;color:${d.c};`;
  document.getElementById('kpp-val').textContent=d.val;
  document.getElementById('kpp-val').style.color=d.c;
  document.getElementById('kpp-sub').textContent=d.sub||'';
  document.getElementById('kpp-detail').textContent=d.detail||'';
  // History
  if(d.hist&&d.hist.length){
    const histEl=document.getElementById('kpp-hist');
    const histYears=co.years.slice(-5);
    histEl.innerHTML=d.hist.map((v,i)=>`<div class="kpi-popup-hist-item"><div class="kpi-popup-hist-yr">${histYears[i]||''}</div><div class="kpi-popup-hist-val" style="color:${d.c};">${v}</div></div>`).join('');
    document.getElementById('kpp-hist-row').style.display='block';
  }else{document.getElementById('kpp-hist-row').style.display='none';}
  // Estimates
  if(d.est&&d.est.length){
    const estEl=document.getElementById('kpp-est');
    estEl.innerHTML=d.est.map((v,i)=>`<div class="kpi-popup-hist-item"><div class="kpi-popup-hist-yr">${co.pY[i]||''}E</div><div class="kpi-popup-hist-val" style="color:${d.c};">${v}</div></div>`).join('');
    document.getElementById('kpp-est-row').style.display='block';
  }else{document.getElementById('kpp-est-row').style.display='none';}
  popup.dataset.key=key;
  // Position near clicked element
  const el=document.getElementById('kpi2-'+key);
  if(el){
    const rect=el.getBoundingClientRect();
    let top=rect.bottom+8;let left=rect.left;
    if(top+350>window.innerHeight) top=rect.top-360;
    if(left+300>window.innerWidth) left=window.innerWidth-308;
    if(left<8) left=8;
    popup.style.top=Math.max(8,top)+'px';popup.style.left=left+'px';
  }
  popup.classList.add('visible');
  overlay.classList.add('visible');
  // Highlight active KPI
  document.querySelectorAll('.kpi2').forEach(k=>k.classList.remove('kpi2-active'));
  document.getElementById('kpi2-'+key)?.classList.add('kpi2-active');
}
function closeKpiPopup(){
  document.getElementById('kpi-popup')?.classList.remove('visible');
  document.getElementById('kpi-popup-overlay')?.classList.remove('visible');
  document.querySelectorAll('.kpi2').forEach(k=>k.classList.remove('kpi2-active'));
}
