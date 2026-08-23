// ─────────────────────────────────────────────────────────────
// Mi posición: precio de compra y P/L por empresa
// ─────────────────────────────────────────────────────────────
// Añade/edita/borra el precio de compra MEDIO desde la cartera (mantiene acciones/fecha si ya existían)
function setCarteraPos(key){
  if(privado()){ alert('Modo privado activado.\n\nDesactívalo (botón «Privado» arriba) para ver o editar tus importes.'); return; }
  const nm=(DB[key]&&DB[key].name)||key, prev=getPositionFor(key)||{};
  const sym=(typeof curSymOf==='function')?curSymOf(key):'';
  const bp=prompt('Precio de compra MEDIO de '+nm+' (en '+sym.trim()+'):\n(deja vacío y pulsa Aceptar para borrar tu posición)', prev.buyPrice||'');
  if(bp===null) return;                                   // canceló
  if(String(bp).trim()===''){ localStorage.removeItem('pos_'+key); if(typeof renderCartera==='function')renderCartera(); return; }
  const p=parseFloat(String(bp).replace(',','.'));
  if(!(p>0)){ alert('Introduce un precio válido.'); return; }
  // Nº de acciones: sin él no hay peso de la posición ni totales de cartera.
  const sh=prompt('Nº de acciones de '+nm+':\n(puedes dejarlo vacío, pero entonces esta posición no cuenta en los totales ni en el peso de la cartera)', prev.shares||'');
  const shares=sh===null?(prev.shares||0):(parseFloat(String(sh).replace(',','.'))||0);
  // Fecha de compra: permite comparar tu rentabilidad con el S&P 500 del mismo periodo.
  const bd=prompt('Fecha de compra (AAAA-MM-DD):\n(opcional — sirve para comparar tu rentabilidad con la del S&P 500 en el mismo periodo)', prev.buyDate||'');
  const buyDate=bd===null?(prev.buyDate||''):String(bd).trim();
  const data=Object.assign({shares:0,buyDate:'',spReturn:0},prev,{buyPrice:p,shares,buyDate});
  try{localStorage.setItem('pos_'+key,JSON.stringify(data));}catch(e){}
  if(typeof renderCartera==='function')renderCartera();
}
function getMiPosicion(){
  try{
    const raw=localStorage.getItem(_posKey());
    return raw?JSON.parse(raw):null;
  }catch(e){return null;}
}
function saveMiPosicion(buyPrice,shares,buyDate,spReturn){
  const data={buyPrice:+buyPrice,shares:+shares,buyDate,spReturn:+spReturn};
  try{localStorage.setItem(_posKey(),JSON.stringify(data));}catch(e){}
  showTab('resumen');
}
function clearMiPosicion(){
  try{localStorage.removeItem(_posKey());}catch(e){}
  showTab('resumen');
}
function openMiPosicionForm(){
  if(privado()){ alert('Modo privado activado.\n\nDesactívalo (botón «Privado» arriba) para ver o editar tus importes.'); return; }
  const pos=getMiPosicion()||{buyPrice:'',shares:'',buyDate:'',spReturn:''};
  document.getElementById('mp-form-buyPrice').value=pos.buyPrice||'';
  document.getElementById('mp-form-shares').value=pos.shares||'';
  document.getElementById('mp-form-buyDate').value=pos.buyDate||'';
  document.getElementById('mp-form-spReturn').value=pos.spReturn||'';
  document.getElementById('mp-form-modal').style.display='flex';
}
function closeMiPosicionForm(){document.getElementById('mp-form-modal').style.display='none';}
function submitMiPosicionForm(){
  const bp=document.getElementById('mp-form-buyPrice').value;
  const sh=document.getElementById('mp-form-shares').value;
  const bd=document.getElementById('mp-form-buyDate').value;
  const sp=document.getElementById('mp-form-spReturn').value||0;
  if(!bp||!sh){alert('Falta precio de compra o número de acciones.');return;}
  saveMiPosicion(bp,sh,bd,sp);
  closeMiPosicionForm();
}
