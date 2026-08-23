// ─────────────────────────────────────────────────────────────
// Estado de la cartera, empresas importadas y métricas agregadas
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// CARTERA — Portfolio view + Excel import
// ═══════════════════════════════════════════════════════════════════

let _carteraPrices={};
let _cartTotal=0;          // valor total de las posiciones (divisa base) — base de los pesos
let _carteraMultiples={per:30,evf:28,eveb:22,evei:26};
let _carteraMultiplesReady=false;
let _importedFile=null;

// ── Storage helpers ──
function getImportedData(ticker){
  try{return JSON.parse(localStorage.getItem('vi_import_'+ticker)||'null');}
  catch(e){return null;}
}

function getAllPortfolioCompanies(){
  const base=DASH_COMPANIES.filter(c=>!HIDDEN.has(c.key)); // excluir empresas ocultadas
  const keys=new Set(base.map(c=>c.key));
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!k.startsWith('vi_import_')) continue;
    const ticker=k.replace('vi_import_','');
    if(keys.has(ticker)) continue;
    const d=getImportedData(ticker);
    if(!d) continue;
    const _cat=catalogFor(ticker);
    base.push({key:ticker,name:d.name||ticker,ticker:d.ticker||ticker,
      fhTicker:d.ticker||ticker,color:(d.color&&d.color!=='#1e3a5f')?d.color:((_cat&&_cat.color)||d.color||'#1e3a5f'),
      score:null,verdict:null,vc:null,earnings:null,elbl:null,drive:d.driveUrl||null,isNew:true});
    keys.add(ticker);
  }
  return base.sort((a,b)=>(a.name||a.key).localeCompare(b.name||b.key,'es')); // orden alfabético
}

// ── Intrinsic value calculation ──
function calcPortfolioVI(key,imp,idx){
  const i=idx??1; // default 2027 = index 1
  const d=DB[key];
  const pF=(imp&&imp.pF)||d?.pF;
  const pEPS=(imp&&imp.pEPS)||d?.pEPS;
  const pEB=(imp&&imp.pEB)||d?.pEB;
  const pND=(imp&&imp.pND)||d?.pND;
  const shBase=(imp&&imp.shares)||d?.shares;
  if(!pF||!pEPS||!pEB||pF.length<=i||!shBase) return null;
  const pSh=(imp&&imp.pShares)||d?.pShares;       // acciones proyectadas (como la hoja)
  const sh=(pSh&&pSh[i]>0)?pSh[i]:shBase;
  const nd=pND?.[i]??0;
  const m=getCompanyMults(key); // múltiplos efectivos de la empresa (hoja / últimos editados / histórico)
  const evf=(pF[i]*m.evf-nd)/sh;
  const per=pEPS[i]*m.per;
  const eveb=(pEB[i]*m.eveb-nd)/sh;
  const evei=(pEB[i]*m.evei-nd)/sh;
  const avg=(evf+per+eveb+evei)/4;
  return{avg,evf,per,eveb,evei};
}

// ── Métricas por empresa (precio live, semanal, entrada 15%, obj 5Y, retorno, PEG) ──
function carteraMetrics(co){
  const key=co.key, imp=getImportedData(key), d=DB[key];
  const pe=_carteraPrices[key];
  const price=(pe&&typeof pe==='object'?pe.c:pe)||imp?.price||d?.price||null;
  const dailyPct=(pe&&typeof pe==='object')?(pe.dp??null):null;
  const weeklyPct=(pe&&typeof pe==='object')?(pe.wp??null):null;
  // Precio objetivo a 2030e por EV/FCF (método de referencia, igual que tu hoja).
  // Si la empresa está importada y NO has tocado los múltiplos a mano, usamos el precio
  // YA calculado en tu hoja (targetPrices) → coincide exactamente (acciones proyectadas, etc.).
  // Obj 5Y por EV/FCF = misma fuente única que el resumen y la valoración (tu hoja / proyecciones analista × tu múltiplo)
  // Precio objetivo = PROMEDIO de los 4 múltiplos (PER·EV/FCF·EV/EBITDA·EV/EBIT), no solo EV/FCF.
  const _avgT=avgTargetsFor(key);
  const _evfT=evfTargetsFor(key);
  const objEVF=(_avgT&&_avgT[0]!=null)?_avgT[0]:(_evfT&&_evfT[0]!=null?_evfT[0]:null);  // objetivo próx. año (promedio)
  const mds=(objEVF&&price)?(objEVF-price)/price*100:null;
  const obj5=(_avgT&&_avgT[4]!=null)?_avgT[4]:(_evfT&&_evfT[4]!=null?_evfT[4]:null);    // objetivo 5Y (promedio)
  const objEVF_evf=(_evfT&&_evfT[0]!=null)?_evfT[0]:null;  // referencia EV/FCF (por si se quiere mostrar)
  const cagr5=(obj5&&price)?(Math.pow(Math.max(obj5,.01)/Math.max(price,.01),0.2)-1)*100:null;
  const price15=obj5!=null?obj5/Math.pow(1.15,5):null;   // precio máx. hoy para +15% anual a 5 años (promedio)
  // PEG = PER actual / crecimiento esperado (%)
  const eps9=(imp?.eps&&imp.eps.filter(x=>x!=null).slice(-1)[0])||d?.eps?.[9]||null;
  const pEPS=(imp?.pEPS)||d?.pEPS;
  const fcf9=(imp?.fcf&&imp.fcf.filter(x=>x!=null).slice(-1)[0])||d?.fcf?.[9]||null;
  const pF=(imp?.pF)||d?.pF;
  let per=null,g=null;
  if(price&&eps9>0) per=price/eps9;
  if(pEPS&&pEPS[4]>0&&eps9>0) g=(Math.pow(pEPS[4]/eps9,0.2)-1)*100;          // EPS fwd 5Y
  else if(pF&&pF[4]>0&&fcf9>0) g=(Math.pow(pF[4]/fcf9,0.2)-1)*100;            // FCF fwd 5Y
  else if(d?.eps&&d.eps[0]>0&&d.eps[9]>0) g=(Math.pow(d.eps[9]/d.eps[0],1/9)-1)*100; // EPS hist
  const peg=(per!=null&&g&&g>0)?per/g:null;
  const mds15=(price15!=null&&price>0)?(price15-price)/price*100:null; // margen del precio actual hasta el precio de entrada 15%

  // ── Escenario prudente: mismo objetivo con múltiplos un 20% por debajo ──
  // (el múltiplo es la parte más frágil de cualquier valoración: si se contrae, ¿aún gano?)
  const objCons=objEVF!=null?objEVF*0.8:null;
  const mdsCons=(objCons!=null&&price>0)?(objCons-price)/price*100:null;
  const obj5Cons=obj5!=null?obj5*0.8:null;
  const cagr5Cons=(obj5Cons&&price)?(Math.pow(Math.max(obj5Cons,.01)/Math.max(price,.01),0.2)-1)*100:null;

  // ── Mi posición (divisa de la empresa → divisa base de la cartera) ──
  const cur=curOf(key);
  // ¿Precio y objetivo en la misma moneda y escala? El objetivo sale de TUS cuentas; si el
  // precio viene de otra bolsa (o de un ADR, que equivale a varias acciones) no son comparables
  // y el margen de seguridad no significa nada.
  const escala=(objEVF>0&&price>0)?price/objEVF:null;
  const escalaMal=escala!=null&&(escala>4||escala<0.25);
  const curDet=!!detectedCur(key);          // confirmada por Yahoo vs deducida del sufijo
  const yfSym=yfSymbolForKey(key);
  const pos=getPositionFor(key);
  const shares=(pos&&pos.shares>0)?pos.shares:null;
  const buyPrice=(pos&&pos.buyPrice>0)?pos.buyPrice:null;
  const retPct=(buyPrice&&price!=null)?((price-buyPrice)/buyPrice*100):null;
  const fxOk=fxRate(cur)!=null;                                         // ¿sabemos convertir su divisa?
  const mktValue=(shares&&price!=null)?toBase(shares*price,cur):null;   // valor de mercado hoy
  const costValue=(shares&&buyPrice)?toBase(shares*buyPrice,cur):null;  // lo que te costó
  const pnl=(mktValue!=null&&costValue!=null)?mktValue-costValue:null;

  // ── Calidad del negocio (lo primero que mira un value: el negocio, no el precio) ──
  const roicArr=(imp?.roic&&imp.roic.some(v=>v!=null))?imp.roic:d?.roic;
  const roic5=(()=>{const a=(roicArr||[]).filter(v=>v!=null&&isFinite(v)).slice(-5);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;})();
  const fcfMArr=(imp?.fcfM&&imp.fcfM.some(v=>v!=null))?imp.fcfM:d?.fcfM;
  const fcfM=(fcfMArr||[]).filter(v=>v!=null).slice(-1)[0]??null;
  const ebitdaArr=(imp?.ebitda)||d?.ebitda;
  const ndArr=(imp?.netDebt)||d?.netDebt;
  const ebitda9=(ebitdaArr||[]).filter(v=>v!=null).slice(-1)[0]??null;
  const nd9=(ndArr||[]).filter(v=>v!=null).slice(-1)[0]??null;
  const ndEbitda=(ebitda9>0&&nd9!=null)?nd9/ebitda9:null;
  const salesArr=(imp?.sales)||d?.sales;
  const salesG5=(()=>{const a=(salesArr||[]).filter(v=>v!=null&&v>0);
    if(a.length<6) return null;
    const last=a[a.length-1],prev=a[a.length-6];
    return prev>0?(Math.pow(last/prev,1/5)-1)*100:null;})();

  // ── Procedencia del dato (¿sale de tu Excel o está estimado?) ──
  const origen=imp?'excel':(d&&d.estimated?'estimado':'app');
  const impAge=(imp&&imp.importDate)?Math.floor((Date.now()-new Date(imp.importDate))/86400000):null;

  return {key,imp,d,price,dailyPct,weeklyPct,objEVF,mds,obj5,cagr5,price15,mds15,per,g,peg,
          objCons,mdsCons,obj5Cons,cagr5Cons,
          cur,curDet,yfSym,escala,escalaMal,fxOk,pos,shares,buyPrice,retPct,mktValue,costValue,pnl,
          roic5,fcfM,ndEbitda,salesG5,origen,impAge};
}
function pegColor(peg){return peg==null?'#9a958e':peg<1?'#16a34a':peg<=2?'#eab308':'#dc2626';}
function pegBar(peg,per,g){
  if(peg==null) return '<span style="color:#9a958e;font-size:11px;" title="Sin BPA o crecimiento ≤ 0">—</span>';
  const col=pegColor(peg), pos=Math.min(100,Math.max(2,peg/2*100)); // PEG 1→50%, 2→100%
  const tip=(per!=null&&g!=null)?`PEG = PER ${per.toFixed(1)} ÷ crec. BPA 5Y ${g.toFixed(1)}% = ${peg.toFixed(2)}  ·  <1 barato · 1-2 razonable · >2 caro`:`PEG ${peg.toFixed(2)}`;
  return `<div title="${tip}" style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:help;">
    <span style="font-size:12px;font-weight:600;color:${col};">${peg.toFixed(2)}</span>
    <div style="width:56px;height:6px;border-radius:3px;background:linear-gradient(90deg,#16a34a,#eab308 50%,#dc2626);position:relative;">
      <div style="position:absolute;top:-2px;left:calc(${pos}% - 1.5px);width:3px;height:10px;background:#1a1814;border-radius:1px;box-shadow:0 0 0 1px #fff;"></div>
    </div></div>`;
}

// ── Comparador Growth vs Value de la cartera (cuadrante + tabla) ──
function renderStyleCompare(){
  const el=document.getElementById('dash-style-compare'); if(!el) return;
  const rows=getAllPortfolioCompanies().map(s=>{
    const c=DB[s.key]; if(!c||!c.sales||!c.fcf) return null;
    const px=(_carteraPrices[s.key]&&_carteraPrices[s.key].c)||c.price;
    let st; try{ st=computeStyleFor(c,px); }catch(e){ return null; }
    return {s,st,px};
  }).filter(Boolean);
  if(!rows.length){ el.innerHTML=''; return; }
  // ── Cuadrante: X = valoración (← caro · barato →), Y = crecimiento (↑) ──
  const dots=rows.map(r=>{
    const x=Math.max(4,Math.min(96,r.st.valueScore));      // 0 caro → 100 barato
    const y=Math.max(4,Math.min(96,100-r.st.growthScore)); // arriba = más crecimiento
    const logo=logoUrlFor(r.s.key);
    return `<div title="${r.s.name} — ${r.st.style} · Crec. ${r.st.growth}% · EV/FCF ${r.st.evfcfCur}x" style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;cursor:pointer;z-index:2;" onclick="setView('analysis');setTimeout(()=>switchCo('${r.s.key}'),50)">
      ${logo?`<img src="${logo}" onerror="this.style.display='none'" style="width:22px;height:22px;border-radius:5px;object-fit:contain;background:#fff;border:1.5px solid ${r.st.color};padding:1px;"/>`:`<span style="font-size:9px;font-weight:600;color:${r.st.color};">${r.s.key}</span>`}
      <span style="font-size:7px;font-weight:700;color:var(--muted);margin-top:1px;">${r.s.key}</span>
    </div>`;
  }).join('');
  const quad=`<div style="position:relative;height:230px;background:linear-gradient(135deg,#fef2f2 0%,#fffbeb 50%,#f0fdf4 100%);border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden;">
    <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.08);"></div>
    <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,0,0,.08);"></div>
    <div style="position:absolute;top:4px;left:6px;font-size:8px;font-weight:700;color:#dc2626;opacity:.7;">CARO + CRECE<br><span style="font-weight:400;">growth premium</span></div>
    <div style="position:absolute;top:4px;right:6px;font-size:8px;font-weight:700;color:#16a34a;opacity:.8;text-align:right;">BARATO + CRECE<br><span style="font-weight:400;">oportunidad / GARP</span></div>
    <div style="position:absolute;bottom:4px;left:6px;font-size:8px;font-weight:700;color:#6b7280;opacity:.7;">CARO + LENTO<br><span style="font-weight:400;">evitar</span></div>
    <div style="position:absolute;bottom:4px;right:6px;font-size:8px;font-weight:700;color:#b45309;opacity:.8;text-align:right;">BARATO + LENTO<br><span style="font-weight:400;">value / reversión</span></div>
    ${dots}
  </div>
  <div style="display:flex;justify-content:space-between;font-size:8px;color:var(--muted);font-weight:700;text-transform:uppercase;margin:-6px 2px 8px;"><span>← caro</span><span>↑ crecimiento</span><span>barato →</span></div>`;
  // ── Tabla ──
  const sorted=[...rows].sort((a,b)=>b.st.growthScore-a.st.growthScore);
  const cc=(v,a,b)=>v>=a?'#16a34a':v>=b?'#d97706':'#dc2626';
  const tbl=`<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:10.5px;min-width:560px;">
    <thead><tr style="background:${_dm()?'#1c2333':'#f7f6f3'};color:var(--muted);">
      ${[['Empresa',null],['Estilo','estilo'],['Crec.','crec'],['ROIC','roic'],['Mg FCF','mgfcf'],['EV/FCF vs media','evfcf'],['PEG','peg'],['Rule 40','r40'],['FCF yield','fcfy']].map(([h,key],i)=>`<th style="padding:6px 7px;text-align:${i<2?'left':'center'};font-weight:700;border-bottom:2px solid var(--border);${key?'cursor:help;':''}" ${key?`onclick="showColInfo('gv','${key}',event)" title="¿Qué es? Pulsa para ver"`:''}>${h}${key?' ⓘ':''}</th>`).join('')}
    </tr></thead><tbody>
    ${sorted.map(r=>{const st=r.st;const logo=logoUrlFor(r.s.key);return `<tr style="border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">
      <td style="padding:5px 7px;cursor:pointer;" onclick="setView('analysis');setTimeout(()=>switchCo('${r.s.key}'),50)" title="Abrir análisis de ${r.s.name}"><div style="display:flex;align-items:center;gap:6px;">${logo?`<img src="${logo}" onerror="this.style.display='none'" style="width:18px;height:18px;border-radius:4px;object-fit:contain;"/>`:''}<span style="font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${r.s.key}</span></div></td>
      <td style="padding:5px 7px;"><span style="background:${st.color}15;color:${st.color};border:1px solid ${st.color}40;padding:1px 7px;border-radius:10px;font-size:9px;font-weight:600;white-space:nowrap;">${st.icon} ${st.style}</span></td>
      <td style="text-align:center;font-weight:700;color:${cc(st.growth,12,6)};">${st.growth}%</td>
      <td style="text-align:center;font-weight:700;color:${cc(st.roic,20,12)};">${st.roic.toFixed(0)}%</td>
      <td style="text-align:center;font-weight:700;color:${cc(st.fcfM,20,10)};">${st.fcfM.toFixed(0)}%</td>
      <td style="text-align:center;font-weight:700;color:${st.cheapPct>=0?'#16a34a':'#dc2626'};">${st.evfcfCur}x <span style="font-size:8px;">(${st.cheapPct>=0?'−':'+'}${Math.abs(st.cheapPct).toFixed(0)}%)</span></td>
      <td style="text-align:center;font-weight:700;color:${st.peg==null?'#6b7280':cc(2-st.peg,1,0)};">${st.peg!=null?st.peg.toFixed(2):'—'}</td>
      <td style="text-align:center;font-weight:700;color:${cc(st.ruleOf40,40,30)};">${st.ruleOf40}%</td>
      <td style="text-align:center;font-weight:700;color:${cc(st.fcfYield,5,3)};">${st.fcfYield}%</td>
    </tr>`;}).join('')}
  </tbody></table></div>`;
  const gvOpen=localStorage.getItem('vi_gv_open')==='1';
  el.innerHTML=`<div class="card">
    <div onclick="toggleGvCompare()" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;cursor:pointer;user-select:none;${gvOpen?'margin-bottom:10px;':''}">
      <div class="dash-sec-title" style="margin:0;">Growth vs Value — comparador de la cartera <span id="gv-chevron" style="font-size:9px;color:var(--muted);">${gvOpen?'▲ ocultar':'▼ mostrar'}</span></div>
      <span style="display:flex;gap:6px;flex-wrap:wrap;">
        <span onclick="event.stopPropagation();showGvHelp()" style="cursor:pointer;font-size:9px;color:#2563eb;border:1px solid #2563eb55;border-radius:10px;padding:2px 8px;font-weight:700;">¿Qué significan las métricas? ⓘ</span>
        <span onclick="event.stopPropagation();showTip('estilo',this)" style="cursor:pointer;font-size:9px;color:#2563eb;border:1px solid #2563eb55;border-radius:10px;padding:2px 8px;font-weight:700;">¿Cómo se clasifica? ⓘ</span>
      </span>
    </div>
    <div id="gv-body" style="display:${gvOpen?'block':'none'};">${quad}${tbl}</div>
  </div>`;
}
