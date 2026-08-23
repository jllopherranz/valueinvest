// ─────────────────────────────────────────────────────────────
// Caché del último precio conocido por empresa
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// LIVE PRICE — Multi-source + BUG FIX: re-render tras precio en vivo
// ═══════════════════════════════════════════════════════════════════
let _priceInterval=null,_lastPriceTs=0;
let _priceLive=false; // ¿el precio en vivo (o fallback tras error) ya está resuelto para la empresa actual?
const _priceCache={};
// Persistencia del último precio live conocido: evita que, si Finnhub no carga,
// la valoración caiga al precio hardcodeado obsoleto (NVDA $111 vs real ~$195 → múltiplos irreales).
function _saveLastPx(key,px){ if(key&&px>0){try{localStorage.setItem('vi_lastpx_'+key,JSON.stringify({px:+px,ts:Date.now()}));}catch(e){}} }
function _lastKnownPrice(key){
  try{const o=JSON.parse(localStorage.getItem('vi_lastpx_'+key)||'null'); if(o&&o.px>0) return o.px;}catch(e){}
  return (DB[key]&&DB[key].price)||0;
}
