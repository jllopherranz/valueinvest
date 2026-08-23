// ─────────────────────────────────────────────────────────────
// Gráfico precio vs valor intrínseco y análisis técnico (SMA/RSI)
// ─────────────────────────────────────────────────────────────
async function buildFairValueChart(){
  await ensureChart(); if(typeof Chart==='undefined') return;
  const c=document.getElementById('c-fairvalue'); if(!c) return;
  if(charts.fairvalue){try{charts.fairvalue.destroy();}catch(e){}}
  const gc='rgba(0,0,0,0.06)',tc='#9a958e',cs=curSymG();
  const labels=[...co.years.map(String),...co.pY.map(y=>y+'e')];
  const npe=co.medPER, hist=co.years.length;
  // Valor intrínseco = EPS × PER normal (histórico y proyectado)
  const fv=[...co.eps.map(e=>e!=null?Math.round(e*npe):null),...co.pEPS.map(e=>e!=null?Math.round(e*npe):null)];
  // Precio de mercado reconstruido = PER histórico × EPS; el último punto se ancla al precio de análisis (hoy)
  const mp=co.hPER.map((h,i)=>(h!=null&&co.eps[i]!=null)?Math.round(h*co.eps[i]):null);
  const lastIdx=hist-1; mp[lastIdx]=Math.round(price);
  const mpFull=[...mp,...co.pY.map(()=>null)];
  const overNow=price>fv[lastIdx];
  charts.fairvalue=new Chart(c,{type:'line',data:{labels,datasets:[
    {label:`Valor intrínseco (PER ${Math.round(npe)}x)`,data:fv,borderColor:'#b45309',backgroundColor:'#b4530912',fill:true,tension:.25,pointRadius:0,borderWidth:2,
      segment:{borderDash:ctx=>ctx.p0DataIndex>=lastIdx?[6,4]:undefined}},
    {label:'Precio de mercado',data:mpFull,borderColor:'#2563eb',tension:.25,borderWidth:2.5,spanGaps:false,
      pointRadius:mpFull.map((v,i)=>i===lastIdx?6:0),
      pointBackgroundColor:mpFull.map((v,i)=>i===lastIdx?(overNow?'#dc2626':'#16a34a'):'#2563eb')},
  ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:true,labels:{color:tc,font:{size:10},boxWidth:10,usePointStyle:true,padding:10}},
      tooltip:{callbacks:{label:ctx=>ctx.raw!=null?` ${ctx.dataset.label}: ${cs}${N(ctx.raw)}`:null}}},
    scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:9}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:9},callback:v=>cs+N(v)}}}}});
}

// Histórico diario de cierres (Yahoo) para los indicadores técnicos
async function fetchDailyHistory(ticker,range){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=${range||'1y'}`;
  const parse=d=>{const q=d?.chart?.result?.[0];const c=q?.indicators?.quote?.[0]?.close;return Array.isArray(c)?c.filter(v=>v!=null):null;};
  try{const r=await fetch('https://corsproxy.io/?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});if(r.ok){const p=parse(await r.json());if(p&&p.length)return p;}}catch(e){}
  try{const r=await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});if(r.ok){const w=await r.json();const p=parse(JSON.parse(w.contents||'{}'));if(p&&p.length)return p;}}catch(e){}
  return null;
}
function _sma(a,n){if(!a||a.length<n)return null;let s=0;for(let i=a.length-n;i<a.length;i++)s+=a[i];return s/n;}
function _rsi(a,n){n=n||14;if(!a||a.length<n+1)return null;let g=0,l=0;for(let i=a.length-n;i<a.length;i++){const d=a[i]-a[i-1];if(d>=0)g+=d;else l-=d;}const rs=l===0?100:g/l;return 100-100/(1+rs);}
function computeTechnicals(closes){
  const last=closes[closes.length-1];
  const win=closes.slice(-252);
  const hi52=Math.max(...win),lo52=Math.min(...win);
  return {last,sma50:_sma(closes,50),sma200:_sma(closes,200),rsi:_rsi(closes,14),hi52,lo52,
    fromHigh:(last-hi52)/hi52*100,fromLow:(last-lo52)/lo52*100};
}
async function renderTechnicals(){
  await ensureChart();
  const box=document.getElementById('tech-box'); if(!box) return;
  const key=coKeyOf(co), sym=yfSymbolFor(key,co.ticker);
  let closes=await fetchDailyHistory(sym,'1y');
  // Fallback: si la bolsa local falla, intenta el ADR del catálogo (p.ej. TSM para 2330)
  if((!closes||closes.length<30)){
    const cat=catalogFor(key)||catalogFor(co.ticker);
    const adr=cat&&cat.tv?cat.tv.split(':').pop():null; // "NYSE:TSM" → "TSM"
    if(adr&&adr!==sym){ const c2=await fetchDailyHistory(adr,'1y'); if(c2&&c2.length>=30) closes=c2; }
  }
  const box2=document.getElementById('tech-box');
  if(!box2||coKeyOf(co)!==key) return;                 // el usuario cambió de empresa/pestaña
  if(!closes||closes.length<30){ box2.innerHTML='<span style="color:var(--muted);">No se pudo cargar el histórico de precios de <b>'+sym+'</b> ahora. Reintenta con «Actualizar» o revisa el ticker.</span>'; return; }
  const t=computeTechnicals(closes), cs=curSymG();
  const trend=t.sma200!=null?(t.last>=t.sma200?'alcista':'bajista'):null;
  const trendCol=trend==='alcista'?'#16a34a':trend==='bajista'?'#dc2626':'var(--muted)';
  const cross=(t.sma50!=null&&t.sma200!=null)?(t.sma50>=t.sma200?['Golden cross','#16a34a','media de 50 sesiones por encima de la de 200 → impulso alcista']:['Death cross','#dc2626','media de 50 sesiones por debajo de la de 200 → impulso bajista']):null;
  const rsiTxt=t.rsi==null?'—':t.rsi>=70?'sobrecompra':t.rsi<=30?'sobreventa':'neutral';
  const rsiCol=t.rsi==null?'var(--muted)':t.rsi>=70?'#dc2626':t.rsi<=30?'#16a34a':'#d97706';
  const tile=(lbl,val,col)=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:7px 8px;text-align:center;"><div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">${lbl}</div><div style="font-size:14px;font-weight:700;color:${col||'var(--text)'};">${val}</div></div>`;
  box.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:6px;margin-bottom:10px;">
      ${tile('Máx. 52s',cs+N(Math.round(t.hi52)),'#dc2626')}
      ${tile('Mín. 52s',cs+N(Math.round(t.lo52)),'#16a34a')}
      ${tile('Media 50',t.sma50!=null?cs+N(Math.round(t.sma50)):'—','#7c3aed')}
      ${tile('Media 200',t.sma200!=null?cs+N(Math.round(t.sma200)):'—','#1e3a5f')}
      ${tile('RSI (14)',t.rsi!=null?t.rsi.toFixed(0):'—',rsiCol)}
    </div>
    <div style="font-size:11px;color:var(--sub);line-height:1.6;">
      El precio (<b>${cs}${N(Math.round(t.last))}</b>) está <b style="color:#dc2626;">${Math.abs(t.fromHigh).toFixed(0)}%</b> por debajo de su máximo de 52 semanas
      y <b style="color:#16a34a;">${t.fromLow>=0?'+':''}${t.fromLow.toFixed(0)}%</b> sobre el mínimo.
      ${trend?`Cotiza <b style="color:${trendCol};">${t.last>=t.sma200?'por encima':'por debajo'}</b> de su media de 200 sesiones → tendencia <b style="color:${trendCol};">${trend}</b>.`:''}
      ${cross?` <b style="color:${cross[1]};">${cross[0]}</b> (${cross[2]}).`:''}
      RSI(14) en <b style="color:${rsiCol};">${t.rsi!=null?t.rsi.toFixed(0):'—'}</b> → <b style="color:${rsiCol};">${rsiTxt}</b>.
    </div>`;
}
