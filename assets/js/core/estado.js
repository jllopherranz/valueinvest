// ─────────────────────────────────────────────────────────────
// Estado global de la app + helpers de formato numérico
// ─────────────────────────────────────────────────────────────
// ── STATE ──
let _curView='dash';        // vista activa: 'dash' | 'watch' | 'analysis' (la fija setView)
let co=DB.MSFT,price=368,gr=12,dr=10,tg=3,tEVF=30,tPER=35,tEVE=22,tEVEI=25,ret=15,hor=5;
let simPrice=null,simMode=false;
let BUILTIN_KEYS=new Set(); // claves de empresas de fábrica; el resto son añadidas por el usuario
let HIDDEN=new Set();       // empresas de fábrica ocultadas por el usuario (restaurables)
let _BUILTIN_DB={};         // snapshot de las empresas de fábrica para poder restaurarlas
let _livePrice=null; // always holds the last live-fetched price regardless of sim mode
let isSG,isEM,isTR,isDI,isCX,isWC;
let _isEdited=false; // true cuando el usuario edita la tabla IS → pasa a modo simulación (si no, usa las proyecciones de la hoja tal cual)
let _projSource='sheet'; // 'sheet' = proyecciones de tu hoja · 'auto' = consenso web (FMP / fallback SEC)
let _projManual=false;   // true si el usuario eligió la fuente a mano (no auto-preferir FMP)
let _webProj={};         // key -> {years, rows, isdByYear, src, nA} (consenso de analistas FMP o modelo SEC)
// ¿La empresa actual usa datos ESTIMADOS (añadida sin Excel)? Sus proyecciones NO son de tu hoja.
function isEstimatedCo(c){c=c||co;return !!(c&&c.estimated);}
// Para empresas estimadas: si hay consenso FMP, se prefiere automáticamente (salvo elección manual).
async function _preferFMPIfAvailable(k){
  if(!DB[k]||!isEstimatedCo(DB[k])) return;
  try{
    const w=await ensureWebProj(k);
    if(coKeyOf(co)===k && !_projManual && w && w.rows && w.rows.length && w.src==='fmp' && _projSource!=='auto'){
      _projSource='auto'; recalc(); if(['resumen','valoracion','proyecciones'].includes(curTab)) showTab(curTab);
    }
  }catch(e){}
}
// Banner de aviso: los datos de esta empresa son estimados, no de tu Excel.
function estimatedBanner(){
  if(!isEstimatedCo()) return '';
  const k=coKeyOf(co), w=_webProj[k];
  const usingFMP=(_projSource==='auto'&&w&&w.src==='fmp');
  const src=usingFMP?('consenso de analistas FMP'+(w.nA?' · '+w.nA+' analistas':'')):'estimación manteniendo los márgenes actuales';
  return `<div style="background:${_dm()?'#1a1200':'#fffbeb'};border:1.5px solid #f59e0b;border-radius:10px;padding:9px 13px;margin-bottom:10px;display:flex;gap:9px;align-items:flex-start;">
    <span style="font-size:16px;flex-shrink:0;"></span>
    <div style="font-size:11px;color:${_dm()?'#e3b341':'#92400e'};line-height:1.5;">
      <b>Datos ESTIMADOS — NO son de tu Excel.</b> ${co.name} se añadió con datos automáticos (SEC/Finnhub); las proyecciones y precios objetivo salen de una <b>${src}</b>, no de tus cálculos validados.
      Para una valoración fiable, <b>importa tu hoja de ${co.ticker}</b>${getFMPKey()?'':' (o conecta FMP para usar el consenso de analistas)'}.
    </div>
  </div>`;
}
let curTab='resumen';let charts={};

// ── HELPERS ──
const _dm=()=>document.documentElement.classList.contains('dark');
const N=(v,d=0)=>v==null?'—':Number(v).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const P=v=>Number(v).toFixed(1)+'%';
const cagr=(e,s,y)=>((Math.pow(Math.max(e,0.01)/Math.max(s,0.01),1/y)-1)*100);
const cu=v=>v>0?'#16a34a':v>-15?'#d97706':'#dc2626';
const cbg=v=>v>0?'#f0fdf4':v>-15?'#fffbeb':'#fef2f2';
const pct=(v,ref)=>ref===0?0:((v-ref)/Math.abs(ref)*100);
// mc/ev are in MILLIONS (shares×price) → thresholds: 1e6=T, 1e3=B, else M
// Capitalización/EV en la divisa en la que cotiza la empresa (las cuentas están en esa misma moneda)
const fmtMC=(v,sym)=>{const c=sym!=null?sym:((typeof curSymOf==='function'&&typeof coKeyOf==='function')?curSymOf(coKeyOf(co)):'$');
  return v>=1e6?c+(v/1e6).toFixed(2)+'T':v>=1e3?c+(v/1e3).toFixed(1)+'B':c+N(Math.round(v))+'M';};

function resetIS(){
  _isEdited=false; // volver a las proyecciones de la hoja
  const ebitRatio=co.ebitM[9]/Math.max(co.ebitdaM[9],1);
  // Si hay proyecciones de la hoja, derivamos los % de ELLAS (así la tabla editable cuadra con lo mostrado)
  if(co.pS&&co.pS.length>=5&&co.pEB&&co.pEPS){
    const ebRatio=co.ebitda[9]>0?(co.ebit[9]/co.ebitda[9]):0.85;
    isSG=co.pS.map((s,i)=>+(((s/(i===0?co.sales[9]:co.pS[i-1]))-1)*100).toFixed(1));
    isEM=co.pS.map((s,i)=>+((co.pEB[i]*ebRatio/s)*100).toFixed(1)); // margen EBIT implícito
  }else{
    isSG=[...co.isD.sg];
    isEM=co.isD.em.map(v=>+(v*ebitRatio).toFixed(1));
  }
  isTR=[...co.isD.tr];isDI=[...co.isD.di];isCX=[...co.isD.cx];isWC=[...co.isD.wc];
}
