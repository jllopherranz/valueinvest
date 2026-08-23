// ─────────────────────────────────────────────────────────────
// Cotizaciones Yahoo Finance (cierre diario) vía proxy CORS
// ─────────────────────────────────────────────────────────────
// ── Live prices for cartera ──
// Cotización vía Yahoo (precio + % diario + % semanal). Prueba varios proxies CORS.
function _parseYF(data){
  const q=data?.chart?.result?.[0]; if(!q) return null;
  const meta=q.meta;
  let c=meta.regularMarketPrice||meta.previousClose;
  let pc=meta.previousClose||meta.chartPreviousClose;
  const closes=(q.indicators?.quote?.[0]?.close||[]);
  let oldest=closes.find(v=>v!=null);
  // Divisa DECLARADA POR LA FUENTE: es la única forma fiable de saber en qué moneda
  // está el precio (Londres cotiza en peniques, 'GBp' → se pasa a libras).
  let cur=meta.currency||null, div=1;
  if(cur==='GBp'||cur==='ZAc'||cur==='ILA'){ div=100; cur=(cur==='GBp')?'GBP':(cur==='ZAc'?'ZAR':'ILS'); }
  if(div!==1){ c/=div; if(pc) pc/=div; if(oldest) oldest/=div; }
  const dp=pc?(c-pc)/pc*100:0;
  const wp=oldest?(c-oldest)/oldest*100:null;
  return (c>0)?{c,dp,wp,cur,sym:meta.symbol||null,exch:meta.fullExchangeName||meta.exchangeName||null}:null;
}
async function fetchQuoteYF(ticker){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  // 1) corsproxy.io (JSON directo)
  try{
    const r=await fetch('https://corsproxy.io/?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});
    if(r.ok){const d=await r.json();const p=_parseYF(d);if(p)return p;}
  }catch(e){}
  // 2) allorigins (envuelve en .contents)
  try{
    const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});
    if(r.ok){const w=await r.json();const p=_parseYF(JSON.parse(w.contents||'{}'));if(p)return p;}
  }catch(e){}
  return null;
}

// ══════════ GRÁFICO PRECIO vs VALOR INTRÍNSECO + ANÁLISIS TÉCNICO ══════════
function curSymG(){return curSymOf(coKeyOf(co));}
