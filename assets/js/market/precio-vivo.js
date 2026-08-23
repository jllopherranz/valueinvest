// ─────────────────────────────────────────────────────────────
// Precio en vivo (Finnhub + Yahoo), badge LIVE y fecha de resultados
// ─────────────────────────────────────────────────────────────
// Para NOTICIAS y RESULTADOS la divisa es irrelevante: vale cualquier símbolo que Finnhub
// reconozca, así que se usa el ADR estadounidense cuando la bolsa local no está cubierta.
const FH_INFO_SYMBOL={ASML:'ASML',CSU:'CSU.TO'};
function fhInfoSymbolFor(key){
  return FH_INFO_SYMBOL[key]||(typeof yfSymbolForKey==='function'?yfSymbolForKey(key):key);
}
const TABS_NEED_RERENDER=['resumen','valoracion','alertas'];

function _getLiveBadge(){return document.getElementById('live-badge');}
function _getPriceChange(){return document.getElementById('price-change');}
function _getPriceInp(){return document.getElementById('price-inp');}

function _showLiveBadge(ok){
  const b=_getLiveBadge();if(!b) return;
  const dot=document.getElementById('live-dot'),txt=document.getElementById('live-text');
  if(ok){
    b.style.cssText='background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
    if(dot){dot.style.background='#16a34a';dot.style.animation='livepulse 2s infinite';}
    if(txt) txt.textContent='LIVE';
  }else{
    b.style.cssText='background:#fffbeb;color:#d97706;border:1px solid #fde68a;';
    if(dot){dot.style.background='#d97706';dot.style.animation='none';}
    if(txt) txt.textContent='RETRASADO';
  }
  b.classList.add('visible');
}

function _applyPrice(livePrice,prevClose,isLive){
  _livePrice=Math.round(livePrice*100)/100; // always track live price
  const wasLive=_priceLive; _priceLive=true;
  // If user is in simulation mode, only refresh the live badge — never override their price
  if(simMode){
    _showLiveBadge(isLive);
    _lastPriceTs=Date.now();
    if(!wasLive && TABS_NEED_RERENDER.includes(curTab)) showTab(curTab);
    return;
  }
  const prevPrice=price;
  price=Math.round(livePrice*100)/100;
  const inp=_getPriceInp();
  if(inp){
    inp.value=price;
    if(Math.abs(price-prevPrice)>0.01){
      inp.classList.remove('price-flash-up','price-flash-dn');
      void inp.offsetWidth;
      inp.classList.add(price>prevPrice?'price-flash-up':'price-flash-dn');
    }
  }
  _showLiveBadge(isLive);
  const change=livePrice-prevClose,changePct=prevClose?(change/prevClose*100):0;
  const chEl=_getPriceChange();
  if(chEl){
    const sign=change>=0?'+':'',arrow=change>=0?'▲':'▼';
    chEl.innerHTML=`<span style="font-size:11px;">${arrow}</span> ${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
    chEl.style.color=change>=0?'#16a34a':'#dc2626';
  }
  _lastPriceTs=Date.now();
  if((Math.abs(price-prevPrice)>0.01 || !wasLive) && TABS_NEED_RERENDER.includes(curTab)){
    showTab(curTab);   // re-render para reemplazar "Calculando…" por el veredicto real
  } else {
    recalc();
  }
}

// ── FINNHUB — funciona con CORS desde HTML estático ──
// Precio: c=current, d=change, dp=changePercent, pc=previousClose
// Candle diaria/semanal: /stock/candle?symbol=X&resolution=D&from=ts&to=ts&token=K
function getFinnhubKey(){return localStorage.getItem('finnhub_api_key')||'';}

async function _fetchFinnhub(ticker){
  const key=getFinnhubKey();
  if(!key) throw new Error('no key');
  const url=`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`;
  const r=await fetch(url,{signal:AbortSignal.timeout(7000)});
  if(!r.ok) throw new Error('finnhub '+r.status);
  const d=await r.json();
  if(!d.c) throw new Error('no price');
  return{live:d.c,prev:d.pc,change:d.d,changePct:d.dp,high:d.h,low:d.l,
    isLive:true, week52high:d.h, week52low:d.l};
}

async function fetchLivePrice(){
  const coKey=Object.keys(DB).find(k=>DB[k]===co)||'MSFT';
  if(_priceCache[coKey]&&(Date.now()-_priceCache[coKey].ts)<60000){
    const c=_priceCache[coKey];_applyPrice(c.live,c.prev,c.isLive);return;
  }
  // Mismo listado de referencia que la cartera → el precio de la cabecera está en la MISMA
  // divisa que los objetivos de esta empresa (mezclarlos falsea el margen de seguridad).
  const fhT=fhSymbolForKey(coKey);
  try{
    if(!fhT) throw new Error('bolsa fuera de EE. UU.: Finnhub gratuito no la cubre');
    const p=await _fetchFinnhub(fhT);
    _priceCache[coKey]={...p,ts:Date.now()};
    _saveLastPx(coKey,p.live);
    _applyPrice(p.live,p.prev,p.isLive);return;
  }catch(e){
    // Respaldo: Yahoo (último cierre). Imprescindible para Ámsterdam, Toronto, Taiwán…
    try{
      const q=await fetchQuoteYF(yfSymbolForKey(coKey));
      if(q&&q.c>0){
        if(q.cur) setDetectedCur(coKey,q.cur,q.sym);
        const prev=(q.dp!=null&&q.dp!==0)?q.c/(1+q.dp/100):q.c;
        _priceCache[coKey]={live:q.c,prev,isLive:false,ts:Date.now()};
        _saveLastPx(coKey,q.c);
        _applyPrice(q.c,prev,false);
        return;
      }
    }catch(e2){}
    const b=_getLiveBadge();
    if(b){
      const txt=document.getElementById('live-text');
      if(txt) txt.textContent=getFinnhubKey()?'ERROR':'SIN KEY';
      b.classList.add('visible');
      b.style.cssText='background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';
      const dot=document.getElementById('live-dot');
      if(dot){dot.style.background='#dc2626';dot.style.animation='none';}
    }
    // Sin precio en vivo: mostrar el veredicto con el precio de la hoja (no quedarse en "Calculando")
    if(!_priceLive){_priceLive=true; if(TABS_NEED_RERENDER.includes(curTab)) showTab(curTab);}
  }
}
function startPriceRefresh(){
  if(_priceInterval) clearInterval(_priceInterval);
  _priceInterval=setInterval(()=>{const h=new Date().getUTCHours();if(h>=13&&h<=21)fetchLivePrice();},90000);
}

// ── EARNINGS BADGE ──
function _earningsInfo(){
  if(!co.earningsDate) return {show:false,text:''};
  const dd=Math.ceil((new Date(co.earningsDate)-new Date())/(1000*60*60*24));
  if(dd<0||dd>120) return {show:false,text:''};
  const lbl=co.earningsLabel||'Resultados';
  return {show:true,dd,text:dd===0?`${lbl} HOY`:dd===1?`${lbl} · mañana`:`${lbl} · en ${dd} días`};
}
function updateEarningsBadge(){
  const info=_earningsInfo();
  const badge=document.getElementById('earnings-badge'),textEl=document.getElementById('earnings-text');
  if(badge&&textEl){ if(info.show){badge.classList.add('visible');textEl.textContent=(info.dd===0?'📢 ':'📅 ')+info.text;} else badge.classList.remove('visible'); }
  // chip dentro del Resumen de cada empresa
  const re=document.getElementById('resumen-earnings');
  if(re){ if(info.show){re.style.display='inline-flex';re.textContent='📅 '+info.text;} else re.style.display='none'; }
}
// Fecha real de próximos resultados por empresa (Finnhub) — para que cada una muestre su cuenta atrás
async function fetchEarningsDate(){
  const key=getFinnhubKey(); if(!key) return;
  const target=co, sym=fhInfoSymbolFor(coKeyOf(co));
  const from=new Date().toISOString().slice(0,10);
  const to=new Date(Date.now()+150*864e5).toISOString().slice(0,10);
  try{
    const r=await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&symbol=${encodeURIComponent(sym)}&token=${key}`,{signal:AbortSignal.timeout(8000)});
    const j=await r.json();
    const next=((j&&j.earningsCalendar)||[]).map(e=>e&&e.date).filter(Boolean).sort()[0];
    if(next && co===target){
      target.earningsDate=next;
      if(!target.earningsLabel||target._earnAuto){ target.earningsLabel='Próximos resultados'; target._earnAuto=true; }
      updateEarningsBadge();
    }
  }catch(e){}
}
