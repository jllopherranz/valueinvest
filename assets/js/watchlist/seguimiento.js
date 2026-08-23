// ─────────────────────────────────────────────────────────────
// Watchlist: pre-análisis, fundamentales y promoción a Análisis
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// SEGUIMIENTO (watchlist) + PRE-ANÁLISIS (Fase 1 — fórmulas)
// ═══════════════════════════════════════════════════════════════════
function getWatchlist(){try{return JSON.parse(localStorage.getItem('vi_watchlist')||'[]');}catch(e){return [];}}
function saveWatchlist(w){localStorage.setItem('vi_watchlist',JSON.stringify(w));}

// Semilla de ejemplo (sólo la primera vez): IREN, para ver el modo "empresa joven"
function _seedWatchlist(){
  if(localStorage.getItem('vi_watchlist')!==null) return;
  saveWatchlist([{
    id:'IREN', name:'IREN Limited', ticker:'IREN', fhTicker:'IREN', young:true,
    sector:'Minería BTC → Data centers de IA',
    pre:{ score:42, verdict:'DUDOSA', color:'#d97706', young:true,
      axes:[
        {label:'Calidad / ROIC',light:'red',  note:'Sólo 1 año en beneficio (FY25). ROIC sin probar.'},
        {label:'Crecimiento',   light:'green',note:'Ingresos +168% FY25; run-rate casi ×5.'},
        {label:'Solidez fin.',  light:'red',  note:'~$5B convertibles · FCF −$316M. Vive de captar capital.'},
        {label:'Márgenes',      light:'amber',note:'EBITDA "ajustado" sano, pero maquilla capex/D&A.'},
        {label:'Valoración',    light:'red',  note:'Sin histórico de múltiplos · P/S ~22-43x · EV/FCF n/a.'},
        {label:'Red flags',     light:'red',  note:'FCF muy negativo · dilución futura · ligado al BTC · historial <4a.'}
      ],
      pros:['Crecimiento brutal y pivote a IA con tracción real (run-rate casi ×5).'],
      cons:['Balance muy apalancado (~$5B convertibles) + FCF −$316M.',
            'No valorable por múltiplos históricos y muy sensible al bitcoin: es una apuesta, no un value clásico.']
    },
    note:'Demo de pre-análisis (modo empresa joven).'
  }]);
}

const _PA_COL={green:'#16a34a',amber:'#d97706',red:'#dc2626',gray:'#cbd5e1'};
const _PA_PTS={green:1,amber:0.5,red:0,gray:0.4};
function _paGrade(v,good,ok,invert){
  if(v==null||isNaN(v)) return 'gray';
  const g=invert?v<=good:v>=good, o=invert?v<=ok:v>=ok;
  return g?'green':o?'amber':'red';
}

// Pre-análisis sobre una empresa de la DB (series de ~10 años)
function computePreAnalysis(co,ck){
  const last=a=>(a&&a.length)?a[a.length-1]:null;
  const mean=a=>(a&&a.length)?a.reduce((s,x)=>s+x,0)/a.length:null;
  const n=co.sales?co.sales.length:0;
  const young=n<6;
  const px=(_priceCache[ck]&&_priceCache[ck].live)||co.price;
  const roicAvg=mean(co.roic);
  const yrs=Math.max(1,n-1);
  const salesCagr=(co.sales&&co.sales[0]>0)?cagr(last(co.sales),co.sales[0],yrs):null;
  const ndE=(last(co.ebitda))?last(co.netDebt)/last(co.ebitda):null;
  let disc=null;
  if(px&&co.fcf&&last(co.fcf)>0&&co.medEvFcf){
    const evfcfCur=(px*co.shares+last(co.netDebt))/last(co.fcf);
    disc=(co.medEvFcf-evfcfCur)/co.medEvFcf*100;
  }
  const a1=_paGrade(roicAvg,15,10), a2=_paGrade(salesCagr,15,8),
        a3=_paGrade(ndE,1,2.5,true), a4=_paGrade(last(co.ebitdaM),25,15),
        a5=_paGrade(disc,0,-25);
  const flags=[];
  const em=co.ebitdaM;
  if(em&&em.length>=3&&em[em.length-1]<em[em.length-2]&&em[em.length-2]<em[em.length-3]) flags.push('Márgenes EBITDA cayendo 3 años.');
  if(co.fcf&&last(co.fcf)<0) flags.push('FCF negativo el último año.');
  const a6=flags.length===0?'green':flags.length===1?'amber':'red';
  const axes=[
    {label:'Calidad / ROIC',light:a1,note:roicAvg!=null?('ROIC medio '+roicAvg.toFixed(0)+'%'):'s/d'},
    {label:'Crecimiento',   light:a2,note:salesCagr!=null?('Ventas CAGR '+salesCagr.toFixed(0)+'%'):'s/d'},
    {label:'Solidez fin.',  light:a3,note:ndE!=null?('ND/EBITDA '+ndE.toFixed(1)+'x'):'s/d'},
    {label:'Márgenes',      light:a4,note:last(co.ebitdaM)!=null?('Mg. EBITDA '+last(co.ebitdaM).toFixed(0)+'%'):'s/d'},
    {label:'Valoración',    light:a5,note:disc!=null?((disc>=0?'−':'+')+Math.abs(disc).toFixed(0)+'% vs mediana hist.'):'s/d'},
    {label:'Red flags',     light:a6,note:flags.length?flags.join(' '):'Sin señales evidentes.'}
  ];
  const W=[22,22,18,13,15,10];
  let score=Math.round(axes.reduce((s,ax,i)=>s+W[i]*_PA_PTS[ax.light],0));
  let verdict,color;
  if(score>=65){verdict='MERECE PROFUNDIZAR';color='#16a34a';}
  else if(score>=45){verdict='DUDOSA';color='#d97706';}
  else{verdict='DESCARTAR';color='#dc2626';}
  if(young&&color==='#16a34a'){verdict='DUDOSA (historial corto)';color='#d97706';}
  const pros=axes.filter(a=>a.light==='green').map(a=>a.label+': '+a.note);
  const cons=axes.filter(a=>a.light==='red').map(a=>a.label+': '+a.note);
  return {score,verdict,color,young,axes,pros,cons};
}

// ── Fase 2: ingesta automática de datos (Finnhub, sin coste ni setup) ──
async function fetchFundamentals(ticker){
  const key=getFinnhubKey(); if(!key) return null;
  const sym=encodeURIComponent(ticker);
  try{
    const [mR,pR]=await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${sym}&metric=all&token=${key}`,{signal:AbortSignal.timeout(9000)}),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${sym}&token=${key}`,{signal:AbortSignal.timeout(9000)})
    ]);
    const mj=await mR.json(), pj=await pR.json();
    const metric=(mj&&mj.metric)?mj.metric:null;
    if(!metric&&!(pj&&pj.name)) return null;
    return {metric:metric||{}, profile:pj||{}};
  }catch(e){return null;}
}

// Pre-análisis a partir de las métricas de Finnhub (empresa que NO está en la DB)
function computePreAnalysisFromMetrics(m,profile){
  m=m||{}; profile=profile||{};
  const num=v=>(v==null||isNaN(v))?null:+v;
  const pick=(...ks)=>{for(const k of ks){const v=num(m[k]); if(v!=null) return v;} return null;};
  let young=false;
  if(profile.ipo){const y=+String(profile.ipo).slice(0,4); if(y&&(new Date().getFullYear()-y)<6) young=true;}
  if(m.epsGrowth5Y==null&&m.revenueGrowth5Y==null) young=true;

  const roi=pick('roiTTM','roicTTM','roeTTM','roaTTM');
  const a1=_paGrade(roi,15,8);
  const gr=pick('revenueGrowth5Y','revenueGrowth3Y','revenueGrowthTTMYoy');
  const a2=_paGrade(gr,15,7);
  const de=pick('totalDebt/totalEquityQuarterly','totalDebt/totalEquityAnnual','longTermDebt/equityQuarterly');
  let a3=_paGrade(de,0.5,1.5,true);
  const cfps=pick('cashFlowPerShareTTM','cashFlowPerShareAnnual');
  if(cfps!=null&&cfps<0&&a3!=='red') a3=(a3==='green')?'amber':'red';
  const om=pick('operatingMarginTTM','netProfitMarginTTM','operatingMarginAnnual');
  const a4=_paGrade(om,18,8);
  const pe=pick('peTTM','peAnnual'), evE=pick('evEbitdaTTM');
  let a5,valNote;
  if(pe!=null&&pe>0){a5=_paGrade(pe,18,30,true);valNote='PER '+pe.toFixed(0)+'x';}
  else if(evE!=null&&evE>0){a5=_paGrade(evE,15,30,true);valNote='EV/EBITDA '+evE.toFixed(0)+'x';}
  else{a5='gray';valNote='s/d';}
  const flags=[];
  if(cfps!=null&&cfps<0) flags.push('Cash flow negativo (quema caja).');
  if(om!=null&&om<0) flags.push('Margen operativo negativo.');
  if(de!=null&&de>2) flags.push('Deuda alta (D/E '+de.toFixed(1)+').');
  if(num(m.netProfitMarginTTM)!=null&&num(m.netProfitMarginTTM)<0) flags.push('Pérdidas netas (TTM).');
  const a6=flags.length===0?'green':flags.length===1?'amber':'red';

  const axes=[
    {label:'Calidad / ROIC',light:a1,note:roi!=null?('ROI '+roi.toFixed(0)+'%'):'s/d'},
    {label:'Crecimiento',   light:a2,note:gr!=null?('Ventas '+(m.revenueGrowth5Y!=null?'CAGR5Y ':'YoY ')+gr.toFixed(0)+'%'):'s/d'},
    {label:'Solidez fin.',  light:a3,note:(de!=null?('D/E '+de.toFixed(1)):'s/d')+(cfps!=null&&cfps<0?' · quema caja':'')},
    {label:'Márgenes',      light:a4,note:om!=null?('Mg. '+(m.operatingMarginTTM!=null?'op. ':'')+om.toFixed(0)+'%'):'s/d'},
    {label:'Valoración',    light:a5,note:valNote},
    {label:'Red flags',     light:a6,note:flags.length?flags.join(' '):'Sin señales evidentes.'}
  ];
  const W=[22,22,18,13,15,10];
  let score=Math.round(axes.reduce((s,ax,i)=>s+W[i]*_PA_PTS[ax.light],0));
  let verdict,color;
  if(score>=65){verdict='MERECE PROFUNDIZAR';color='#16a34a';}
  else if(score>=45){verdict='DUDOSA';color='#d97706';}
  else{verdict='DESCARTAR';color='#dc2626';}
  if(young&&color==='#16a34a'){verdict='DUDOSA (historial corto)';color='#d97706';}
  const pros=axes.filter(a=>a.light==='green').map(a=>a.label+': '+a.note);
  const cons=axes.filter(a=>a.light==='red').map(a=>a.label+': '+a.note);
  return {score,verdict,color,young,axes,pros,cons,source:'finnhub'};
}

// Devuelve el pre-análisis de una entrada de la watchlist con prioridad: DB > métricas Finnhub > cacheado
function watchPre(e){
  if(DB[e.id]) return computePreAnalysis(DB[e.id],e.id);
  if(e.metrics) return computePreAnalysisFromMetrics(e.metrics,e.profile);
  return e.pre||null;
}

// Trae datos en segundo plano para las empresas de la watchlist que aún no los tienen
let _watchFetching=false;
async function _autoFetchWatch(){
  if(_watchFetching||!getFinnhubKey()) return;
  const wl=getWatchlist();
  const todo=wl.filter(e=>!DB[e.id]&&!e.metrics);
  if(!todo.length) return;
  _watchFetching=true; let changed=false;
  for(const e of todo){
    const f=await fetchFundamentals(e.fhTicker||e.ticker||e.id);
    if(f){
      e.metrics=f.metric; e.profile=f.profile;
      if(f.profile&&f.profile.name){
        saveCompanyProfile(e.id,{name:f.profile.name,logo:f.profile.logo||null,web:f.profile.weburl||null,
          domain:_hostOf(f.profile.weburl),industry:f.profile.finnhubIndustry||null,country:f.profile.country||null,
          exchange:f.profile.exchange||null,ipo:f.profile.ipo||null,cur:f.profile.currency||null,
          mcap:f.profile.marketCapitalization||null,shares:f.profile.shareOutstanding||null,ts:Date.now()});
      }
      if(f.profile){
        if(f.profile.name&&(!e.name||e.name===e.id)) e.name=f.profile.name;
        if((!e.sector||e.sector==='')&&f.profile.finnhubIndustry) e.sector=f.profile.finnhubIndustry;
        if(f.profile.ipo){const y=+String(f.profile.ipo).slice(0,4); if(y&&(new Date().getFullYear()-y)<6) e.young=true;}
      }
      changed=true;
    }
  }
  _watchFetching=false;
  if(changed){saveWatchlist(wl); renderWatchlist(); if(getFinnhubKey()) fetchWatchPrices();}
}

async function refreshWatchCompany(id){
  if(DB[id]){renderWatchlist();return;}
  const wl=getWatchlist(), e=wl.find(x=>x.id===id); if(!e) return;
  const f=await fetchFundamentals(e.fhTicker||e.ticker||id);
  if(f){e.metrics=f.metric; e.profile=f.profile;
    if(f.profile&&f.profile.finnhubIndustry&&!e.sector) e.sector=f.profile.finnhubIndustry;
    saveWatchlist(wl); renderWatchlist(); fetchWatchPrices();
  } else alert('No se pudieron traer datos de '+id+'. ¿Es correcto el ticker en Finnhub?');
}
