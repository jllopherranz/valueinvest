// ─────────────────────────────────────────────────────────────
// Resumen de cartera, panel de hoy y rejilla de múltiplos
// ─────────────────────────────────────────────────────────────
// Rentabilidad del S&P 500 desde cada fecha de compra (para saber si bates al índice)
let _spHist=null;
async function _loadSPHistory(){
  if(_spHist) return _spHist;
  try{
    const c=JSON.parse(localStorage.getItem('vi_sp_hist')||'null');
    if(c&&Date.now()-c.ts<12*3600*1000){_spHist=c.d;return _spHist;}
  }catch(e){}
  const url='https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=10y';
  const parse=d=>{const q=d?.chart?.result?.[0];const t=q?.timestamp,c=q?.indicators?.quote?.[0]?.close;
    if(!Array.isArray(t)||!Array.isArray(c)) return null;
    const out={t:[],c:[]};
    t.forEach((ts,i)=>{if(c[i]!=null){out.t.push(ts);out.c.push(c[i]);}});
    return out.c.length?out:null;};
  for(const wrap of ['https://corsproxy.io/?url=','https://api.allorigins.win/get?url=']){
    try{
      const r=await fetch(wrap+encodeURIComponent(url),{signal:AbortSignal.timeout(9000)});
      if(!r.ok) continue;
      const raw=wrap.includes('allorigins')?JSON.parse((await r.json()).contents||'{}'):await r.json();
      const d=parse(raw);
      if(d){_spHist=d;try{localStorage.setItem('vi_sp_hist',JSON.stringify({d,ts:Date.now()}));}catch(e){}return d;}
    }catch(e){}
  }
  return null;
}
function _spReturnSince(dateStr){
  if(!_spHist||!dateStr) return null;
  const ts=new Date(dateStr).getTime()/1000;
  if(!isFinite(ts)) return null;
  let idx=_spHist.t.findIndex(x=>x>=ts);
  if(idx<0) return null;                       // fecha posterior al último dato
  const from=_spHist.c[idx], to=_spHist.c[_spHist.c.length-1];
  return (from>0)?(to-from)/from*100:null;
}

// Agregados de la cartera (solo posiciones con nº de acciones: sin eso no hay pesos reales)
function portfolioStats(rows){
  const inv=rows.filter(r=>r.m.buyPrice!=null);
  const conValor=inv.filter(r=>r.m.mktValue!=null);
  const totalMkt=conValor.reduce((a,r)=>a+r.m.mktValue,0);
  const totalCost=conValor.reduce((a,r)=>a+(r.m.costValue||0),0);
  const pnl=totalMkt-totalCost;
  const pnlPct=totalCost>0?pnl/totalCost*100:null;
  const wAvg=(sel)=>{
    let w=0,acc=0;
    conValor.forEach(r=>{const v=sel(r.m); if(v==null) return; w+=r.m.mktValue; acc+=v*r.m.mktValue;});
    if(w>0) return acc/w;
    // sin acciones guardadas: media simple de lo invertido, para no dejarlo en blanco
    const vals=inv.map(r=>sel(r.m)).filter(v=>v!=null);
    return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
  };
  // Concentración por sector y posición
  const bySector={};
  conValor.forEach(r=>{const s=sectorBucket(r.co.key);bySector[s]=(bySector[s]||0)+r.m.mktValue;});
  const sectors=Object.entries(bySector).map(([n,v])=>({n,v,pct:totalMkt>0?v/totalMkt*100:0}))
    .sort((a,b)=>b.v-a.v);
  const top=conValor.map(r=>({key:r.co.key,name:r.co.name,color:r.co.color,pct:totalMkt>0?r.m.mktValue/totalMkt*100:0}))
    .sort((a,b)=>b.pct-a.pct);
  // Comparación con el S&P 500 desde tus fechas de compra
  let spW=null;
  {
    let w=0,acc=0;
    inv.forEach(r=>{
      const p=r.m.pos||{};
      const sp=(p.buyDate?_spReturnSince(p.buyDate):null) ?? (p.spReturn?+p.spReturn:null);
      if(sp==null) return;
      const peso=r.m.costValue||1; w+=peso; acc+=sp*peso;
    });
    if(w>0) spW=acc/w;
  }
  return {inv,conValor,totalMkt,totalCost,pnl,pnlPct,
    mdsW:wAvg(m=>m.mds), cagrW:wAvg(m=>m.cagr5), roicW:wAvg(m=>m.roic5),
    sinAcciones:inv.filter(r=>!r.m.shares).length,
    sinCambio:inv.filter(r=>r.m.shares&&!r.m.fxOk).map(r=>r.m.cur),
    conFecha:inv.filter(r=>r.m.pos&&r.m.pos.buyDate).length, spHistOk:!!_spHist,
    sectors, top, spW};
}

function renderPortfolioSummary(){
  const el=document.getElementById('cartera-summary'); if(!el) return;
  const rows=getAllPortfolioCompanies().map(co=>({co,m:carteraMetrics(co)}));
  const st=portfolioStats(rows);
  const bc=baseCur();
  const col=v=>v==null?'var(--muted)':v>=0?'var(--green)':'var(--red)';
  const pct=(v,d=1)=>v==null?'—':((v>=0?'+':'')+v.toFixed(d)+'%');
  const tile=(lbl,val,sub,c)=>`<div class="pf-tile"><div class="pf-lbl">${lbl}</div>`
    +`<div class="pf-val" style="color:${c||'var(--text)'};">${val}</div>`
    +`<div class="pf-sub">${sub||''}</div></div>`;

  const sinPos=st.inv.length===0;
  const tiles=sinPos
    ? `<div style="grid-column:1/-1;font-size:11.5px;color:var(--sub);padding:6px 2px;">
         Aún no has guardado ninguna posición. Pulsa <b>«+ coste»</b> en cualquier empresa para indicar tu
         precio medio de compra y el número de acciones — a partir de ahí verás aquí el valor de tu cartera,
         la ganancia, el peso de cada posición y si bates al S&amp;P 500.</div>`
    : (privado()
        ? tile('Posiciones abiertas', String(st.inv.length), 'modo privado: importes ocultos')
        : tile('Valor de la cartera', st.totalMkt>0?fmtBase(st.totalMkt,0):'—',
               st.totalMkt>0?('coste '+fmtBase(st.totalCost,0))
                            :(st.sinCambio.length?'falta el tipo de cambio':'falta el nº de acciones')))
     +tile('Ganancia / pérdida', privado()?pct(st.pnlPct):(st.totalMkt>0?fmtBase(st.pnl,0):'—'),
           privado()?'sobre el coste':pct(st.pnlPct), col(st.pnl))
     +tile('vs S&P 500', st.spW==null?'—':pct(st.pnlPct!=null&&st.spW!=null?st.pnlPct-st.spW:null),
           st.spW!=null?'S&P '+pct(st.spW)+' en el mismo periodo'
             :(st.conFecha===0?'añade la fecha de compra':(st.spHistOk?'—':'no se pudo cargar el S&P 500')),
           col(st.pnlPct!=null&&st.spW!=null?st.pnlPct-st.spW:null))
     +tile('Margen de seguridad', pct(st.mdsW,0), 'medio ponderado · próx. año', col(st.mdsW))
     +tile('Retorno esperado 5Y', st.cagrW==null?'—':pct(st.cagrW,0)+'/año', 'ponderado por peso',
           st.cagrW==null?null:(st.cagrW>=15?'var(--green)':st.cagrW>=8?'var(--amber)':'var(--red)'))
     +tile('ROIC medio', st.roicW==null?'—':st.roicW.toFixed(0)+'%', 'calidad del conjunto',
           st.roicW==null?null:(st.roicW>=15?'var(--green)':st.roicW>=10?'var(--amber)':'var(--red)'));

  // ── Concentración: sectores y mayores posiciones, con avisos ──
  const PAL=['#1e3a5f','#2563eb','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed','#9a958e'];
  const avisos=[];
  if(st.top[0]&&st.top[0].pct>25) avisos.push(`<b>${st.top[0].name}</b> pesa el ${st.top[0].pct.toFixed(0)}% de la cartera`);
  if(st.sectors[0]&&st.sectors[0].pct>40) avisos.push(`el sector <b>${st.sectors[0].n}</b> pesa el ${st.sectors[0].pct.toFixed(0)}%`);
  if(st.sinAcciones>0) avisos.push(`${st.sinAcciones} posición(es) sin nº de acciones: no cuentan en los totales`);
  if(st.sinCambio.length) avisos.push(`sin tipo de cambio ${[...new Set(st.sinCambio)].join('/')}→${bc}: esas posiciones quedan fuera de los totales`);
  if(fxStale()) avisos.push(`el tipo de cambio no es de hoy (último disponible: ${new Date(_fxTs).toLocaleDateString('es-ES')})`);
  const conc=st.totalMkt>0?`
    <div class="pf-conc">
      <div class="pf-conc-t">Concentración por sector</div>
      <div class="pf-bar">${st.sectors.map((s,i)=>`<div style="width:${s.pct}%;background:${PAL[i%PAL.length]};" title="${s.n}: ${s.pct.toFixed(1)}%"></div>`).join('')}</div>
      <div class="pf-leg">${st.sectors.map((s,i)=>`<span><i style="background:${PAL[i%PAL.length]};"></i>${s.n} ${s.pct.toFixed(0)}%</span>`).join('')}</div>
      <div class="pf-conc-t" style="margin-top:9px;">Mayores posiciones</div>
      <div class="pf-leg">${st.top.slice(0,5).map(t=>`<span><i style="background:${t.color};"></i>${t.key} ${t.pct.toFixed(0)}%</span>`).join('')}</div>
    </div>`:'';
  const avisoHtml=avisos.length?`<div class="pf-warn">⚠ ${avisos.join(' · ')}</div>`:'';

  el.innerHTML=`<div class="pf-head">
      <div class="dash-sec-title" style="margin:0;">Resumen de mi cartera</div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:9.5px;color:var(--muted);font-weight:600;">Divisa base</span>
        <select class="pf-cur" onchange="setBaseCur(this.value)">
          ${['EUR','USD','CAD','GBP'].map(c=>`<option value="${c}"${c===bc?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="pf-tiles">${tiles}</div>
    ${conc}${avisoHtml}`;
  renderTodayPanel(rows);
}

// ── «Qué mirar hoy»: las tres listas que de verdad piden una decisión ──
function renderTodayPanel(rows){
  const el=document.getElementById('cartera-today'); if(!el) return;
  const zona=rows.filter(r=>r.m.price!=null&&r.m.price15!=null&&r.m.price<=r.m.price15*1.03)
    .sort((a,b)=>(b.m.mds15??-1e9)-(a.m.mds15??-1e9));
  const caras=rows.filter(r=>r.m.mds!=null&&r.m.mds<-10).sort((a,b)=>(a.m.mds)-(b.m.mds));
  const caidas=rows.filter(r=>r.m.weeklyPct!=null&&r.m.weeklyPct<=-7).sort((a,b)=>a.m.weeklyPct-b.m.weeklyPct);
  const item=(r,txt,c)=>`<a class="today-item" onclick="setView('analysis');setTimeout(()=>{if(DB['${r.co.key}'])switchCo('${r.co.key}');},80);">
      <span class="today-k" style="color:${r.co.color};">${r.co.key}</span>
      <span class="today-n">${r.co.name}</span>
      <span class="today-v" style="color:${c};">${txt}</span></a>`;
  const listas=[
    {t:'En zona de compra',s:'precio ≤ tu entrada para +15% anual',c:'var(--green)',
     items:zona.map(r=>item(r,(r.m.mds15>=0?'+':'')+ (r.m.mds15??0).toFixed(0)+'%','var(--green)')),
     vacio:'Ninguna a precio de entrada hoy.'},
    {t:'Por encima del objetivo',s:'cotizan por encima de tu precio objetivo',c:'var(--red)',
     items:caras.map(r=>item(r,r.m.mds.toFixed(0)+'% MdS','var(--red)')),
     vacio:'Ninguna claramente por encima.'},
    {t:'Caídas de la semana',s:'−7% o más en 5 sesiones',c:'var(--amber)',
     items:caidas.map(r=>item(r,r.m.weeklyPct.toFixed(1)+'%','var(--red)')),
     vacio:'Sin caídas fuertes esta semana.'},
  ];
  el.innerHTML=listas.map(l=>`<div class="today-col">
      <div class="today-t" style="border-color:${l.c};">${l.t}<span>${l.s}</span></div>
      ${l.items.length?l.items.join(''):`<div class="today-empty">${l.vacio}</div>`}
    </div>`).join('');
}

// ── Multiple sliders ──
function renderCarteraMultGrid(){
  const el=document.getElementById('cartera-mult-grid');
  if(!el) return;
  const m=_carteraMultiples;
  el.innerHTML=[
    {id:'per',label:'PER Objetivo',color:'#7c3aed',val:m.per},
    {id:'evf',label:'EV / FCF',color:'#b45309',val:m.evf},
    {id:'eveb',label:'EV / EBITDA',color:'#2563eb',val:m.eveb},
    {id:'evei',label:'EV / EBIT',color:'#16a34a',val:m.evei},
  ].map(x=>`<div style="background:${_dm()?'#161b27':'#f9f8f6'};border-radius:10px;padding:10px 12px;border-top:3px solid ${x.color};">
  <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${x.color};margin-bottom:6px;">${x.label}</div>
  <div style="display:flex;align-items:center;gap:8px;">
    <input type="number" value="${x.val.toFixed(1)}" min="1" max="200" step="0.5"
      style="width:62px;font-size:20px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};border:1.5px solid #e4e0d8;border-radius:7px;text-align:center;padding:4px 0;outline:none;background:#fff;"
      oninput="_carteraMultiples.${x.id}=+this.value;renderCartera()"/>
    <input type="range" min="5" max="80" step="0.5" value="${x.val}"
      style="flex:1;accent-color:${x.color};"
      oninput="_carteraMultiples.${x.id}=+this.value;this.previousElementSibling.value=(+this.value).toFixed(1);renderCartera()"/>
  </div>
</div>`).join('');
}

function resetCarteraMultiples(){
  const s=DB.MSFT||DB[Object.keys(DB)[0]];
  _carteraMultiples={per:s?.medPER||30,evf:s?.medEvFcf||28,eveb:s?.medEvEbitda||22,evei:s?.medEvEbit||26};
  renderCartera();
}
