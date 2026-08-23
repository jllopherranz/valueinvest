// ─────────────────────────────────────────────────────────────
// Panel lateral de la empresa y ficha cualitativa
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// RESUMEN — with new cards: Veredicto Multi-Eje, Reverse DCF, Calidad FCF, Stress Test
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// FICHA EMPRESA — Nuevo bloque visual en Resumen
// ═══════════════════════════════════════════════════════════════════
function rSidebarEmpresa(){
  const coKey=Object.keys(DB).find(k=>DB[k]===co)||'MSFT';
  const f=FICHA[coKey];if(!f) return '';
  const logosSrc=LOGOS[coKey];

  const toggleSection=(id,open=false)=>`
    <div class="sidebar-section">
      <div class="sidebar-toggle" onclick="var b=this.nextElementSibling;b.style.display=b.style.display==='none'?'block':'none';this.querySelector('.sidebar-toggle-arrow').style.transform=b.style.display!=='none'?'rotate(180deg)':'';">
        <span class="sidebar-toggle-title">${id.split('__')[1]}</span>
        <span class="sidebar-toggle-arrow" style="transform:${open?'rotate(180deg)':''}">▾</span>
      </div>
      <div class="sidebar-body" style="display:${open?'block':'none'}">`;

  // Business lines
  const blHtml=f.businessLines.map(bl=>`
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #f5f4f1;">
      <div style="background:${co.color}15;border-radius:6px;padding:3px 7px;font-size:12px;font-weight:600;color:${co.color};flex-shrink:0;">${bl.pct}%</div>
      <div><div style="font-size:11px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};margin-bottom:1px;">${bl.name}</div><div style="font-size:10px;color:var(--muted);line-height:1.45;">${bl.desc}</div></div>
    </div>`).join('');

  // Competitors
  const compHtml=f.subsectors.map(s=>`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:7px 9px;background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:8px;">
      <div style="background:${co.color};color:#fff;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;flex-shrink:0;">${s.rank}</div>
      <div style="flex:1;"><div style="font-size:10px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${s.sector}</div><div style="font-size:9px;color:var(--muted);">${s.share} · ${s.note}</div></div>
    </div>`).join('')+`
    <div style="background:#1e2a3a;border-radius:8px;padding:10px 12px;margin-top:4px;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:5px;">⚔️ Rival principal</div>
      <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px;">${f.rival.name} <span style="font-size:10px;font-weight:400;color:rgba(255,255,255,.45);">${f.rival.ticker}</span></div>
      ${f.rival.why.map(w=>`<div style="font-size:10px;color:rgba(255,255,255,.65);margin-bottom:3px;line-height:1.4;">› ${w}</div>`).join('')}
    </div>`;

  // Catalysts
  const catHtml=f.catalysts.map(c=>`
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <span style="font-size:18px;flex-shrink:0;">${c.icon}</span>
      <div><div style="font-size:11px;font-weight:700;color:${c.color};margin-bottom:2px;">${c.title}</div><div style="font-size:10px;color:var(--muted);line-height:1.5;">${c.text}</div></div>
    </div>`).join('')+`
    <div style="background:#1e2a3a;border-radius:8px;padding:8px 12px;margin-top:2px;">
      <div style="font-size:9px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Riesgos</div>
      <div style="font-size:10px;color:rgba(255,255,255,.65);line-height:1.6;">${f.risks}</div>
    </div>`;

  return`
  <div class="sidebar-panel">
    <div style="background:${co.color};padding:12px 14px;display:flex;align-items:center;gap:10px;">
      <div style="width:44px;height:44px;border-radius:10px;background:var(--surface2);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
        <img src="${logosSrc?.src||''}" onerror="this.src='${logosSrc?.fb||''}'" style="width:32px;height:32px;object-fit:contain;" alt="${co.ticker}"/>
      </div>
      <div>
        <div style="font-size:14px;font-weight:600;color:#fff;line-height:1.1;">${co.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px;">${co.sector}</div>
      </div>
    </div>

    ${co.spinoffNote?`<div style="background:${_dm()?'#1a1200':'#fef3c7'};border-bottom:1.5px solid #f59e0b;padding:10px 14px;font-size:10px;font-weight:700;color:#92400e;line-height:1.5;display:flex;gap:7px;align-items:flex-start;">
      <span style="font-size:14px;flex-shrink:0;"></span>
      <span>${co.spinoffNote}</span>
    </div>`:''}

    ${toggleSection('__¿A qué se dedica?',true)}
      <div style="font-size:11px;color:var(--sub);line-height:1.7;margin-bottom:10px;">${f.descRich}</div>
      ${blHtml}
    </div>

    ${toggleSection('__Posición competitiva',true)}
      ${compHtml}
    </div>

    ${toggleSection('__Catalizadores y riesgos',false)}
      ${catHtml}
    </div>

    <div class="sidebar-section" style="padding:10px 14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <div style="background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Último: ${f.lastQ.label}</div>
          <div style="font-size:11px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${f.lastQ.salesVal}</div>
          <div style="font-size:10px;font-weight:700;color:${f.lastQ.salesYoY>=0?'#16a34a':'#dc2626'};">${f.lastQ.salesYoY>=0?'+':''}${f.lastQ.salesYoY}% ventas</div>
          <div style="font-size:10px;font-weight:700;color:${f.lastQ.epsYoY>=0?'#16a34a':'#dc2626'};">${f.lastQ.epsYoY>=0?'+':''}${f.lastQ.epsYoY}% EPS</div>
        </div>
        <div style="background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Próx: ${f.nextQ.label}</div>
          <div style="font-size:10px;color:var(--sub);line-height:1.4;">${f.nextQ.salesEst} ventas</div>
          <div style="font-size:10px;color:var(--sub);">EPS ${f.nextQ.epsEst}</div>
          <div style="font-size:9px;color:var(--muted);margin-top:2px;">${co.earningsLabel}</div>
        </div>
      </div>
    </div>
  </div>`;
}

function rFichaEmpresa(){return '';} // legacy stub - now handled by rSidebarEmpresa

// ══ MI POSICIÓN — datos guardados en localStorage por ticker ══
function _posKey(){return 'pos_'+(Object.keys(DB).find(k=>DB[k]===co)||'X');}
// Lee la posición de CUALQUIER empresa por su clave (para la tabla de cartera)
function getPositionFor(key){try{const r=localStorage.getItem('pos_'+key);return r?JSON.parse(r):null;}catch(e){return null;}}
