// ─────────────────────────────────────────────────────────────
// Dashboard: render principal y ticker giratorio
// ─────────────────────────────────────────────────────────────
function renderDashboard(){
  // Tabla empresas
  const tbody=document.getElementById('dash-co-tbody');
  const sorted=[...DASH_COMPANIES].sort((a,b)=>a.name.localeCompare(b.name,'es'));
  if(tbody) tbody.innerHTML=sorted.map(co=>{
    const yf=`https://finance.yahoo.com/quote/${co.ticker}`;
    // Compute objective price from current FCF × 5Y median EV/FCF
    const dbCo=DB[co.key];
    let objActualStr='—';
    if(dbCo&&dbCo.fcf&&dbCo.netDebt&&dbCo.shares){
      const mult=dbCo.med5EvFcf||dbCo.medEvFcf;
      const fairNow=Math.round((dbCo.fcf[9]*mult-dbCo.netDebt[9])/dbCo.shares);
      const cur=curSymOf(co.key);
      objActualStr=cur+(fairNow>=1000?new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(fairNow):fairNow.toFixed(2));
      co._objActual=fairNow;
    }
    return`<tr>
      <td style="min-width:180px;">
        <div style="display:flex;align-items:center;gap:7px;">
          <img src="${LOGOS_DASH[co.key]}" onerror="this.style.display='none'" style="width:24px;height:24px;border-radius:6px;object-fit:contain;background:#f5f4f1;padding:2px;border:1px solid ${co.color}30;flex-shrink:0;"/>
          <div>
            <div style="font-size:10px;font-weight:600;color:${co.color};cursor:pointer;" onclick="setView('analysis');setTimeout(()=>switchCo('${co.key}'),50)">${co.key}</div>
            <div style="font-size:10px;color:var(--sub);">${co.name}</div>
          </div>
        </div>
      </td>
      <td style="text-align:right;font-size:13px;font-weight:600;" id="dp-${co.key}">
        <span style="opacity:.4;font-size:10px;">cargando...</span>
      </td>
      <td style="text-align:right;font-weight:700;font-size:11px;" id="dc-${co.key}">—</td>
      <td style="text-align:right;font-weight:700;font-size:11px;" id="dw-${co.key}">—</td>
      <td style="text-align:right;font-size:12px;font-weight:700;color:#1e3a5f;">${objActualStr}</td>
      <td style="text-align:right;font-weight:700;font-size:11px;" id="dmds-${co.key}">—</td>
      <td style="text-align:center;">
        <span class="verd-pill-sm" style="background:${co.vc}15;color:${co.vc};">${co.verdict}</span>
      </td>
      <td style="text-align:center;">
        <div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap;">
          <a href="${yf}" target="_blank" class="dash-drive-btn">YF</a>
          ${co.drive?`<a href="${co.drive}" target="_blank" class="dash-drive-btn">📄 Excel</a>`:''}
        </div>
      </td>
    </tr>`;
  }).join('');

  // Yahoo Finance news links
  const yfEl=document.getElementById('dash-yf-links');
  if(yfEl) yfEl.innerHTML=DASH_COMPANIES.map(co=>`
    <a href="https://finance.yahoo.com/quote/${co.ticker}/news/" target="_blank"
       style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:#f5f4f1;border:1px solid var(--border);text-decoration:none;color:var(--sub);font-size:11px;font-weight:700;"
       onmouseover="this.style.background='#e8e5de'" onmouseout="this.style.background='#f5f4f1'">
      <img src="${LOGOS_DASH[co.key]}" onerror="this.style.display='none'" style="width:18px;height:18px;border-radius:4px;object-fit:contain;"/>
      <span style="color:${co.color};">${co.key}</span>
    </a>`).join('');

  // Earnings calendar
  const now=new Date();
  const earnEl=document.getElementById('dash-earnings-list');
  if(earnEl){
    const upcoming=DASH_COMPANIES.map(co=>({date:co.earnings,title:co.key+' — '+co.elbl,co}))
      .filter(e=>new Date(e.date)>=now).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,8);
    earnEl.innerHTML=upcoming.map(e=>{
      const d=new Date(e.date);
      const diff=Math.ceil((d-now)/(86400000));
      const urg=diff<=7?'background:#fef2f2;color:#dc2626;':diff<=30?'background:#fffbeb;color:#d97706;':'background:#f5f4f1;color:var(--muted);';
      return`<div class="ev-item">
        <div class="ev-datebox"><div class="ev-day">${d.getDate()}</div><div class="ev-mon">${d.toLocaleString('es-ES',{month:'short'})}</div></div>
        <div style="flex:1;">
          <div class="ev-title"><span style="color:${e.co.color};font-weight:600;">${e.co.key}</span> — ${e.co.elbl}</div>
          <div class="ev-sub">Resultados trimestrales</div>
        </div>
        <span style="font-size:8px;padding:2px 6px;border-radius:7px;font-weight:700;${urg}">${diff===0?'HOY':diff===1?'MAÑ':diff+'d'}</span>
      </div>`;
    }).join('');
  }

  // Macro calendar
  const macroEl=document.getElementById('dash-macro-list');
  if(macroEl){
    const upMacro=MACRO_CAL.filter(e=>new Date(e.date)>=now).slice(0,7);
    macroEl.innerHTML=upMacro.map(e=>{
      const d=new Date(e.date);
      const diff=Math.ceil((d-now)/(86400000));
      const urg=diff<=7?'background:#fef2f2;color:#dc2626;':diff<=30?'background:#fffbeb;color:#d97706;':'background:#f5f4f1;color:var(--muted);';
      const icons={'#1e3a5f':'🏦','#dc2626':'📈','#d97706':'👷','#7c3aed':'📋'};
      return`<div class="ev-item">
        <div class="ev-datebox"><div class="ev-day">${d.getDate()}</div><div class="ev-mon">${d.toLocaleString('es-ES',{month:'short'})}</div></div>
        <div style="flex:1;">
          <div class="ev-title">${icons[e.c]||'📋'} ${e.title}</div>
          <div class="ev-sub">${e.sub}</div>
        </div>
        <span style="font-size:8px;padding:2px 6px;border-radius:7px;font-weight:700;${urg}">${diff===0?'HOY':diff===1?'MAÑ':diff+'d'}</span>
      </div>`;
    }).join('');
  }
  renderStyleCompare();   // comparador Growth vs Value de la cartera
}


function _startTicker(){
  const outer=document.getElementById('mkt-outer');
  if(!outer||outer.dataset.ticking) return;
  outer.dataset.ticking='1';
  const items=[...outer.children];
  items.forEach(item=>{
    const clone=item.cloneNode(true);
    clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    clone.removeAttribute('id');
    outer.appendChild(clone);
  });
  // scrollWidth fuerza el reflow de forma síncrona → el layout ya está calculado aquí.
  // (No usamos requestAnimationFrame: no se dispara si la pestaña carga en segundo plano.)
  const w=outer.scrollWidth/2;
  const speed=w>0?Math.max(25,Math.round(w/80)):40;
  outer.style.animationDuration=speed+'s';
  outer.classList.add('ticking');
}
