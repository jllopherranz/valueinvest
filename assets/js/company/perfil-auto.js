// ─────────────────────────────────────────────────────────────
// Ficha automática de empresas nuevas + edición de dominio/logo
// ─────────────────────────────────────────────────────────────
// ── Ficha automática para empresas sin análisis cualitativo escrito a mano ──
// (las 9 de fábrica lo tienen en FICHA; cualquiera que añadas tú, no). En vez de
// dejar el hueco en blanco se construye con la ficha pública de la empresa y con
// lo que dicen SUS PROPIOS NÚMEROS. Queda claro que es automática.
function rPerfilAuto(key,prof){
  const c=DB[key]; if(!c) return '';
  const P=v=>(v==null||!isFinite(v))?'—':((v>=0?'+':'')+v.toFixed(1)+'%');
  const últ=a=>{const v=(a||[]).filter(x=>x!=null&&isFinite(x));return v.length?v[v.length-1]:null;};
  const cagr=(a,n)=>{const v=(a||[]).filter(x=>x!=null&&x>0);
    if(v.length<n+1) return null;
    const fin=v[v.length-1],ini=v[v.length-1-n];
    return ini>0?(Math.pow(fin/ini,1/n)-1)*100:null;};
  const ventas=últ(c.sales), gVentas=cagr(c.sales,5), mgFcf=últ(c.fcfM), roic=últ(c.roic);
  const ebitda=últ(c.ebitda), nd=últ(c.netDebt);
  const deuda=(ebitda>0&&nd!=null)?nd/ebitda:null;
  const cs=curSymG();
  const dato=(lbl,val,tip)=>`<div class="perfil-dato" title="${tip||''}"><div class="perfil-lbl">${lbl}</div><div class="perfil-val">${val}</div></div>`;
  const meta=[];
  if(prof&&prof.industry) meta.push(industriaES(prof.industry));
  if(prof&&prof.country) meta.push('País: '+prof.country);
  if(prof&&prof.exchange) meta.push(prof.exchange);
  if(prof&&prof.ipo) meta.push('En bolsa desde '+String(prof.ipo).slice(0,4));

  // Frase de contexto construida con sus propias cifras (nada inventado)
  const frases=[];
  if(ventas!=null) frases.push(`Facturó <b>${cs}${N(Math.round(ventas))}M</b> en el último ejercicio`+
    (gVentas!=null?` y sus ventas crecen al <b>${P(gVentas)}</b> anual en los últimos 5 años`:''));
  if(mgFcf!=null) frases.push(`convierte en caja libre el <b>${mgFcf.toFixed(0)}%</b> de lo que vende`+
    (mgFcf>=20?' (margen muy alto)':mgFcf>=10?' (margen sólido)':' (margen ajustado)'));
  if(roic!=null) frases.push(`obtiene un <b>ROIC del ${roic.toFixed(0)}%</b> sobre el capital que reinvierte`+
    (roic>=20?', señal de un negocio excelente':roic>=12?', por encima de su coste de capital':', por debajo de lo que exige un compounder'));
  if(deuda!=null) frases.push(deuda<0?'y opera con <b>caja neta</b> (más dinero que deuda)'
    :`y arrastra una deuda de <b>${deuda.toFixed(1)}x EBITDA</b>`+(deuda<1?', muy contenida':deuda<3?', manejable':', elevada'));

  return `
  <div class="card" style="margin-bottom:10px;">
    <div class="ctitle" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
      <span>Perfil de la empresa</span>
      <span style="display:flex;gap:6px;align-items:center;">
        <span class="perfil-auto">ficha automática</span>
        <button onclick="refrescarPerfil('${key}')" style="font-size:9px;padding:3px 9px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--sub);cursor:pointer;font-weight:700;">↻ Actualizar</button>
        <button onclick="editarDominioLogo('${key}')" style="font-size:9px;padding:3px 9px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--sub);cursor:pointer;font-weight:700;" title="Cambiar la web de la que se saca el logo">Logo</button>
      </span>
    </div>
    ${meta.length?`<div style="font-size:10.5px;color:var(--muted);font-weight:600;margin-bottom:8px;">${meta.join(' · ')}${prof&&prof.web?` · <a href="${prof.web}" target="_blank" rel="noopener" style="color:var(--blue);font-weight:700;text-decoration:none;">${_hostOf(prof.web)||'web'} ↗</a>`:''}</div>`:''}
    ${frases.length?`<div class="ficha-desc-card" style="margin-bottom:10px;">${frases.join(', ')}.</div>`:''}
    <div class="perfil-grid">
      ${dato('Ventas último año',ventas!=null?cs+N(Math.round(ventas))+'M':'—','Ventas del último ejercicio disponible')}
      ${dato('Crec. ventas 5Y',P(gVentas),'Crecimiento anualizado de las ventas en 5 años')}
      ${dato('Margen FCF',mgFcf!=null?mgFcf.toFixed(0)+'%':'—','Qué parte de las ventas se convierte en caja libre')}
      ${dato('ROIC',roic!=null?roic.toFixed(0)+'%':'—','Retorno sobre el capital invertido')}
      ${dato('Deuda neta / EBITDA',deuda!=null?deuda.toFixed(1)+'x':'—','Negativo = caja neta')}
      ${dato('Divisa',curOf(key),'Divisa en la que cotiza y en la que están sus cuentas')}
    </div>
    <div style="margin-top:9px;font-size:10px;color:var(--muted);line-height:1.55;">
      Esta ficha se genera con los datos públicos de la empresa y con sus propias cuentas —
      <b>no es un análisis cualitativo</b>. El foso competitivo, los segmentos de negocio y la tesis
      los escribes tú: por ahora solo las nueve empresas de fábrica los tienen redactados.
    </div>
  </div>`;
}
// Vuelve a pedir la ficha pública (por si el logo o el sector salieron mal)
async function refrescarPerfil(key){
  await fetchCompanyProfile(key,true);
  if(typeof showTab==='function'&&curTab) showTab(curTab);
  if(typeof renderCartera==='function') renderCartera();
}
// Corregir a mano la web de la que se saca el logo
function editarDominioLogo(key){
  const actual=domainOverride(key)||_domainFor(key)||'';
  const v=prompt('Web de '+((DB[key]&&DB[key].name)||key)+' para sacar el logo\\n'
    +'(solo el dominio, por ejemplo: dell.com)\\n\\nDéjalo vacío para volver al automático.',actual);
  if(v===null) return;
  setDomainFor(key,(v||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'')||null);
  if(typeof showTab==='function'&&curTab) showTab(curTab);
  if(typeof renderCartera==='function') renderCartera();
}
