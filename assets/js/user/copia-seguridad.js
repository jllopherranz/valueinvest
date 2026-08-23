// ─────────────────────────────────────────────────────────────
// Copia de seguridad: exportar/importar los datos del usuario
// ─────────────────────────────────────────────────────────────
// ══ COPIA DE SEGURIDAD / PASAR A OTRO DISPOSITIVO ══
// Los datos (empresas importadas, precios de compra, ajustes) viven en localStorage → son locales
// de este navegador. Esto permite exportar un código y restaurarlo en el móvil.
const _BACKUP_PREFIXES=['vi_import_','pos_','vi_drive_','vi_mults_','vi_yf_','vi_domain_'];
const _BACKUP_KEYS=['vi_watchlist','vi_hidden','finnhub_api_key','fmp_api_key','vi_base_cur'];
function _collectBackup(){
  const out={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i); if(!k) continue;
    // Las 9 empresas de fábrica ya existen en cualquier dispositivo → no las metemos (achica el código).
    // Sus datos de tu Excel se recuperan en el móvil con «Sincronizar con hojas» (los enlaces Drive sí van en la copia).
    if(k.startsWith('vi_import_')&&BUILTIN_KEYS.has(k.slice('vi_import_'.length))) continue;
    if(_BACKUP_KEYS.includes(k)||_BACKUP_PREFIXES.some(p=>k.startsWith(p))) out[k]=localStorage.getItem(k);
  }
  return out;
}
function _encodeBackup(o){return 'VIJLH1:'+btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_');}
function _decodeBackup(s){
  s=String(s||'').replace(/=\r?\n/g,'').replace(/\s+/g,'');   // quita saltos/espacios y soft-breaks del email
  const i=s.indexOf('VIJLH1:'); if(i>=0) s=s.slice(i+7);
  s=s.replace(/-/g,'+').replace(/_/g,'/');                     // base64 url-safe → estándar
  return JSON.parse(decodeURIComponent(escape(atob(s))));
}
function _backupCounts(o){
  const co=Object.keys(o).filter(k=>k.startsWith('vi_import_')).length;
  const pos=Object.keys(o).filter(k=>k.startsWith('pos_')).length;
  return {co,pos};
}
function applyBackup(str){
  let o; try{o=_decodeBackup(str);}catch(e){ alert('El código de copia no es válido. Cópialo entero (empieza por VIJLH1:).'); return; }
  const n=Object.keys(o).length; if(!n){ alert('La copia está vacía.'); return; }
  const c=_backupCounts(o);
  if(!confirm('Restaurar '+c.co+' empresa(s) y '+c.pos+' precio(s) de compra en este dispositivo.\nSe combinará con lo que ya tengas. ¿Continuar?')) return;
  Object.entries(o).forEach(([k,v])=>{try{localStorage.setItem(k,v);}catch(e){}});
  alert('✅ Copia restaurada. Recargando…');
  location.reload();
}
function copyBackupCode(){
  const ta=document.getElementById('backup-export-ta'); if(!ta) return;
  ta.select();
  (navigator.clipboard?navigator.clipboard.writeText(ta.value):Promise.reject())
    .then(()=>{const b=document.getElementById('backup-copy-btn');if(b){b.textContent='✅ Copiado';setTimeout(()=>b.textContent='📋 Copiar código',1800);}})
    .catch(()=>{try{document.execCommand('copy');}catch(e){}});
}
function restoreFromFile(input){
  const f=input.files&&input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ applyBackup(String(r.result||'')); };
  r.readAsText(f);
}
function downloadBackup(){
  const code=_encodeBackup(_collectBackup());
  const blob=new Blob([code],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='valueinvest-backup-'+new Date().toISOString().slice(0,10)+'.txt';
  document.body.appendChild(a);a.click();a.remove();
}
function openBackupModal(){
  const data=_collectBackup(), code=_encodeBackup(data), c=_backupCounts(data);
  let m=document.getElementById('backup-modal');
  if(!m){ m=document.createElement('div'); m.id='backup-modal'; document.body.appendChild(m); }
  m.style.cssText='display:flex;position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,.55);align-items:center;justify-content:center;padding:16px;';
  m.onclick=e=>{ if(e.target===m) m.style.display='none'; };
  m.innerHTML=`<div style="background:var(--surface);border-radius:16px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1.5px solid var(--border);">
    <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);">
      <div style="font-size:14px;font-weight:700;color:var(--text);">📲 Copia de seguridad · Pasar al móvil</div>
      <button onclick="document.getElementById('backup-modal').style.display='none'" style="border:none;background:var(--surface2);color:var(--sub);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:700;">✕</button>
    </div>
    <div style="padding:14px 20px 18px;">
      <div style="font-size:11px;color:var(--sub);line-height:1.6;margin-bottom:14px;padding:9px 12px;background:${_dm()?'#1a1200':'#fffbeb'};border:1px solid #f59e0b;border-radius:9px;">
        ⚠️ Tus datos se guardan <b>solo en este navegador</b> (no hay nube). Para verlos en el móvil: <b>1)</b> copia el código de abajo, <b>2)</b> envíatelo (WhatsApp, email…), <b>3)</b> ábrelo en el móvil y pégalo en «Restaurar».
      </div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--blue);margin-bottom:6px;">1 · Exportar (${c.co} empresas · ${c.pos} precios de compra)</div>
      <textarea id="backup-export-ta" readonly style="width:100%;height:80px;font-size:10px;font-family:monospace;padding:8px;border:1.5px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);resize:vertical;outline:none;">${code}</textarea>
      <div style="display:flex;gap:8px;margin:8px 0 18px;flex-wrap:wrap;">
        <button id="backup-copy-btn" onclick="copyBackupCode()" style="flex:1;min-width:140px;padding:9px;border:none;background:#7c3aed;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">📋 Copiar código</button>
        <button onclick="downloadBackup()" style="flex:1;min-width:140px;padding:9px;border:1px solid var(--border);background:var(--surface2);color:var(--text);border-radius:8px;cursor:pointer;font-weight:600;">⬇️ Descargar archivo</button>
      </div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--green);margin-bottom:6px;">2 · Restaurar en este dispositivo</div>
      <textarea id="backup-import-ta" placeholder="Pega aquí el código que copiaste en el otro dispositivo (empieza por VIJLH1:)" style="width:100%;height:70px;font-size:10px;font-family:monospace;padding:8px;border:1.5px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);resize:vertical;outline:none;"></textarea>
      <button onclick="applyBackup(document.getElementById('backup-import-ta').value)" style="width:100%;margin-top:8px;padding:10px;border:none;background:#16a34a;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">♻️ Restaurar del código pegado</button>
      <div style="text-align:center;font-size:10px;color:var(--muted);margin:8px 0;">— o, si te lo enviaste como archivo —</div>
      <label style="display:block;text-align:center;padding:9px;border:1.5px dashed var(--border);border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;color:#2563eb;">📄 Restaurar desde archivo .txt
        <input type="file" accept=".txt,text/plain" onchange="restoreFromFile(this)" style="display:none;"/>
      </label>
    </div>
  </div>`;
  m.style.display='flex';
}
