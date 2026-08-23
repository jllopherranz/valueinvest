// ─────────────────────────────────────────────────────────────
// Divisa por empresa, símbolos de cotización, tipos de cambio y formato en divisa base
// ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
// DIVISAS — cada empresa cotiza en la suya; los totales necesitan una divisa base
// ══════════════════════════════════════════════════════════════════
const _CUR_BY_SUFFIX={TO:'CAD',V:'CAD',NE:'CAD',AS:'EUR',PA:'EUR',DE:'EUR',F:'EUR',MC:'EUR',MI:'EUR',BR:'EUR',LS:'EUR',VI:'EUR',HE:'EUR',IR:'EUR',
  L:'GBP',SW:'CHF',ST:'SEK',OL:'NOK',CO:'DKK',T:'JPY',HK:'HKD',TW:'TWD',TWO:'TWD',AX:'AUD',SI:'SGD',NS:'INR',BO:'INR',SA:'BRL',MX:'MXN'};
const CUR_SYM={USD:'$',EUR:'€',CAD:'C$',GBP:'£',CHF:'CHF ',JPY:'¥',TWD:'NT$',AUD:'A$',SEK:'kr ',NOK:'kr ',DKK:'kr ',HKD:'HK$',SGD:'S$',INR:'₹',BRL:'R$',MXN:'MX$'};
// ── Cotización de referencia: UN símbolo por empresa decide precio Y divisa ──
// Mezclar listados (p. ej. el ADR en dólares con unos objetivos calculados en euros)
// falsea el margen de seguridad, así que precio y divisa salen siempre del mismo sitio.
function yfSymbolForKey(key){
  let ov=null; try{ov=localStorage.getItem('vi_yf_'+key);}catch(e){}
  if(ov&&ov.trim()) return ov.trim().toUpperCase();
  if(YF_TICKER[key]) return YF_TICKER[key];
  const d=DB[key]||{}, imp=getImportedData(key);
  return yfSymbolFor(key,(imp&&imp.ticker)||d.ticker||key);
}
// Finnhub (gratis) solo cubre bolsas de EE. UU.: si la cotización de referencia lleva
// sufijo de bolsa, NO se pide a Finnhub — devolvería otro valor (u otra empresa) en dólares.
function fhSymbolForKey(key){
  const y=yfSymbolForKey(key);
  return /\.[A-Z]+$/.test(y)?null:y;
}
// Divisa detectada en la última descarga (la que declara Yahoo para ese símbolo)
function detectedCur(key){try{const v=JSON.parse(localStorage.getItem('vi_cur_'+key)||'null');return (v&&v.cur)?v:null;}catch(e){return null;}}
// Devuelve true si la divisa confirmada es NUEVA o distinta de la que se estaba mostrando,
// para poder repintar las etiquetas una sola vez al terminar la descarga.
function setDetectedCur(key,cur,sym){
  if(!cur) return false;
  const antes=detectedCur(key);
  const cambia=!antes||antes.cur!==cur;
  try{localStorage.setItem('vi_cur_'+key,JSON.stringify({cur,sym:sym||null,ts:Date.now()}));}catch(e){}
  return cambia;
}
// Divisa de una empresa: la detectada manda; si aún no hay descarga, se deduce del sufijo.
function curOf(key){
  const det=detectedCur(key);
  if(det&&det.cur&&/^[A-Z]{3}$/.test(det.cur)) return det.cur;   // lo que diga la fuente manda
  const t=String(yfSymbolForKey(key)).toUpperCase();
  const m=t.match(/\.([A-Z]+)$/);
  if(m&&_CUR_BY_SUFFIX[m[1]]) return _CUR_BY_SUFFIX[m[1]];
  if(/^\d{4}$/.test(t)) return 'TWD';                 // código numérico taiwanés
  return 'USD';
}
// Si no tenemos símbolo para esa divisa se muestra el código ISO (mejor que un '$' falso)
function curSymOf(key){const c=curOf(key);return CUR_SYM[c]||(c+' ');}

// Cambiar la bolsa de referencia de una empresa (y con ella su divisa)
// Acciones ordinarias que representa cada ADR (un ADR de TSM = 5 acciones de Taiwán).
// Solo informativo: sirve para explicar por qué los dos precios no coinciden.
const ADR_RATIO={TSM:5,'TSM.US':5,BABA:8,'PDD':4,'INFY':1,'HDB':3};

// Cotizaciones candidatas de una empresa (bolsa local, ADR estadounidense, ticker base…)
function listingCandidates(key){
  const out=[]; const up=String(key).toUpperCase();
  const add=(sym,lbl)=>{ if(!sym) return; const S=String(sym).toUpperCase();
    if(!out.some(o=>o.sym===S)) out.push({sym:S,lbl}); };
  add(yfSymbolForKey(key),'en uso ahora');
  add(YF_LOCAL[up],'bolsa local');
  const cat=catalogFor(key);
  if(cat&&cat.tv) add(cat.tv.split(':').pop(),'ADR / EE. UU.');
  const d=DB[key];
  if(d&&d.ticker) add(String(d.ticker).toUpperCase(),'ticker de la ficha');
  add(up.split('.')[0],'ticker base');
  return out.slice(0,5);
}

// Diálogo de bolsa de referencia: descarga cada candidata y dice CUÁL ENCAJA con tus cuentas.
// El objetivo de precio sale de tu Excel, así que la cotización correcta es la que está en su
// misma escala: si el objetivo es NT$3.000, un precio de $419 (el ADR) no es comparable.
async function promptListing(key){
  const d=DB[key]||{}, nm=d.name||key;
  const actual=yfSymbolForKey(key);
  const cands=listingCandidates(key);
  const _t=(typeof avgTargetsFor==='function')?avgTargetsFor(key):null;
  const obj=(_t&&_t[0]!=null)?_t[0]:null;      // objetivo del próximo año, en la moneda de tus cuentas

  let m=document.getElementById('listing-modal');
  if(!m){
    m=document.createElement('div');
    m.id='listing-modal';
    m.style.cssText='position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
    m.onclick=e=>{ if(e.target===m) m.remove(); };
    document.body.appendChild(m);
  }
  const cerrar="document.getElementById('listing-modal')?.remove()";
  const marco=cuerpo=>`<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:16px;max-width:560px;width:100%;max-height:86vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:15px 18px 11px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="font-size:13.5px;font-weight:700;color:var(--text);">Cotización de referencia · ${nm}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;">De aquí salen el precio y la divisa</div>
        </div>
        <button onclick="${cerrar}" style="border:none;background:var(--surface2);color:var(--sub);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:700;">✕</button>
      </div>
      <div style="padding:13px 18px 17px;">${cuerpo}</div>
    </div>`;
  m.innerHTML=marco('<div style="font-size:11.5px;color:var(--muted);padding:14px 0;text-align:center;">Consultando cotizaciones…</div>');

  // Descarga en paralelo el precio y la divisa de cada candidata
  const datos=await Promise.all(cands.map(async c=>{
    let q=null; try{ q=await fetchQuoteYF(c.sym); }catch(e){}
    return {...c, px:q?q.c:null, cur:q?q.cur:null};
  }));

  const fmtq=x=>x.px==null?'sin datos':((CUR_SYM[x.cur]||(x.cur?x.cur+' ':''))+new Intl.NumberFormat('es-ES',{maximumFractionDigits:x.px>=100?0:2}).format(x.px));
  // Coherencia: cociente entre el precio y el objetivo salido de TUS cuentas
  const ratio=x=>(obj&&x.px)?x.px/obj:null;
  const encaja=x=>{const r=ratio(x);return r!=null&&r>0.25&&r<4;};
  const mejor=datos.filter(x=>x.px!=null).sort((a,b)=>{
    const ra=ratio(a),rb=ratio(b);
    if(ra==null||rb==null) return 0;
    return Math.abs(Math.log(ra))-Math.abs(Math.log(rb));
  })[0];

  const filas=datos.map(x=>{
    const sel=x.sym===actual;
    const r=ratio(x);
    const adr=ADR_RATIO[x.sym];
    const nota=obj==null?'<span style="color:var(--muted);">sin objetivo con el que comparar</span>'
      : x.px==null?'<span style="color:var(--muted);">no se pudo consultar</span>'
      : encaja(x)?'<span style="color:var(--green);font-weight:700;">✓ misma escala que tus objetivos</span>'
      : `<span style="color:var(--red);font-weight:700;">✗ ${r>=1?(r.toFixed(1)+'× por encima'):((1/r).toFixed(1)+'× por debajo')} de tus objetivos</span>`;
    return `<button onclick="aplicarListing('${key}','${x.sym}')" style="width:100%;text-align:left;display:flex;align-items:center;gap:10px;padding:9px 11px;margin-bottom:6px;border-radius:11px;cursor:pointer;
        border:1.5px solid ${sel?'var(--blue)':'var(--border)'};background:${sel?'color-mix(in srgb,var(--blue) 8%,transparent)':'var(--surface2)'};">
      <div style="flex:1;min-width:0;">
        <div style="font-size:12.5px;font-weight:700;color:var(--text);">${x.sym}
          <span style="font-size:8.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-left:5px;">${x.lbl}</span>
          ${sel?'<span style="font-size:8.5px;font-weight:700;color:var(--blue);margin-left:4px;">EN USO</span>':''}</div>
        <div style="font-size:10px;color:var(--sub);margin-top:2px;">${fmtq(x)}${adr?` · 1 ADR = ${adr} acciones`:''}</div>
        <div style="font-size:9.5px;margin-top:2px;">${nota}</div>
      </div>
      <span style="font-size:10px;font-weight:700;color:var(--blue);white-space:nowrap;">${sel?'':'usar ›'}</span>
    </button>`;
  }).join('');

  const ayuda=obj!=null
    ? `<div style="font-size:10.5px;color:var(--sub);line-height:1.6;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:9px 11px;margin-bottom:10px;">
         Tu objetivo de precio, calculado con las cuentas de tu Excel, es
         <b>${curSymOf(key)}${new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(obj))}</b>.
         La cotización correcta es la que está en <b>esa misma moneda y escala</b>${mejor&&encaja(mejor)?` — aquí, <b>${mejor.sym}</b>`:''}.
         Un ADR no vale lo mismo que una acción: cada uno representa varias, así que su precio no es comparable con unos objetivos por acción.
       </div>`
    : `<div style="font-size:10.5px;color:var(--sub);line-height:1.6;margin-bottom:10px;">Elige la bolsa de la que quieres tomar el precio. Debe cotizar en la misma moneda que las cuentas de tu Excel.</div>`;

  m.innerHTML=marco(ayuda+filas+
    `<div style="display:flex;gap:8px;margin-top:4px;">
       <input id="listing-manual" placeholder="…u otro símbolo de Yahoo (ej: 2330.TW)" value="" style="flex:1;font-size:11.5px;padding:7px 10px;border:1px solid var(--border);border-radius:9px;background:var(--surface2);color:var(--text);text-transform:uppercase;"/>
       <button onclick="aplicarListing('${key}',document.getElementById('listing-manual').value)" style="font-size:11px;font-weight:700;padding:7px 14px;border-radius:9px;border:none;background:var(--navy);color:#fff;cursor:pointer;">Usar</button>
     </div>
     <div style="margin-top:8px;"><a href="#" onclick="event.preventDefault();aplicarListing('${key}','auto')" style="font-size:10px;color:var(--muted);">Volver al valor por defecto</a></div>`);
}
// Fija la cotización de referencia elegida y recarga precios
function aplicarListing(key,sym){
  const t=String(sym||'').trim().toUpperCase();
  try{
    if(!t||t==='AUTO') localStorage.removeItem('vi_yf_'+key);
    else localStorage.setItem('vi_yf_'+key,t);
    localStorage.removeItem('vi_cur_'+key);      // la divisa se vuelve a detectar
  }catch(e){}
  document.getElementById('listing-modal')?.remove();
  delete _carteraPrices[key];
  delete _priceCache[key];
  if(typeof renderCartera==='function') renderCartera();
  if(typeof fetchCarteraPrices==='function') fetchCarteraPrices();
  if(_curView==='analysis'&&typeof coKeyOf==='function'&&coKeyOf(co)===key&&typeof fetchLivePrice==='function') fetchLivePrice();
}

// ── Divisa base de la cartera (en la que se suman los totales) ──
function baseCur(){try{return localStorage.getItem('vi_base_cur')||'EUR';}catch(e){return 'EUR';}}
function setBaseCur(c){
  try{localStorage.setItem('vi_base_cur',c);}catch(e){}
  fetchFX().then(()=>{renderCartera();renderPortfolioSummary();});
}
// Tipos de cambio hacia la divisa base. _FX[X] = cuántas unidades de la BASE vale 1 X.
let _FX={}, _fxTs=0;
// Arranque: recupera el último cambio conocido. Si hoy falla la descarga, los totales
// siguen saliendo (con el aviso de que el cambio no es de hoy) en vez de quedarse en blanco.
(function(){try{const c=JSON.parse(localStorage.getItem('vi_fx_'+baseCur())||'null');if(c&&c.r){_FX=c.r;_fxTs=c.ts||0;}}catch(e){}})();
function fxStale(){return _fxTs>0&&(Date.now()-_fxTs)>36*3600*1000;}
function fxRate(cur){
  if(cur===baseCur()) return 1;
  const r=_FX[cur];
  return (r&&isFinite(r)&&r>0)?r:null;
}
function toBase(v,cur){const r=fxRate(cur);return (v==null||r==null)?null:v*r;}
async function fetchFX(){
  const base=baseCur();
  const need=[...new Set(getAllPortfolioCompanies().map(c=>curOf(c.key)))].filter(c=>c!==base);
  const cacheKey='vi_fx_'+base, ttl=6*3600*1000;
  let cached=null;
  try{cached=JSON.parse(localStorage.getItem(cacheKey)||'null');}catch(e){}
  if(cached&&cached.r){ _FX={...cached.r,..._FX}; _fxTs=cached.ts||_fxTs; }   // parte del último cambio conocido
  if(cached&&Date.now()-cached.ts<ttl&&need.every(x=>cached.r&&cached.r[x])) return _FX;
  const out={...(_FX||{})};
  let algo=false;
  await Promise.allSettled(need.map(async cur=>{
    // Yahoo cotiza BASECUR=X como "1 BASE = N CUR" → el factor CUR→BASE es 1/N
    const q=await fetchQuoteYF(base+cur+'=X');
    if(q&&q.c>0){ out[cur]=1/q.c; algo=true; }
  }));
  _FX=out;
  if(algo){ _fxTs=Date.now(); try{localStorage.setItem(cacheKey,JSON.stringify({r:_FX,ts:_fxTs}));}catch(e){} }
  return _FX;
}
// Formato de importes en la divisa base (totales de cartera)
function fmtBase(v,dec){
  if(v==null||!isFinite(v)) return '—';
  if(privado()) return OCULTO;                 // modo privado: nada de importes
  const sym=CUR_SYM[baseCur()]||(baseCur()+' ');
  const a=Math.abs(v);
  const d=dec!=null?dec:(a>=10000?0:a>=100?0:2);
  return sym+new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
}
