// ─────────────────────────────────────────────────────────────
// Modo privado: oculta importes en pantalla
// ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
// MODO PRIVADO — para enseñar la web sin enseñar tu dinero
// ══════════════════════════════════════════════════════════════════
// Oculta SOLO lo que es tuyo: precio de compra, nº de acciones, valor de la
// posición, total de la cartera y ganancia en euros. Se siguen viendo las
// rentabilidades en %, los pesos, los precios de mercado y todo el análisis.
const OCULTO='•••';
function privado(){try{return localStorage.getItem('vi_privado')==='1';}catch(e){return false;}}
function mny(txt){return privado()?OCULTO:txt;}      // envuelve un importe en dinero
function togglePrivado(){
  const on=!privado();
  try{localStorage.setItem('vi_privado',on?'1':'0');}catch(e){}
  _paintPrivadoBtn();
  document.documentElement.classList.toggle('privado',on);
  if(typeof renderCartera==='function') renderCartera();
  if(_curView==='analysis'&&typeof showTab==='function'&&typeof curTab!=='undefined'&&curTab) showTab(curTab);
}
function _paintPrivadoBtn(){
  const b=document.getElementById('priv-toggle'); if(!b) return;
  const on=privado();
  b.innerHTML=(typeof svgIcon==='function'?svgIcon(on?'eyeoff':'eye'):'')+'Privado';
  b.classList.toggle('on',on);
  b.title=on
    ? 'Modo privado ACTIVADO: tus importes están ocultos. Pulsa para volver a verlos.'
    : 'Modo privado: oculta tu dinero (coste, acciones, valor y ganancia en €) y deja solo las rentabilidades. Útil para enseñar la web a alguien.';
}
