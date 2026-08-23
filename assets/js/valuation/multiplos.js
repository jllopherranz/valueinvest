// ─────────────────────────────────────────────────────────────
// Medianas históricas, múltiplos objetivo y precios objetivo a 5 años
// ─────────────────────────────────────────────────────────────
// ── MEDIANAS DE MÚLTIPLOS — calculadas como la hoja de cálculo (MEDIANA) ──
// La hoja calcula la mediana estadística de la serie histórica de cada múltiplo.
// Recalculamos aquí desde hEvF/hPER/hEvEbitda/hEvEbit (ignorando años sin dato),
// tanto la mediana de 5 años (últimos 5) como la de 10 años. Sustituye a los valores
// hardcodeados que contenían errores (p.ej. NVDA EV/FCF 10Y 55x → 31x real).
function medianaOf(a){
  if(!Array.isArray(a)) return null;
  const v=a.filter(x=>x!=null&&!isNaN(x)).map(Number).sort((x,y)=>x-y);
  if(!v.length) return null;
  const m=Math.floor(v.length/2);
  const md=v.length%2?v[m]:(v[m-1]+v[m])/2;
  return Math.round(md*10)/10; // 1 decimal, como mostraría la hoja
}
function computeMediansFor(c){
  const set=(suf,arr)=>{
    const v10=medianaOf(arr), v5=medianaOf(Array.isArray(arr)?arr.slice(5):null);
    if(v10!=null) c['med'+suf]=v10;
    if(v5!=null)  c['med5'+suf]=v5;
  };
  set('EvFcf',    c.hEvF);
  set('PER',      c.hPER);
  set('EvEbitda', c.hEvEbitda);
  set('EvEbit',   c.hEvEbit);
}

// ── MÚLTIPLOS OBJETIVO POR EMPRESA ──
// Escenario "Base" = mediana 5Y × 0,82, idéntico al que usa el resumen/veredicto.
// Así, al abrir cualquier empresa, la valoración parte del MISMO escenario que el resumen
// (antes tEVF/tPER eran globales fijos 30/35/22/25 → resumen y valoración no cuadraban).
function baseMultsFor(c){
  const me=(c.medEvEbit||Math.round(c.medEvEbitda*c.ebitdaM[9]/Math.max(c.ebitM[9],1)));
  return {
    evf : Math.round((c.med5EvFcf   ||c.medEvFcf   )*0.82),
    per : Math.round((c.med5PER     ||c.medPER     )*0.82),
    eve : Math.round((c.med5EvEbitda||c.medEvEbitda)*0.82),
    evei: Math.round((c.med5EvEbit  ||me           )*0.82),
  };
}
function applyBaseMults(c){const b=baseMultsFor(c||co);tEVF=b.evf;tPER=b.per;tEVE=b.eve;tEVEI=b.evei;}

// ── MÚLTIPLOS EFECTIVOS POR EMPRESA (fuente única de verdad para TODA la valoración) ──
// Prioridad: 1) lo último que YO he modificado en la app  →  2) los múltiplos ajustados
// de mi hoja importada  →  3) (solo si no hay nada) la mediana 5Y×0,82 de su histórico.
function coKeyOf(c){return Object.keys(DB).find(k=>DB[k]===(c||co))||'';}
function getCompanyMults(key){
  try{const u=JSON.parse(localStorage.getItem('vi_mults_'+key)||'null');
    if(u&&u.evf>0&&u.per>0) return {per:u.per,evf:u.evf,eveb:u.eveb||u.evf,evei:u.evei||u.evf};}catch(e){}
  const imp=getImportedData(key), t=imp&&imp.targetMultiples;
  if(t&&t.evf>0&&t.per>0) return {per:t.per,evf:t.evf,eveb:t.eveb||t.evf,evei:t.evei||t.evf};
  const c=DB[key];
  if(c){const b=baseMultsFor(c);return {per:b.per,evf:b.evf,eveb:b.eve,evei:b.evei};}
  return {per:30,evf:28,eveb:22,evei:26};
}
function saveCompanyMults(key,m){try{localStorage.setItem('vi_mults_'+key,JSON.stringify(m));}catch(e){}}
// Guarda los múltiplos que el usuario tiene puestos ahora (en la vista Análisis) para esta empresa
function _persistMults(){const k=coKeyOf(co);if(k)saveCompanyMults(k,{per:tPER,evf:tEVF,eveb:tEVE,evei:tEVEI});}
// Carga en tEVF/tPER/… los múltiplos efectivos de la empresa (hoja o últimos editados)
function applyCompanyMults(c){const k=coKeyOf(c||co);const m=getCompanyMults(k);tEVF=m.evf;tPER=m.per;tEVE=m.eveb;tEVEI=m.evei;}

// ── PRECIOS OBJETIVO EV/FCF (2026e..2030e) — FUENTE ÚNICA para resumen, valoración y cartera ──
// Prioridad (todo basado en TU plantilla):
//   1) precios objetivo YA calculados en tu hoja importada (idénticos a la plantilla);
//   2) cálculo con las proyecciones del analista (FCF, deuda neta y acciones proyectadas de la hoja)
//      × tu múltiplo objetivo — MISMA base que la cartera;
//   3) último recurso: modelo IS editable.
function evfTargetsFor(arg){
  const k=(typeof arg==='string')?arg:coKeyOf(arg||co);
  const imp=getImportedData(k), d=DB[k], gm=getCompanyMults(k);
  // En la empresa activa, si las proyecciones son 'auto' o editadas → EV/FCF sale del modelo IS (coherente con el resto)
  if(k===coKeyOf(co) && (_projSource==='auto'||_isEdited)){
    return calcISModel().map(m=>Math.round((m.fcf*gm.evf-m.nd)/m.sh));
  }
  let edited=false; try{edited=!!localStorage.getItem('vi_mults_'+k);}catch(e){}
  if(imp && !edited && imp.targetPrices && Array.isArray(imp.targetPrices.evf) && imp.targetPrices.evf.some(v=>v!=null)){
    return imp.targetPrices.evf.map(v=>v!=null?Math.round(v):null);
  }
  const pF=(imp&&imp.pF)||d?.pF, pND=(imp&&imp.pND)||d?.pND, pSh=(imp&&imp.pShares)||d?.pShares;
  const sh0=(imp&&imp.shares)||d?.shares;
  if(pF&&pF.length>=5&&sh0){
    return pF.slice(0,5).map((f,i)=>{ const sh=(pSh&&pSh[i]>0)?pSh[i]:sh0; const nd=pND?.[i]??0; return Math.round((f*gm.evf-nd)/sh); });
  }
  return calcISModel().map(m=>Math.round((m.fcf*gm.evf-m.nd)/m.sh));
}

// ── PRECIOS OBJETIVO PROMEDIO (media de PER · EV/FCF · EV/EBITDA · EV/EBIT) por año ──
// Mismo criterio que la fila "Promedio" de la pestaña Valoración, pero por empresa (para la cartera).
function avgTargetsFor(arg){
  const k=(typeof arg==='string')?arg:coKeyOf(arg||co);
  const imp=getImportedData(k), d=DB[k], gm=getCompanyMults(k);
  // Empresa activa en modo 'auto' o editado → promedio desde el modelo IS (coherente con la pestaña Valoración)
  if(k===coKeyOf(co) && (_projSource==='auto'||_isEdited)){
    const er=(d&&d.ebitda&&d.ebitda[9]>0)?(d.ebit[9]/d.ebitda[9]):0.85;
    return calcISModel().map(m=>{
      const vals=[m.eps>0?m.eps*gm.per:null,(m.fcf*gm.evf-m.nd)/m.sh,(m.eb*gm.eveb-m.nd)/m.sh,(m.ebit*gm.evei-m.nd)/m.sh].filter(v=>v!=null&&isFinite(v)&&v>0);
      return vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length):null;
    });
  }
  let edited=false; try{edited=!!localStorage.getItem('vi_mults_'+k);}catch(e){}
  // 1) Si la hoja trae precios objetivo (y no has editado múltiplos):
  if(imp && !edited && imp.targetPrices){
    const tp=imp.targetPrices;
    // 1a) usar la fila "Promedio" de TU hoja si existe → idéntico a tu Excel
    if(Array.isArray(tp.avg) && tp.avg.some(v=>v!=null)) return tp.avg.map(v=>v!=null?Math.round(v):null);
    // 1b) si no, promediar los métodos por año
    const rows=['per','evf','eveb','evei'].map(m=>tp[m]).filter(a=>Array.isArray(a)&&a.some(v=>v!=null));
    if(rows.length>=2){
      return [0,1,2,3,4].map(i=>{const vals=rows.map(a=>a[i]).filter(v=>v!=null&&isFinite(v));return vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length):null;});
    }
  }
  // 2) Calcular desde proyecciones × tus múltiplos (PER·EV/FCF·EV/EBITDA·EV/EBIT) y promediar
  const pEB=(imp&&imp.pEB)||d?.pEB, pEPS=(imp&&imp.pEPS)||d?.pEPS, pND=(imp&&imp.pND)||d?.pND, pSh=(imp&&imp.pShares)||d?.pShares;
  const sh0=(imp&&imp.shares)||d?.shares;
  const ebitRatio=(d&&d.ebitda&&d.ebitda[9]>0)?(d.ebit[9]/d.ebitda[9]):0.85;
  const evf=evfTargetsFor(k);
  if(pEPS&&pEB&&sh0){
    return [0,1,2,3,4].map(i=>{
      const sh=(pSh&&pSh[i]>0)?pSh[i]:sh0, nd=pND?.[i]??0;
      const per=(pEPS[i]!=null)?pEPS[i]*gm.per:null;
      const eveb=(pEB[i]!=null)?(pEB[i]*gm.eveb-nd)/sh:null;
      const evei=(pEB[i]!=null)?(pEB[i]*ebitRatio*gm.evei-nd)/sh:null;
      const vals=[per,evf?.[i],eveb,evei].filter(v=>v!=null&&isFinite(v));
      return vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length):null;
    });
  }
  return evf; // último recurso: solo EV/FCF
}
