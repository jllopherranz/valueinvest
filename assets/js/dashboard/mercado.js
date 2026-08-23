// ─────────────────────────────────────────────────────────────
// Tiles de mercado: índices, Euríbor (BCE), Fear & Greed y variación semanal
// ─────────────────────────────────────────────────────────────
async function fetchDashPrices(){
  const ts=document.getElementById('dash-prices-ts'); if(ts) ts.textContent='Actualizando...';
  // Índices/activos REALES vía Yahoo (corsproxy). Finnhub free no tiene índices, cripto ni forex,
  // así que usábamos ETFs proxy (SPY/QQQ/GLD/TLT) → valores engañosos. Ahora son los reales.
  const mktMap=[
    {id:'sp500',t:'^GSPC'},{id:'ndx',t:'^NDX'},{id:'dow',t:'^DJI'},{id:'vix',t:'^VIX'},
    {id:'btc',t:'BTC-USD'},{id:'gold',t:'GC=F'},{id:'eur',t:'EURUSD=X'},
    {id:'tnote',t:'^TNX'},{id:'oil',t:'CL=F'},
  ];
  await Promise.allSettled(mktMap.map(async m=>{
    const q=await fetchQuoteYF(m.t);
    if(q&&q.c) updateDashMktTile(m.id,q.c,(q.dp??0),0);
  }));
  const now=new Date();
  if(ts) ts.textContent='Mercado: '+now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  // Espera a que Sentimiento y Euríbor tengan valor ANTES de clonar el ticker (máx 1,5s),
  // así ambas copias del giratorio muestran el dato en vez de "—".
  await Promise.race([
    Promise.allSettled([fetchFearGreed(),fetchEuribor()]),
    new Promise(r=>setTimeout(r,1500)),
  ]);
  _startTicker();
}

// ── Índice Miedo/Codicia (CNN Fear & Greed, 0=Miedo extremo · 100=Codicia extrema) ──
const FG_RATING_ES={'extreme fear':'Miedo extremo','fear':'Miedo','neutral':'Neutral','greed':'Codicia','extreme greed':'Codicia extrema'};
async function fetchFearGreed(){
  const valEl=document.getElementById('dm-fg'),lblEl=document.getElementById('fg-lbl'),needle=document.getElementById('fg-needle');
  if(!valEl) return;
  const cacheKey='vi_feargreed',cacheTtl=30*60*1000; // 30min cache, el índice no se mueve más rápido
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
    if(cached&&Date.now()-cached.ts<cacheTtl){ _renderFearGreed(cached.score,cached.rating); return; }
  }catch(e){}
  const url='https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
  const headers={'headers':{'accept':'application/json'}};
  let data=null;
  try{
    const r=await fetch('https://corsproxy.io/?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});
    if(r.ok) data=await r.json();
  }catch(e){}
  if(!data){
    try{
      const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});
      if(r.ok){const w=await r.json();data=JSON.parse(w.contents||'null');}
    }catch(e){}
  }
  const fg=data&&data.fear_and_greed;
  if(!fg||typeof fg.score!=='number'){
    if(valEl) valEl.textContent='—'; if(lblEl) lblEl.textContent='';
    return;
  }
  const score=Math.round(fg.score),rating=(fg.rating||'').toLowerCase();
  try{localStorage.setItem(cacheKey,JSON.stringify({score,rating,ts:Date.now()}));}catch(e){}
  _renderFearGreed(score,rating);
}
function _renderFearGreed(score,rating){
  const valEl=document.getElementById('dm-fg'),lblEl=document.getElementById('fg-lbl'),needle=document.getElementById('fg-needle');
  if(valEl) valEl.textContent=score;
  if(lblEl) lblEl.textContent=FG_RATING_ES[rating]||rating;
  if(needle) needle.style.left=Math.min(96,Math.max(4,score))+'%';
}

// ── Euríbor 12M (BCE) — índice de referencia de las hipotecas en España ──
function _renderEuribor(v,dpp){
  const valEl=document.getElementById('dm-euribor'),chgEl=document.getElementById('dc-euribor');
  if(valEl) valEl.textContent=v.toFixed(3).replace('.',',')+'%';
  if(chgEl&&dpp!=null&&Math.abs(dpp)>=0.001){
    // variación mensual en puntos; bajar el Euríbor abarata hipotecas (verde), subir las encarece (rojo)
    chgEl.textContent=(dpp>=0?'▲ +'+dpp.toFixed(2):'▼ '+Math.abs(dpp).toFixed(2)).replace('.',',')+' pp';
    chgEl.style.color=dpp>0?'var(--red)':'var(--green)';
    chgEl.style.opacity='.85';
  }
}
function _parseEcbCsv(txt){
  const lines=(txt||'').trim().split('\n'); if(lines.length<2) return [];
  const iVal=lines[0].split(',').indexOf('OBS_VALUE');
  return lines.slice(1).map(l=>{const c=l.split(',');const v=parseFloat(c[iVal>=0?iVal:9]);return isFinite(v)?v:null;}).filter(v=>v!=null);
}
async function fetchEuribor(){
  const valEl=document.getElementById('dm-euribor'); if(!valEl) return;
  const cacheKey='vi_euribor',ttl=6*3600*1000; // 6h: el promedio mensual apenas se mueve
  try{const c=JSON.parse(localStorage.getItem(cacheKey)||'null'); if(c&&Date.now()-c.ts<ttl){_renderEuribor(c.v,c.d);return;}}catch(e){}
  const url='https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA?lastNObservations=2&format=csvdata';
  let vals=[];
  try{const r=await fetch(url,{signal:AbortSignal.timeout(9000)}); if(r.ok) vals=_parseEcbCsv(await r.text());}catch(e){}
  if(!vals.length){ // fallback proxy si el BCE no responde
    try{const r=await fetch('https://corsproxy.io/?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)}); if(r.ok) vals=_parseEcbCsv(await r.text());}catch(e){}
  }
  if(!vals.length) return;                       // deja el "—"
  const v=vals[vals.length-1], prev=vals.length>=2?vals[vals.length-2]:null;
  const d=prev!=null?+(v-prev).toFixed(4):null;
  try{localStorage.setItem(cacheKey,JSON.stringify({v,d,ts:Date.now()}));}catch(e){}
  _renderEuribor(v,d);
}

async function fetchWeeklyChange(key,fhTicker,apiKey,currentPrice){
  try{
    const to=Math.floor(Date.now()/1000);
    const from=to-7*86400;
    const url=`https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(fhTicker)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
    const r=await fetch(url,{signal:AbortSignal.timeout(7000)});
    const d=await r.json();
    if(d.c&&d.c.length>=2){
      const weekOpen=d.o[0]; // precio apertura hace 5 días
      const weekChg=(currentPrice-weekOpen)/weekOpen*100;
      const el=document.getElementById('dw-'+key);
      if(el){
        el.textContent=(weekChg>=0?'+':'')+weekChg.toFixed(2)+'%';
        el.style.color=weekChg>=0?'#16a34a':'#dc2626';
      }
    }
  }catch{}
}

function updateDashMktTile(id,price,pct,change){
  const pEl=document.getElementById('dm-'+id);
  const cEl=document.getElementById('dc-'+id);
  if(!pEl) return;
  const fmt=v=>{
    if(id==='btc') return '$'+new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(v);
    if(id==='eur') return v.toFixed(4);
    if(id==='tnote') return v.toFixed(2)+'%';
    if(v>=1000) return new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(v);
    return v.toFixed(2);
  };
  pEl.textContent=fmt(price);
  if(cEl){
    cEl.textContent=(pct>=0?'+':'')+pct.toFixed(2)+'%';
    cEl.style.color=pct>=0?'var(--green)':'var(--red)';
  }
  if(id==='vix'){
    const vixReal=price; // VXX no es exactamente VIX pero es buen proxy
    const lbl=document.getElementById('vix-lbl');
    if(lbl){lbl.textContent=vixReal<15?'Calma':vixReal<20?'Normal':vixReal<30?'Alerta':'Pánico';}
    const needle=document.getElementById('vix-needle');
    if(needle){const pct2=Math.min(96,Math.max(4,(vixReal-10)/50*100));needle.style.left=pct2+'%';}
    // Actualizar indicador macro lateral
    const mi=document.getElementById('m-vix')||document.createElement('span');
  }
  // Actualizar indicadores macro laterales
  if(id==='tnote'&&document.getElementById('mi-tnote')) document.getElementById('mi-tnote').textContent=price.toFixed(2)+'%';
  if(id==='eur'&&document.getElementById('mi-eur')) document.getElementById('mi-eur').textContent=price.toFixed(4);
  if(id==='oil'&&document.getElementById('mi-oil')) document.getElementById('mi-oil').textContent='$'+price.toFixed(2);
  if(id==='gold'&&document.getElementById('mi-gold')) document.getElementById('mi-gold').textContent='$'+Math.round(price);
}

function updateDashCoRow(key,price,pct,change){
  const pEl=document.getElementById('dp-'+key);
  const cEl=document.getElementById('dc-'+key);
  const mdsEl=document.getElementById('dmds-'+key);
  if(pEl){
    const cur=curSymOf(key);
    pEl.textContent=cur+(price>=1000?new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(price)):price.toFixed(2));
  }
  if(cEl){
    cEl.textContent=(pct>=0?'+':'')+pct.toFixed(2)+'%';
    cEl.style.color=pct>=0?'#16a34a':'#dc2626';
  }
  if(mdsEl){
    const co=DASH_COMPANIES.find(c=>c.key===key);
    if(co&&co._objActual&&price>0){
      const mds=(co._objActual/price-1)*100;
      mdsEl.textContent=(mds>=0?'+':'')+mds.toFixed(1)+'%';
      mdsEl.style.color=mds>=15?'#16a34a':mds>=0?'#d97706':'#dc2626';
    }
  }
}

// ── Noticias dashboard via Finnhub ──
