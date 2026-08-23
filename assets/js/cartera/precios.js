// ─────────────────────────────────────────────────────────────
// Precios en vivo de la tabla de cartera
// ─────────────────────────────────────────────────────────────
async function fetchCarteraPrices(){
  const fhKey=getFinnhubKey();
  let curNuevas=false;                       // ¿alguna divisa ha quedado confirmada en esta pasada?
  for(const co of getAllPortfolioCompanies()){
    const yfT=yfSymbolForKey(co.key);
    // Yahoo (gratis) da el último CIERRE diario, la variación semanal y —clave— LA DIVISA
    let yq=null; try{ yq=await fetchQuoteYF(yfT); }catch(e){}
    if(yq&&yq.cur&&setDetectedCur(co.key,yq.cur,yq.sym)) curNuevas=true;
    let c=yq?yq.c:null, dp=yq?yq.dp:null, wp=yq?yq.wp:null;
    // Finnhub da el precio en TIEMPO REAL → prevalece para el precio y el % diario (Yahoo suele ir
    // un día por detrás). Solo se pide cuando la cotización de referencia es de EE. UU.: para una
    // bolsa extranjera Finnhub devolvería otro listado en dólares y falsearía precio y divisa.
    const fhT=fhSymbolForKey(co.key);
    if(fhKey&&fhT){
      try{
        const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhT)}&token=${fhKey}`,{signal:AbortSignal.timeout(7000)});
        const j=await r.json();
        if(j&&j.c>0){ c=j.c; dp=(j.dp??dp); }   // precio en vivo de Finnhub (wp semanal sigue siendo de Yahoo)
      }catch(e){}
    }
    if(c>0){ _carteraPrices[co.key]={c,dp,wp}; _saveLastPx(co.key,c); updateCarteraRow(co.key); }
    await new Promise(r=>setTimeout(r,260));
  }
  if(typeof renderStyleCompare==='function') renderStyleCompare(); // refresca comparador con precios live
  if(curNuevas){
    renderCartera();          // divisas ya confirmadas por la fuente → repinta etiquetas, pesos y totales
  }else{
    _refreshCarteraWeights(); // pesos coherentes: un único total
    if(typeof renderPortfolioSummary==='function') renderPortfolioSummary();
  }
}

// Recalcula el total de la cartera con TODOS los precios ya actualizados y repinta los pesos.
// (Durante la descarga los precios llegan de uno en uno; calcular el peso en ese momento daría
//  porcentajes que no suman 100.)
function _refreshCarteraWeights(){
  const cos=getAllPortfolioCompanies();
  const ms=cos.map(c=>({c,m:carteraMetrics(c)}));
  _cartTotal=ms.reduce((a,x)=>a+(x.m.mktValue||0),0);
  ms.forEach(({c})=>updateCarteraRow(c.key));
}

function updateCarteraRow(key){
  const co=getAllPortfolioCompanies().find(c=>c.key===key)||{key,ticker:key};
  const m=carteraMetrics(co);
  const cur=curSymOf(key);
  const fmt=v=>v!=null?(cur+(Math.abs(v)>=1000?new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(v)):v.toFixed(2))):'—';
  const sp=(v,dec=1)=>v!=null?((v>=0?'+':'')+v.toFixed(dec)+'%'):'—';
  const retCol=v=>v==null?'#9a958e':v>=15?'#16a34a':v>=8?'#d97706':'#dc2626';
  const mdsCol=v=>v==null?'#9a958e':v>=15?'#16a34a':v>=0?'#d97706':'#dc2626';
  const p=id=>document.getElementById(id);
  if(p('cprice-'+key)) p('cprice-'+key).textContent=fmt(m.price);
  if(p('cday-'+key)){const c=m.dailyPct==null?'#9a958e':m.dailyPct>=0?'#16a34a':'#dc2626';p('cday-'+key).textContent=m.dailyPct!=null?sp(m.dailyPct,2):'';p('cday-'+key).style.color=c;}
  if(p('cweek-'+key)){const c=m.weeklyPct==null?'#9a958e':m.weeklyPct>=0?'#16a34a':'#dc2626';p('cweek-'+key).innerHTML=m.weeklyPct!=null?(m.weeklyPct>=0?'▲':'▼')+sp(m.weeklyPct,1):'—';p('cweek-'+key).style.color=c;}
  if(p('cobjevf-'+key)) p('cobjevf-'+key).textContent=fmt(m.objEVF);
  if(p('cmds-'+key)){p('cmds-'+key).textContent=m.mds!=null?sp(m.mds,0)+' MdS':'—';p('cmds-'+key).style.color=mdsCol(m.mds);}
  if(p('c15-'+key)){const inZone=(m.price!=null&&m.price15!=null&&m.price<=m.price15*1.03);p('c15-'+key).textContent=fmt(m.price15);p('c15-'+key).style.color=inZone?'#16a34a':'var(--text)';}
  if(p('cmds15-'+key)){p('cmds15-'+key).textContent=m.mds15!=null?sp(m.mds15,0)+' MdS':'—';p('cmds15-'+key).style.color=mdsCol(m.mds15);}
  if(p('cobj5-'+key)) p('cobj5-'+key).textContent=fmt(m.obj5);
  if(p('cret-'+key)){p('cret-'+key).textContent=m.cagr5!=null?sp(m.cagr5,0)+'/año':'';p('cret-'+key).style.color=retCol(m.cagr5);}
  if(p('cpeg-'+key)) p('cpeg-'+key).innerHTML=pegBar(m.peg,m.per,m.g);
  if(p('cprud-'+key)) p('cprud-'+key).textContent='prud. '+(m.mdsCons!=null?sp(m.mdsCons,0):'—');
  if(p('cprud5-'+key)) p('cprud5-'+key).textContent='prud. '+(m.cagr5Cons!=null?sp(m.cagr5Cons,0)+'/año':'—');
  // Mi coste: el rendimiento y el peso dependen del precio, así que también se refrescan
  if(p('cpos-'+key)&&m.buyPrice){
    const rc=m.retPct==null?'#9a958e':m.retPct>=0?'#16a34a':'#dc2626';
    const peso=(m.mktValue!=null&&_cartTotal>0)?(m.mktValue/_cartTotal*100):null;
    p('cpos-'+key).innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--text);">${mny(fmt(m.buyPrice))}</div>`
      +`<div style="font-size:10px;font-weight:700;color:${rc};">${sp(m.retPct)}</div>`
      +(m.mktValue!=null
        ? `<div style="font-size:9px;color:var(--muted);font-weight:600;">${privado()?'':m.shares+' acc · '+fmtBase(m.mktValue,0)+' · '}${peso!=null?'<b>'+peso.toFixed(0)+'%</b>':''}</div>`
        : `<div style="font-size:9px;color:var(--amber);font-weight:700;">+ nº acciones</div>`);
  }
}
