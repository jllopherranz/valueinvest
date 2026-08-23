// ─────────────────────────────────────────────────────────────
// Tabla de cartera: orden, filtros, veredicto y render de filas
// ─────────────────────────────────────────────────────────────
// ── Estado de la tabla: orden y filtro (se recuerdan) ──
let _cartSort=(()=>{try{return JSON.parse(localStorage.getItem('vi_cart_sort')||'null')||{col:'cagr5',dir:-1};}catch(e){return{col:'cagr5',dir:-1};}})();
let _cartFilter=(()=>{try{return localStorage.getItem('vi_cart_filter')||'all';}catch(e){return 'all';}})();
let _cartCalidad=(()=>{try{return localStorage.getItem('vi_cart_calidad')==='1';}catch(e){return false;}})();
const CART_COLS=14;   // nº de columnas de la tabla (para los colspan)

function sortCartera(col){
  if(_cartSort.col===col) _cartSort.dir=-_cartSort.dir;
  else _cartSort={col,dir:(col==='name'?1:-1)};
  try{localStorage.setItem('vi_cart_sort',JSON.stringify(_cartSort));}catch(e){}
  renderCartera();
}
function filterCartera(f){
  _cartFilter=f;
  try{localStorage.setItem('vi_cart_filter',f);}catch(e){}
  renderCartera();
}
function toggleCalidad(){
  _cartCalidad=!_cartCalidad;
  try{localStorage.setItem('vi_cart_calidad',_cartCalidad?'1':'0');}catch(e){}
  renderCartera();
}

// Veredicto (COMPRAR/MANTENER/EVITAR) de CUALQUIER empresa sin salir de la cartera.
// calcVerdict() lee el estado global (co, price, múltiplos objetivo); aquí se sustituye
// temporalmente y se restaura SIEMPRE, para no alterar la pestaña Análisis.
function verdictFor(key,px){
  const d=DB[key];
  if(!d||!d.fcf||!d.roic||!d.netDebt||!d.eps) return null;
  const _co=co,_px=price,_evf=tEVF,_per=tPER,_eve=tEVE,_evei=tEVEI,_ps=_projSource,_ed=_isEdited;
  try{
    co=d; price=px||d.price||0; _projSource='sheet'; _isEdited=false;
    applyCompanyMults(d);
    return calcVerdict();
  }catch(e){ return null; }
  finally{ co=_co; price=_px; tEVF=_evf; tPER=_per; tEVE=_eve; tEVEI=_evei; _projSource=_ps; _isEdited=_ed; }
}

function renderCartera(){
  if(!_carteraMultiplesReady){
    const s=DB.MSFT||DB[Object.keys(DB)[0]];
    if(s) _carteraMultiples={per:s.medPER||30,evf:s.medEvFcf||28,eveb:s.medEvEbitda||22,evei:s.medEvEbit||26};
    _carteraMultiplesReady=true;
  }
  const tbody=document.getElementById('cartera-tbody');
  if(!tbody) return;
  const table=document.getElementById('cartera-table');
  if(table) table.classList.toggle('show-cal',_cartCalidad);
  const companies=getAllPortfolioCompanies();
  const fmt=(v,k)=>v!=null?(curSymOf(k)+(Math.abs(v)>=1000?new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(v)):v.toFixed(2))):'—';
  const sp=(v,dec=1)=>v!=null?((v>=0?'+':'')+v.toFixed(dec)+'%'):'—';
  const retCol=v=>v==null?'#9a958e':v>=15?'#16a34a':v>=8?'#d97706':'#dc2626';
  const mdsCol=v=>v==null?'#9a958e':v>=15?'#16a34a':v>=0?'#d97706':'#dc2626';
  const nz=v=>v==null?-1e9:v;

  let ranked=companies.map(co=>({co,m:carteraMetrics(co)}));
  // Veredicto por empresa (score 0-100) — se calcula una vez por render
  ranked.forEach(r=>{ const v=verdictFor(r.co.key,r.m.price); r.v=v; r.m.score=v?v.totalScore:null; r.m.verdict=v?v.verdict:null; r.m.vcolor=v?v.verdictColor:null; });

  // ── Filtros rápidos ──
  const FILTERS={
    all:  {lbl:'Todas',      test:()=>true},
    zona: {lbl:'En zona de compra', test:r=>r.m.price!=null&&r.m.price15!=null&&r.m.price<=r.m.price15*1.03},
    comprar:{lbl:'Veredicto COMPRAR', test:r=>r.m.verdict==='COMPRAR'},
    mds:  {lbl:'MdS > 15%',  test:r=>r.m.mds!=null&&r.m.mds>=15},
  };
  if(!FILTERS[_cartFilter]) _cartFilter='all';
  const hidden=ranked.filter(r=>!FILTERS[_cartFilter].test(r)).length;
  ranked=ranked.filter(r=>FILTERS[_cartFilter].test(r));

  // ── Orden ──
  const SORTV={
    name:r=>r.co.name||r.co.key, price:r=>nz(r.m.price), retPct:r=>nz(r.m.retPct),
    weeklyPct:r=>nz(r.m.weeklyPct), mds:r=>nz(r.m.mds), mds15:r=>nz(r.m.mds15),
    cagr5:r=>nz(r.m.cagr5), peg:r=>r.m.peg==null?1e9:r.m.peg, score:r=>nz(r.m.score),
    roic5:r=>nz(r.m.roic5), fcfM:r=>nz(r.m.fcfM), ndEbitda:r=>r.m.ndEbitda==null?1e9:r.m.ndEbitda, salesG5:r=>nz(r.m.salesG5),
  };
  const getv=SORTV[_cartSort.col]||SORTV.cagr5;
  ranked.sort((a,b)=>{
    const x=getv(a),y=getv(b);
    if(typeof x==='string') return _cartSort.dir*x.localeCompare(y,'es');
    return _cartSort.dir*(x-y);
  });
  _paintSortIndicators();

  // Peso de cada posición sobre el total invertido (solo con nº de acciones guardado)
  const totalMkt=ranked.reduce((a,r)=>a+(r.m.mktValue||0),0);
  _cartTotal=totalMkt;

  const rowFor=({co,m},gid,open)=>{
    const k=co.key;
    const logoUrl=logoUrlFor(k);
    const inZone=(m.price!=null&&m.price15!=null&&m.price<=m.price15*1.03);
    const dCol=m.dailyPct==null?'#9a958e':m.dailyPct>=0?'#16a34a':'#dc2626';
    const wCol=m.weeklyPct==null?'#9a958e':m.weeklyPct>=0?'#16a34a':'#dc2626';
    const driveUrl=m.imp?.driveUrl||co.drive||localStorage.getItem('vi_drive_'+k)||null;
    // Procedencia del dato: de tu Excel (y cuándo), o estimado por la app
    const org=m.origen==='excel'
      ? `<span class="cart-src ok" title="Datos de tu Excel · importado hace ${m.impAge!=null?m.impAge+' días':'—'}">Excel${m.impAge!=null&&m.impAge>180?' ⚠':''}</span>`
      : m.origen==='estimado'
        ? `<span class="cart-src est" title="Proyecciones estimadas por la app: NO salen de tu Excel">estimado</span>`
        : `<span class="cart-src app" title="Datos de fábrica de la app · aún sin importar tu hoja">sin Excel</span>`;
    const posCell=(()=>{
      if(m.buyPrice){
        const rc=m.retPct==null?'#9a958e':m.retPct>=0?'#16a34a':'#dc2626';
        const peso=(m.mktValue!=null&&totalMkt>0)?(m.mktValue/totalMkt*100):null;
        // En modo privado se ocultan coste, acciones y valor; la rentabilidad y el peso se quedan
        return `<div style="font-size:12px;font-weight:700;color:var(--text);">${mny(fmt(m.buyPrice,k))}</div>`
          +`<div style="font-size:10px;font-weight:700;color:${rc};">${sp(m.retPct)}</div>`
          +(m.mktValue!=null
             ? `<div style="font-size:9px;color:var(--muted);font-weight:600;" title="${privado()?'Peso':(m.shares+' acciones · valor '+fmtBase(m.mktValue)+' · '+peso.toFixed(1)+'%')} de tu cartera">${privado()?'':m.shares+' acc · '+fmtBase(m.mktValue,0)+' · '}<b>${peso.toFixed(0)}%</b></div>`
             : `<div style="font-size:9px;color:var(--amber);font-weight:700;" title="Sin nº de acciones no se puede calcular el peso de la posición">+ nº acciones</div>`);
      }
      return `<span style="font-size:10px;color:#2563eb;font-weight:700;border:1px dashed #2563eb66;border-radius:8px;padding:2px 7px;white-space:nowrap;">+ coste</span>`;
    })();
    const qual=(v,fmtF,good,bad,tip)=>{
      if(v==null) return `<td class="col-cal" style="text-align:right;color:#9a958e;font-size:11px;">—</td>`;
      const c=good(v)?'#16a34a':bad(v)?'#dc2626':'#d97706';
      return `<td class="col-cal" style="text-align:right;font-size:11.5px;font-weight:700;color:${c};" title="${tip}">${fmtF(v)}</td>`;
    };
    return`<tr id="crow-${k}" class="cart-r cart-r-${gid}"${open?'':' style="display:none;"'}>
  <td style="padding:7px 10px;cursor:pointer;" onclick="setView('analysis');setTimeout(()=>{if(DB['${k}'])switchCo('${k}');},80);" title="Abrir análisis de ${co.name}">
    <div style="display:flex;align-items:center;gap:9px;">
      ${logoUrl?`<img src="${logoUrl}" class="cartera-logo" loading="lazy" onerror="this.onerror=null;if(!this.dataset.fb){this.dataset.fb=1;this.src='${logoFallback(k)}';}else{this.style.display='none';this.nextElementSibling.style.display='flex';}"/>`:''}
      <div class="cartera-logo-fallback" style="background:${co.color};display:none;">${k.substring(0,2)}</div>
      <div>
        <div class="cartera-co-name">${co.name}</div>
        <div class="cartera-ticker">${co.ticker}
          <span class="cart-cur${m.curDet?'':' guess'}" onclick="event.stopPropagation();promptListing('${k}')"
                title="Precio y divisa tomados de ${m.yfSym}${m.curDet?' (divisa confirmada por la fuente)':' (divisa deducida del ticker, aún sin confirmar)'} · pulsa para cambiar de bolsa">${m.cur}${m.curDet?'':'?'}</span>
          ${m.escalaMal?`<span class="cart-escala" onclick="event.stopPropagation();promptListing('${k}')"
                title="El precio (${m.yfSym}) es ${m.escala>=1?m.escala.toFixed(1)+' veces mayor':(1/m.escala).toFixed(1)+' veces menor'} que tu objetivo de precio. Suele significar que la cotización es de otra bolsa o de un ADR (que equivale a varias acciones), y entonces el margen de seguridad no vale. Pulsa para elegir la cotización correcta.">⚠ escala</span>`:''}
          ${org}</div>
      </div>
    </div>
  </td>
  <td style="text-align:right;">
    <div class="cartera-price" id="cprice-${k}">${fmt(m.price,k)}</div>
    <div id="cday-${k}" style="font-size:9px;font-weight:700;color:${dCol};">${m.dailyPct!=null?sp(m.dailyPct,2):''}</div>
  </td>
  <td id="cpos-${k}" style="text-align:right;cursor:pointer;" onclick="event.stopPropagation();setCarteraPos('${k}')" title="Pulsa para poner/editar tu precio de compra medio y tus acciones">${posCell}</td>
  <td style="text-align:right;">
    <div id="cweek-${k}" style="font-size:12px;font-weight:600;color:${wCol};">${m.weeklyPct!=null?(m.weeklyPct>=0?'▲':'▼')+sp(m.weeklyPct,1):'—'}</div>
  </td>
  <td style="text-align:right;background:color-mix(in srgb, var(--amber) 10%, var(--surface));">
    <div id="cobjevf-${k}" style="font-size:13px;font-weight:600;color:var(--text);">${fmt(m.objEVF,k)}</div>
    <div id="cmds-${k}" style="font-size:10px;font-weight:600;color:${mdsCol(m.mds)};">${m.mds!=null?sp(m.mds,0)+' MdS':'—'}</div>
    <div id="cprud-${k}" style="font-size:9px;color:var(--muted);font-weight:600;" title="Escenario prudente: mismo objetivo con múltiplos un 20% más bajos">prud. ${m.mdsCons!=null?sp(m.mdsCons,0):'—'}</div>
  </td>
  <td style="text-align:right;">
    <div id="c15-${k}" style="font-size:12px;font-weight:700;color:${inZone?'#16a34a':'var(--text)'};">${fmt(m.price15,k)}</div>
    <div id="cmds15-${k}" style="font-size:10px;font-weight:600;color:${mdsCol(m.mds15)};">${m.mds15!=null?sp(m.mds15,0)+' MdS':'—'}</div>
  </td>
  <td style="text-align:right;">
    <div id="cobj5-${k}" style="font-size:12px;font-weight:700;color:var(--navy);">${fmt(m.obj5,k)}</div>
    <div id="cret-${k}" style="font-size:10px;font-weight:700;color:${retCol(m.cagr5)};">${m.cagr5!=null?sp(m.cagr5,0)+'/año':''}</div>
    <div id="cprud5-${k}" style="font-size:9px;color:var(--muted);font-weight:600;" title="Escenario prudente: múltiplos un 20% más bajos">prud. ${m.cagr5Cons!=null?sp(m.cagr5Cons,0)+'/año':'—'}</div>
  </td>
  <td style="text-align:center;" id="cpeg-${k}">${pegBar(m.peg,m.per,m.g)}</td>
  <td style="text-align:center;">${m.verdict
      ? `<span class="verd-pill-sm" style="background:${m.vcolor}15;color:${m.vcolor};" title="Score ${m.score}/100 — mismo veredicto que la pestaña Análisis">${m.verdict}</span><div style="font-size:9px;color:var(--muted);font-weight:700;margin-top:2px;">${m.score}/100</div>`
      : '<span style="color:#9a958e;font-size:11px;">—</span>'}</td>
  ${qual(m.roic5,v=>v.toFixed(0)+'%',v=>v>=15,v=>v<8,'ROIC medio de los últimos 5 años · >15% excelente, <8% flojo')}
  ${qual(m.fcfM,v=>v.toFixed(0)+'%',v=>v>=15,v=>v<5,'Margen de caja libre del último año · >15% muy bueno')}
  ${qual(m.ndEbitda,v=>v.toFixed(1)+'x',v=>v<1,v=>v>3,'Deuda neta / EBITDA · <1x sólida, >3x apalancada')}
  ${qual(m.salesG5,v=>(v>=0?'+':'')+v.toFixed(0)+'%',v=>v>=10,v=>v<3,'Crecimiento anual de ventas de los últimos 5 años')}
  <td style="text-align:center;" onclick="event.stopPropagation();">
    <div style="display:flex;gap:3px;justify-content:center;align-items:center;">
      ${driveUrl
        ? `<a href="${driveUrl}" target="_blank" rel="noopener" class="cartera-action-btn" title="Abrir tu hoja de cálculo en Drive para comparar" style="text-decoration:none;display:inline-block;">📊</a>`
        : `<button class="cartera-action-btn" title="Añadir enlace de Google Sheets" onclick="promptDriveUrl('${k}')">＋📊</button>`}
      <button class="cartera-action-btn" style="${m.imp?'background:#f0fdf4;border-color:#bbf7d0;':''}" title="${m.imp?('Importada el '+new Date(m.imp.importDate).toLocaleDateString('es-ES')+' · pulsa para reimportar/editar'):'Pendiente de importar · pulsa para importar tu hoja'}" onclick="openImportModal('${k}')">${m.imp?'📂✓':'📂'}</button>
      <button class="cartera-action-btn red" title="${BUILTIN_KEYS.has(k)?'Ocultar empresa (restaurable)':'Eliminar empresa'}" onclick="deleteCompanyFull('${k}')">🗑</button>
    </div>
  </td>
</tr>`;
  };

  // ── Dos listas: lo que TENGO en cartera vs lo que sigo (sin posición abierta) ──
  // Se pliegan pulsando su cabecera; el estado se recuerda en localStorage.
  const invested=ranked.filter(r=>r.m.buyPrice!=null);
  const watched =ranked.filter(r=>r.m.buyPrice==null);
  const grpHtml=(gid,title,sub,rows)=>{
    if(!rows.length) return '';
    const open=carteraGrupoAbierto(gid);
    return `<tr class="cart-grp"><td colspan="${CART_COLS}"><div class="cart-grp-inner" onclick="toggleCarteraGrupo('${gid}')" title="Pulsa para plegar o desplegar esta lista">`
      +`<span class="cart-grp-lead">`
      +`<span class="cart-grp-caret" id="cgc-${gid}">${open?'▾':'▸'}</span>`
      +`<span class="cart-grp-title">${title}</span>`
      +`<span class="cart-grp-count">${rows.length}</span>`
      +`</span>`
      +(sub?`<span class="cart-grp-sub">${sub}</span>`:'')
      +`</div></td></tr>`
      +rows.map(r=>rowFor(r,gid,open)).join('');
  };
  // Rentabilidad media de lo invertido (ponderada por el valor de cada posición)
  let invSub='';
  if(invested.length){
    let w=0,acc=0,simple=[];
    invested.forEach(({m})=>{
      if(m.retPct==null) return;
      simple.push(m.retPct);
      const peso=m.costValue||1;
      w+=peso; acc+=m.retPct*peso;
    });
    if(simple.length){
      const r=w>0?acc/w:simple.reduce((a,b)=>a+b,0)/simple.length;
      invSub=`· rentab. media <b style="color:${r>=0?'#16a34a':'#dc2626'};">${(r>=0?'+':'')+r.toFixed(1)}%</b>`;
    }
  }
  const vacio=`<tr><td colspan="${CART_COLS}" style="text-align:center;padding:26px;color:var(--muted);font-size:12px;">`
    +(hidden?`Ninguna empresa cumple el filtro «${FILTERS[_cartFilter].lbl}». <a href="#" onclick="event.preventDefault();filterCartera('all')" style="color:var(--blue);font-weight:700;">Ver todas</a>`
            :'Aún no hay empresas. Pulsa «Añadir empresa».')+`</td></tr>`;
  tbody.innerHTML=
     (grpHtml('inv','💼 Empresas invertidas','Con precio de compra guardado '+invSub,invested)
     +grpHtml('seg','👀 Empresas en seguimiento','Analizadas, aún sin posición · pon tu coste para pasarlas a invertidas',watched))
    ||vacio;
  _refreshRestoreBtn();
  _paintFilterChips(FILTERS,hidden);
  renderPortfolioSummary();

  // Estado de importación resumido en el botón Sincronizar: check verde si todo OK, aviso si faltan
  const chk=document.getElementById('sync-check');
  const btn=document.getElementById('btn-refresh-imports');
  if(chk){
    const imported=companies.filter(c=>getImportedData(c.key)).map(c=>c.key);
    const pending =companies.filter(c=>!getImportedData(c.key)).map(c=>c.key);
    if(pending.length===0){
      chk.innerHTML=svgIcon('check'); chk.style.color='var(--green)';
      if(btn) btn.title='Todas las empresas usan tus múltiplos del Excel ('+imported.length+'). Pulsa para re-sincronizar desde las hojas.';
    } else {
      chk.innerHTML=svgIcon('alert'); chk.style.color='var(--amber)';
      if(btn) btn.title='Faltan por importar ('+pending.length+'): '+pending.join(', ')+'. Usan mediana 5Y hasta que importes su hoja. Pulsa para sincronizar.';
    }
  }
}

// Flecha de orden en la cabecera pulsada
function _paintSortIndicators(){
  document.querySelectorAll('#cartera-table th[data-sort]').forEach(th=>{
    const on=th.dataset.sort===_cartSort.col;
    th.classList.toggle('sorted',on);
    const ind=th.querySelector('.sort-ind');
    if(ind) ind.textContent=on?(_cartSort.dir>0?'▲':'▼'):'';
  });
}
// Chips de filtro rápido encima de la tabla
function _paintFilterChips(FILTERS,hidden){
  const el=document.getElementById('cartera-filters'); if(!el) return;
  el.innerHTML=Object.keys(FILTERS).map(f=>
    `<button class="cart-chip${f===_cartFilter?' on':''}" onclick="filterCartera('${f}')">${FILTERS[f].lbl}</button>`).join('')
    +`<button class="cart-chip${_cartCalidad?' on':''}" onclick="toggleCalidad()" title="Muestra ROIC, margen de caja, deuda y crecimiento: la calidad del negocio antes que el precio">⚙ Calidad del negocio</button>`
    +(hidden?`<span style="font-size:9.5px;color:var(--muted);font-weight:600;">${hidden} oculta(s) por el filtro</span>`:'');
}


// ══════════════════════════════════════════════════════════════════
// RESUMEN DE CARTERA — las cifras que un inversor mira antes que nada
// ══════════════════════════════════════════════════════════════════
// Sector amplio a partir del texto libre de `sector` (para medir concentración)
const _SECTOR_RULES=[
  [/semicond|chip|gpu|litograf|euv|foundry|wafer/i,'Semiconductores'],
  [/software|cloud|saas|vms|internet|search|social|platform|ia\b|inteligencia/i,'Software / Internet'],
  [/hardware|storage|hdd|device|consumer tech|electr/i,'Hardware / Electrónica'],
  [/ecommerce|retail|consumo|consumer|food|beverage|bebida|lujo|luxury|apparel/i,'Consumo'],
  [/salud|health|pharma|farma|biotech|medical|medic/i,'Salud'],
  [/banco|bank|financ|seguro|insur|asset manage|payment|pago/i,'Financiero'],
  [/energ|oil|gas|petról|petrol|renovable|solar/i,'Energía'],
  [/industri|aero|defen|maquinar|construc|transport|logíst|logist/i,'Industrial'],
  [/telecom|media|entertain|streaming/i,'Telecom / Media'],
  [/inmobil|reit|real estate/i,'Inmobiliario'],
  [/utilit|agua|eléctric|electric/i,'Utilities'],
];
function sectorBucket(key){
  const t=String(sectorOf(key)||(getImportedData(key)||{}).sector||'');
  for(const [re,name] of _SECTOR_RULES) if(re.test(t)) return name;
  return t?'Otros':'Sin clasificar';
}
