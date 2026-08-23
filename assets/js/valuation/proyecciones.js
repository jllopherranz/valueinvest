// ─────────────────────────────────────────────────────────────
// Proyecciones automáticas: modelo SEC (ISD) y consenso de analistas FMP
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// 2ª VALORACIÓN — proyecciones AUTOMÁTICAS desde datos reales (SEC vía Finnhub)
// No toca las proyecciones de tu hoja: deriva un isD alternativo y lo corre por el mismo motor.
// Capa-fuente: base = cuentas reales SEC (siempre actualizado); ampliable con TIKR/FMP.
// ═══════════════════════════════════════════════════════════════════
function _avgRecent(arr,n){const v=arr.filter(x=>x!=null&&isFinite(x)).slice(-n);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null;}
function autoISDFromFinancials(rows){
  const annual=rows.filter(x=>/10-K|20-F|40-F/.test(x.form||'')).slice(0,6).reverse();
  if(annual.length<3) return null;
  const rev=[],ebitM=[],tax=[],capexM=[],sh=[];
  for(const yr of annual){
    const ic=yr.report&&yr.report.ic, bs=yr.report&&yr.report.bs, cf=yr.report&&yr.report.cf;
    const r=_conceptVal(ic,_GAAP.revenue); if(r==null||r<=0) continue;
    const op=_conceptVal(ic,_GAAP.ebit);
    const pti=_conceptVal(ic,['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest','IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments']);
    const txp=_conceptVal(ic,['IncomeTaxExpenseBenefit']);
    const cx=_conceptVal(cf,_GAAP.capex);
    rev.push(r); ebitM.push(op!=null?op/r*100:null);
    tax.push((pti&&pti>0&&txp!=null)?txp/pti*100:null);
    capexM.push(cx!=null?Math.abs(cx)/r*100:null);
    sh.push(_conceptVal(bs,_GAAP.shares)||_conceptVal(ic,_GAAP.shares));
  }
  if(rev.length<3) return null;
  const n=rev.length,last=a=>a[a.length-1];
  let g=(rev[0]>0)?(Math.pow(last(rev)/rev[0],1/(n-1))-1)*100:10; g=Math.max(2,Math.min(35,g));
  const term=Math.max(3,Math.min(8,g*0.35)); // crecimiento terminal (fade)
  const sg=[]; for(let i=0;i<5;i++) sg.push(+(g+(term-g)*(i/4)).toFixed(1));
  let em0=_avgRecent(ebitM,3); em0=(em0==null||em0<-50)?18:Math.min(70,em0); const em=Array(5).fill(+(+em0).toFixed(1));
  let tr0=_avgRecent(tax,3); tr0=(tr0==null||tr0<5||tr0>40)?21:tr0; const tr=Array(5).fill(+(+tr0).toFixed(1));
  let cx0=_avgRecent(capexM,3); cx0=(cx0==null||cx0<0)?4:Math.min(40,cx0); const cx=Array(5).fill(+(+cx0).toFixed(1));
  let di0=0; if(sh.length>=2&&sh[0]>0) di0=(Math.pow(last(sh)/sh[0],1/(sh.length-1))-1)*100;
  if(!isFinite(di0)||di0>6) di0=1; // >6%/año sostenido ≈ split o dato sucio (p.ej. NVDA 10:1) → dilución suave
  di0=Math.max(-4,Math.min(4,di0)); const di=Array(5).fill(+di0.toFixed(1));
  return {sg,em,tr,di,cx,wc:Array(5).fill(0),_g:+g.toFixed(1)};
}
// Réplica pura de la rama de simulación de calcISModel, con isD arbitrario y empresa explícita
function projectFromISD(isd,c){
  const rows=[]; let ps=c.sales[9],psh=c.shares;
  const ebitdaEbitRatio=(c.ebitdaM[9]/Math.max(c.ebitM[9],1));
  for(let i=0;i<5;i++){
    const s=ps*(1+isd.sg[i]/100);
    const ebit=s*isd.em[i]/100;
    const eb=ebit*ebitdaEbitRatio;
    const nopat=ebit*(1-isd.tr[i]/100);
    const cx=s*isd.cx[i]/100;
    const dwc=(s-ps)*Math.abs(isd.wc[i])/100*(isd.wc[i]<0?1:-1);
    const fcf=nopat+(eb-ebit)-cx+dwc;
    const sh=psh*(1+isd.di[i]/100);
    const nd=Math.max(0,(rows[i-1]?.nd??c.netDebt[9])-fcf*0.3);
    rows.push({yr:(c.pY&&c.pY[i])||((c.years[9]||2025)+i+1),s,eb,ebit,fcf,eps:nopat/sh,sh,nd});
    ps=s; psh=sh;
  }
  return rows;
}
// Precio objetivo promedio (PER·EV/FCF·EV/EBITDA·EV/EBIT) por año, desde filas de proyección × múltiplos objetivo
function targetsFromRows(rows,c){
  const gm=getCompanyMults(coKeyOf(c)); const ebitRatio=(c.ebitda[9]>0)?(c.ebit[9]/c.ebitda[9]):0.85;
  return rows.map(m=>{
    const per=m.eps>0?m.eps*gm.per:null;
    const evf=(m.fcf*gm.evf-m.nd)/m.sh;
    const eveb=(m.eb*gm.eveb-m.nd)/m.sh;
    const evei=(m.ebit*gm.evei-m.nd)/m.sh;
    const vals=[per,evf,eveb,evei].filter(v=>v!=null&&isFinite(v)&&v>0);
    return vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length):null;
  });
}
async function renderAutoValuation(key){
  const box=document.getElementById('autoval-box'); if(!box||!DB[key]) return;
  let cached=null; try{cached=JSON.parse(localStorage.getItem('vi_autoval_'+key)||'null');}catch(e){}
  if(cached&&cached.isd&&(Date.now()-cached.ts)<7*864e5){ _fillAutoVal(key,cached.isd); return; }
  box.innerHTML='<div style="font-size:11px;color:var(--muted);padding:8px;">🤖 Calculando estimación automática desde cuentas reales (SEC)…</div>';
  const finRows=await fetchAnnualFinancials(DB[key].finnhubTicker||DB[key].ticker||key);
  const isd=finRows?autoISDFromFinancials(finRows):null;
  if(!isd){ box.innerHTML='<div style="font-size:10.5px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;">⚠ Sin cuentas SEC para esta empresa (habitual en valores no-US). La 2ª valoración automática no está disponible aquí — usa tu hoja o conéctala vía TIKR/FMP.</div>'; return; }
  try{localStorage.setItem('vi_autoval_'+key,JSON.stringify({isd,ts:Date.now()}));}catch(e){}
  _fillAutoVal(key,isd);
}
function _fillAutoVal(key,isd){
  const box=document.getElementById('autoval-box'); if(!box) return;
  const c=DB[key];
  const rows=projectFromISD(isd,c);
  const auto=targetsFromRows(rows,c);
  const sheet=avgTargetsFor(key);
  const y1=(c.pY&&c.pY[0])||((c.years[9]||2025)+1), y5=(c.pY&&c.pY[4])||((c.years[9]||2025)+5);
  const up=(v)=>v!=null&&price>0?((v-price)/price*100):null;
  const cg=(v)=>v!=null&&price>0?(Math.pow(v/price,1/5)-1)*100:null;
  const pc=v=>v==null?'#9a958e':v>=0?'#16a34a':'#dc2626';
  const sp=v=>v==null?'—':((v>=0?'+':'')+v.toFixed(0)+'%');
  const cell=(v,extra)=>`${curSymG()}${v!=null?N(v):'—'}${extra!=null?` <span style="font-size:9px;font-weight:600;color:${pc(extra)};">${sp(extra)}</span>`:''}`;
  box.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
      <span style="font-weight:600;font-size:13px;color:#0891b2;">🤖 Valoración automática</span>
      <span style="font-size:9px;background:#ecfeff;color:#0891b2;border:1px solid #a5f3fc;border-radius:8px;padding:1px 7px;font-weight:700;">datos reales SEC · se actualiza al publicar resultados</span>
      <span style="font-size:9px;color:var(--muted);">no sustituye tu hoja, la complementa</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;font-size:10px;">
      ${[['Crec. ventas',`${isd.sg[0]}% → ${isd.sg[4]}%`],['Mg. EBIT',`${isd.em[0]}%`],['Tax rate',`${isd.tr[0]}%`],['CapEx/Vtas',`${isd.cx[0]}%`],['Dilución',`${isd.di[0]}%`]]
        .map(([l,v])=>`<span style="background:${_dm()?'#1c2333':'#f7f6f3'};border:1px solid var(--border);border-radius:8px;padding:3px 8px;"><b style="color:var(--sub);">${l}:</b> ${v}</span>`).join('')}
    </div>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:380px;">
      <thead><tr style="background:${_dm()?'#1c2333':'#f7f6f3'};">
        <th style="text-align:left;padding:6px 8px;color:var(--muted);font-weight:700;border-bottom:2px solid var(--border);">Precio objetivo (prom. 4 múlt.)</th>
        <th style="text-align:center;padding:6px 8px;color:#0891b2;font-weight:600;border-bottom:2px solid var(--border);background:#ecfeff;">🤖 Auto (SEC)</th>
        <th style="text-align:center;padding:6px 8px;color:#1e3a5f;font-weight:600;border-bottom:2px solid var(--border);background:#eef2f7;">Tu hoja</th>
      </tr></thead><tbody>
        <tr><td style="padding:6px 8px;border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">Valor ${y1}e <span style="font-size:9px;color:var(--muted);">· vs precio</span></td>
          <td style="text-align:center;padding:6px 8px;border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};background:#fafdff;font-weight:700;">${cell(auto[0],up(auto[0]))}</td>
          <td style="text-align:center;padding:6px 8px;border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};font-weight:700;">${cell(sheet[0],up(sheet[0]))}</td></tr>
        <tr><td style="padding:6px 8px;">Objetivo ${y5}e <span style="font-size:9px;color:var(--muted);">· CAGR 5Y</span></td>
          <td style="text-align:center;padding:6px 8px;background:#fafdff;font-weight:700;">${cell(auto[4])} <span style="font-size:9px;font-weight:600;color:${pc(cg(auto[4]))};">${cg(auto[4])!=null?(cg(auto[4])>=0?'+':'')+cg(auto[4]).toFixed(0)+'%/año':''}</span></td>
          <td style="text-align:center;padding:6px 8px;font-weight:700;">${cell(sheet[4])} <span style="font-size:9px;font-weight:600;color:${pc(cg(sheet[4]))};">${cg(sheet[4])!=null?(cg(sheet[4])>=0?'+':'')+cg(sheet[4]).toFixed(0)+'%/año':''}</span></td></tr>
      </tbody></table></div>
    <div style="font-size:9px;color:var(--muted);margin-top:7px;">Mismos múltiplos objetivo que tu hoja; cambia solo la <b>proyección</b> (crecimiento/márgenes/tax derivados de las últimas cuentas reales). <span style="color:#0891b2;">＋ Próximo: enchufar TIKR/FMP para usar consenso de analistas.</span></div>`;
}

// isD de TU HOJA por año (sin mutar globals) — para mostrar la columna "hoja" aunque la activa sea 'auto'
function sheetISD(){
  const c=co; const ebitRatio=c.ebitM[9]/Math.max(c.ebitdaM[9],1);
  let sg,em;
  if(c.pS&&c.pS.length>=5&&c.pEB&&c.pEPS){
    const ebRatio=c.ebitda[9]>0?(c.ebit[9]/c.ebitda[9]):0.85;
    sg=c.pS.map((s,i)=>+(((s/(i===0?c.sales[9]:c.pS[i-1]))-1)*100).toFixed(1));
    em=c.pS.map((s,i)=>+((c.pEB[i]*ebRatio/s)*100).toFixed(1));
  }else{ sg=[...c.isD.sg]; em=c.isD.em.map(v=>+(v*ebitRatio).toFixed(1)); }
  return {sg,em,tr:[...c.isD.tr],di:[...c.isD.di],cx:[...c.isD.cx],wc:[...c.isD.wc]};
}
function autoISDCached(key){ try{const o=JSON.parse(localStorage.getItem('vi_autoval_'+(key||coKeyOf(co)))||'null'); return (o&&o.isd)?o.isd:null;}catch(e){return null;} }
async function ensureAutoISD(key){
  const cached=autoISDCached(key); if(cached) return cached;
  const fin=await fetchAnnualFinancials(DB[key].finnhubTicker||DB[key].ticker||key);
  const isd=fin?autoISDFromFinancials(fin):null;
  if(isd){ try{localStorage.setItem('vi_autoval_'+key,JSON.stringify({isd,ts:Date.now()}));}catch(e){} }
  return isd;
}
// Construye la proyección "web" (consenso de analistas FMP, o fallback modelo SEC) y la cachea.
// Devuelve {years, rows, isdByYear, src:'fmp'|'sec', nA}.
async function ensureWebProj(key){
  if(_webProj[key]&&(_webProj[key].rows||_webProj[key].error)) return _webProj[key];
  const c=DB[key]; if(!c) return null;
  const M=1e6;
  const fcfNi=Math.max(0.5,Math.min(1.2,(c.netIncome&&c.netIncome[9]>0&&c.fcf&&c.fcf[9]!=null)?c.fcf[9]/c.netIncome[9]:0.85));
  const nd0=(c.netDebt&&c.netDebt[9]!=null)?c.netDebt[9]:0;
  let lastYr=(c.years&&c.years[9])||2025, lastRev=(c.sales&&c.sales[9])||null;
  let fin=null; try{ fin=await fetchAnnualFinancials(c.finnhubTicker||c.ticker||key); }catch(e){}
  if(fin){const ann=fin.filter(x=>/10-K|20-F|40-F/.test(x.form||''));if(ann.length){const ly=Math.max(...ann.map(x=>+x.year));if(ly)lastYr=ly;const lr=_conceptVal((ann.find(x=>+x.year===ly)||{}).report?.ic,_GAAP.revenue);if(lr)lastRev=lr/M;}}
  // 1) FMP — consenso de analistas
  if(getFMPKey()){
    const fmp=await fetchFMPEstimates(c.ticker||key);
    if(fmp&&Array.isArray(fmp.rows)){
      const rws=fmp.rows.map(x=>({yr:+String(x.date||'').slice(0,4),rev:x.revenueAvg,ebit:x.ebitAvg,ebitda:x.ebitdaAvg,ni:x.netIncomeAvg,eps:x.epsAvg,nA:x.numAnalystsEps||x.numAnalystsRevenue})).filter(x=>x.yr&&x.rev>0).sort((a,b)=>a.yr-b.yr);
      const fwd=rws.filter(x=>x.yr>lastYr).slice(0,5);
      if(fwd.length>=2){
        const years=[],rows=[],isdByYear={}; let prev=lastRev||(fwd[0].rev/M);
        fwd.forEach(x=>{
          const s=x.rev/M, ebit=(x.ebit!=null?x.ebit:(x.ebitda||0)*0.94)/M, eb=(x.ebitda!=null?x.ebitda:(x.ebit||0)*1.06)/M, ni=(x.ni||0)/M, eps=x.eps;
          const sh=(eps&&ni)?ni/eps:c.shares, fcf=ni*fcfNi;
          years.push(x.yr); rows.push({yr:x.yr,s,eb,ebit,fcf,eps,sh,nd:nd0});
          const tr=(ebit>0&&ni>0&&ni<ebit)?+(((ebit-ni)/ebit)*100).toFixed(1):null;
          isdByYear[x.yr]={sg:+(((s/prev)-1)*100).toFixed(1),em:+(ebit/s*100).toFixed(1),tr,di:null,cx:null,wc:null,nA:x.nA};
          prev=s;
        });
        return (_webProj[key]={years,rows,isdByYear,src:'fmp',nA:fwd[Math.min(1,fwd.length-1)].nA});
      }
      if(fmp.error&&fmp.error!=='no-key') _webProj[key+'_fmpwarn']=fmp.error;
    } else if(fmp&&fmp.error){ _webProj[key+'_fmpwarn']=fmp.error; }
  }
  // 2) Fallback: modelo automático sobre cuentas SEC (años co.pY)
  const isd=fin?autoISDFromFinancials(fin):null;
  if(!isd) return (_webProj[key]={error:'sin datos (¿FMP cubre este valor? solo US · o no hay cuentas SEC)'});
  const rows=projectFromISD(isd,c), years=(c.pY||rows.map(r=>r.yr)).slice(0,5), isdByYear={};
  years.forEach((y,i)=>{isdByYear[y]={sg:isd.sg[i],em:isd.em[i],tr:isd.tr[i],di:isd.di[i],cx:isd.cx[i],wc:isd.wc[i]};});
  return (_webProj[key]={years,rows,isdByYear,src:'sec'});
}
// Cambiar la fuente de proyecciones que dirige TODA la valoración (precios objetivo, múltiplo forward, veredicto)
async function setProjSource(src){
  const k=coKeyOf(co);
  _projManual=true;   // elección explícita del usuario: no volver a auto-preferir FMP
  if(src==='auto'){
    const w=await ensureWebProj(k);
    if(!w||w.error||!w.rows){ alert('No hay proyecciones web para '+(co.name||k)+(w&&w.error?':\n'+w.error:'.')); return; }
    _projSource='auto'; _isEdited=false;
  } else { _projSource='sheet'; resetIS(); }
  recalc(); if(curTab==='valoracion') showTab('valoracion');
}
// ── FMP (Financial Modeling Prep) — consenso de analistas para la columna 🤖 Web ──
let _fmpCache={};
function getFMPKey(){return localStorage.getItem('fmp_api_key')||'';}
function promptFMPKey(){
  const k=prompt('API key GRATIS de Financial Modeling Prep para el consenso de analistas:\n\n1) Regístrate en site.financialmodelingprep.com/developer/docs (gratis)\n2) Copia tu API key\n3) Pégala aquí:', getFMPKey());
  if(k!=null){ localStorage.setItem('fmp_api_key',k.trim()); _fmpCache={};
    try{Object.keys(localStorage).forEach(x=>{if(x.startsWith('vi_autoval_'))localStorage.removeItem(x);});}catch(e){}
    alert(k.trim()?'✅ Key de FMP guardada. Reabriendo Valoración…':'Key de FMP borrada.');
    if(curTab==='valoracion') showTab('valoracion');
  }
}
async function fetchFMPEstimates(symbol){
  const key=getFMPKey(); if(!key) return {error:'no-key'};
  if(_fmpCache[symbol]) return _fmpCache[symbol];
  try{
    const r=await fetch(`https://financialmodelingprep.com/stable/analyst-estimates?symbol=${encodeURIComponent(symbol)}&period=annual&apikey=${key}`,{signal:AbortSignal.timeout(10000)});
    const d=await r.json();
    let out;
    if(d&&d['Error Message']) out={error:d['Error Message']};
    else if(Array.isArray(d)) out={rows:d};
    else out={error:'respuesta inesperada'};
    _fmpCache[symbol]=out; return out;
  }catch(e){return {error:String((e&&e.message)||e)};}
}

// Persiste una edición de la columna 🤖 Web ("últimas modificadas") en vi_autoval
function _persistMod(field,i,val){
  const k=coKeyOf(co); let o=null; try{o=JSON.parse(localStorage.getItem('vi_autoval_'+k)||'null');}catch(e){}
  if(!o||!o.isd) o={isd:(autoISDCached(k)||sheetISD()),ts:Date.now()};
  if(!Array.isArray(o.isd[field])) o.isd[field]=[];
  o.isd[field][i]=+val;
  try{localStorage.setItem('vi_autoval_'+k,JSON.stringify(o));}catch(e){}
}
