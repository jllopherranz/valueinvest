// ─────────────────────────────────────────────────────────────
// Render de la lista de seguimiento y su modal de pre-análisis
// ─────────────────────────────────────────────────────────────
async function promoteToAnalysis(id){
  if(DB[id]){setView('analysis');setTimeout(()=>switchCo(id),60);return;}
  const e=getWatchlist().find(x=>x.id===id); if(!e) return;
  if(!confirm('Promover “'+(e.name||id)+'” al análisis profundo.\n\nSe traerán sus cuentas anuales (Finnhub/SEC) y se creará una ficha completa (DCF, proyecciones, veredicto…).\nSon DATOS AUTOMÁTICOS: para máxima precisión, luego puedes importar tu hoja TIKR encima.\n\n¿Continuar?')) return;
  const rows=await fetchAnnualFinancials(e.fhTicker||e.ticker||id);
  if(!rows){alert('No se pudieron traer las cuentas de '+id+'.\nFinnhub sólo cubre as-reported de la SEC (típicamente valores US). Para no-US, importa tu hoja TIKR.');return;}
  const imp=buildImportFromFinancials(rows,e);
  if(!imp){alert('Las cuentas de '+id+' no traen suficientes campos para montar la ficha. Importa tu hoja TIKR.');return;}
  localStorage.setItem('vi_import_'+id,JSON.stringify(imp));
  hydrateImportedIntoDB();
  if(typeof computeMediansFor==='function'&&DB[id]&&imp.hEvF&&imp.hEvF.length) computeMediansFor(DB[id]);
  if(typeof rebuildCoButtons==='function') rebuildCoButtons();
  saveWatchlist(getWatchlist().filter(x=>x.id!==id));
  setView('analysis');
  setTimeout(()=>{ if(DB[id]) switchCo(id); else alert('No se pudo crear la ficha de '+id+'.'); },90);
}

function _miniDots(axes){
  return '<span style="display:inline-flex;gap:3px;">'+axes.map(a=>
    `<span title="${(a.label+': '+a.note).replace(/"/g,'\'')}" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${_PA_COL[a.light]};"></span>`
  ).join('')+'</span>';
}

function renderWatchlist(){
  _seedWatchlist();
  const tb=document.getElementById('watch-tbody');
  if(!tb) return;
  const wl=getWatchlist();
  if(!wl.length){tb.innerHTML='<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);font-size:12px;">No sigues ninguna empresa todavía. Pulsa “➕ Añadir empresa a seguir”.</td></tr>';return;}
  const ranked=wl.map(e=>({e,inDB:!!DB[e.id],pre:watchPre(e)}))
    .sort((a,b)=>((b.pre?b.pre.score:-1)-(a.pre?a.pre.score:-1)));
  tb.innerHTML=ranked.map(({e,inDB,pre})=>{
    const co=inDB?DB[e.id]:null;
    const isYoung=e.young||(pre&&pre.young);
    const logoUrl=logoUrlFor(e.id);
    const verdict=pre?pre.verdict:'—', vcolor=pre?pre.color:'#9a958e', score=pre?pre.score:null;
    const sector=e.sector||(co&&co.sector)||'';
    return `<tr style="border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">
      <td style="padding:9px 10px;">
        <div style="display:flex;align-items:center;gap:9px;">
          ${logoUrl?`<img src="${logoUrl}" class="cartera-logo" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/>`:''}
          <div class="cartera-logo-fallback" style="background:#1e3a5f;display:${logoUrl?'none':'flex'};">${e.id.substring(0,2)}</div>
          <div>
            <div class="cartera-co-name">${e.name}${isYoung?` <span class="joven-badge" style="vertical-align:middle;">JOVEN</span>`:''}</div>
            <div class="cartera-ticker">${e.ticker}</div>
          </div>
        </div>
      </td>
      <td style="text-align:right;">
        <div class="cartera-price" id="wprice-${e.id}">—</div>
        <div id="wchg-${e.id}" style="font-size:9px;font-weight:700;"></div>
      </td>
      <td style="font-size:10px;color:var(--sub);max-width:220px;">${sector}</td>
      <td style="text-align:center;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
          ${pre?_miniDots(pre.axes):'<span style="font-size:9px;color:var(--muted);">analizando…</span>'}
          ${score!=null?`<span style="font-size:10px;font-weight:600;color:${vcolor};">${score}/100${pre&&pre.source==='finnhub'?' <span style="font-size:7px;color:var(--muted);font-weight:600;">· Finnhub</span>':''}</span>`:''}
        </div>
      </td>
      <td style="text-align:center;"><span style="font-size:10px;font-weight:600;color:${vcolor};background:${vcolor}14;border:1px solid ${vcolor}44;padding:2px 8px;border-radius:8px;white-space:nowrap;">${verdict}</span></td>
      <td style="text-align:center;">
        <div style="display:flex;gap:4px;justify-content:center;">
          ${inDB?`<button class="cartera-action-btn" title="Ver análisis completo" onclick="setView('analysis');setTimeout(()=>switchCo('${e.id}'),60);">📈</button>`
                :`<button class="cartera-action-btn" style="background:#f0fdf4;border-color:#bbf7d0;" title="Promover a análisis profundo (trae cuentas anuales de Finnhub/SEC)" onclick="promoteToAnalysis('${e.id}')">⤴</button>`}
          <button class="cartera-action-btn" title="Detalle del pre-análisis" onclick="showPreAnalysis('${e.id}')">🔎</button>
          ${inDB?'':`<button class="cartera-action-btn" title="Volver a traer datos de Finnhub" onclick="refreshWatchCompany('${e.id}')">↻</button>`}
          <button class="cartera-action-btn red" title="Quitar de seguimiento" onclick="removeWatchCompany('${e.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  setTimeout(_autoFetchWatch,150);
}

function showPreAnalysis(id){
  const e=getWatchlist().find(x=>x.id===id)||{id,name:id};
  const pre=watchPre(e);
  if(!pre){alert('Sin pre-análisis disponible todavía (trayendo datos…).');return;}
  const lc={green:'🟢',amber:'🟡',red:'🔴',gray:'⚪'};
  const rows=pre.axes.map(a=>`<div style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};align-items:flex-start;"><span style="font-size:13px;">${lc[a.light]}</span><div><div style="font-weight:700;font-size:12px;color:${_dm()?'#e2e8f0':'#1a1814'};">${a.label}</div><div style="font-size:11px;color:var(--sub);">${a.note}</div></div></div>`).join('');
  const pros=(pre.pros||[]).map(t=>`<li style="color:#15803d;margin:2px 0;">${t}</li>`).join('');
  const cons=(pre.cons||[]).map(t=>`<li style="color:#b91c1c;margin:2px 0;">${t}</li>`).join('');
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.onclick=ev=>{if(ev.target===ov)ov.remove();};
  ov.innerHTML=`<div style="background:#fff;border-radius:16px;max-width:540px;width:100%;max-height:86vh;overflow:auto;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">
      <div style="font-size:17px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};">🔎 Pre-análisis · ${e.name||id}${pre.young?` <span class="joven-badge">JOVEN</span>`:''}</div>
      <button data-close style="border:none;background:#f0ede8;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <div style="font-size:30px;font-weight:700;color:${pre.color};">${pre.score}<span style="font-size:14px;color:var(--muted);">/100</span></div>
      <span style="font-size:13px;font-weight:600;color:${pre.color};background:${pre.color}14;border:1px solid ${pre.color}44;padding:4px 12px;border-radius:10px;">${pre.verdict}</span>
    </div>
    ${rows}
    ${(pros||cons)?`<div style="margin-top:12px;font-size:11px;"><ul style="list-style:none;padding:0;margin:0;">${pros}${cons}</ul></div>`:''}
    <div style="margin-top:12px;font-size:10px;color:var(--muted);">Cribado por fórmulas sobre datos disponibles. Para decidir de verdad, abre el análisis profundo.</div>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector('[data-close]').onclick=()=>ov.remove();
}

function addWatchCompany(){
  const t=prompt('Ticker de la empresa a seguir (p.ej. IREN, PLTR, ASML):');
  if(!t) return;
  const id=t.trim().toUpperCase();
  const wl=getWatchlist();
  if(wl.some(x=>x.id===id)){alert('Ya está en seguimiento.');return;}
  let name=id, sector='', fhTicker=id, ticker=id;
  if(DB[id]){const c=DB[id];name=c.name;ticker=c.ticker||id;sector=c.sector||'';fhTicker=c.finnhubTicker||c.ticker||id;}
  else{
    const nm=prompt('Nombre de la empresa:',id); if(nm)name=nm.trim();
    const sc=prompt('Sector / tesis breve (opcional):',''); if(sc)sector=sc.trim();
  }
  wl.push({id,name,ticker,fhTicker,sector});
  saveWatchlist(wl);
  renderWatchlist();
  if(getFinnhubKey()) setTimeout(()=>fetchWatchPrices(),200);
}

function removeWatchCompany(id){
  if(!confirm('¿Quitar de seguimiento?')) return;
  saveWatchlist(getWatchlist().filter(x=>x.id!==id));
  renderWatchlist();
}

async function fetchWatchPrices(){
  if(!getFinnhubKey()) return;
  for(const e of getWatchlist()){
    try{
      const p=await _fetchFinnhub(e.fhTicker||e.ticker||e.id);
      if(p&&p.live){ _priceCache[e.id]={...p,ts:Date.now()}; _saveLastPx(e.id,p.live); }
      const el=document.getElementById('wprice-'+e.id);
      if(el&&p&&p.live){
        const cur=curSymOf(e.id);
        el.textContent=cur+(p.live>=1000?Math.round(p.live).toLocaleString('es-ES'):p.live.toFixed(2));
        const ch=document.getElementById('wchg-'+e.id);
        if(ch&&p.changePct!=null){ch.textContent=(p.changePct>=0?'+':'')+p.changePct.toFixed(2)+'%';ch.style.color=p.changePct>=0?'#16a34a':'#dc2626';}
      }
    }catch(err){/* sin precio: se queda en — */}
  }
}
