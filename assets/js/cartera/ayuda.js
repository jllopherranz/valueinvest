// ─────────────────────────────────────────────────────────────
// Popups de ayuda de las columnas de la cartera
// ─────────────────────────────────────────────────────────────
// ── Popup por columna: explica UNA métrica al tocar la celda ──
const COL_INFO={
  cartera:{
    precio:['💵 Precio','Cotización en vivo (Yahoo Finance) y variación del día. Si no hay conexión, muestra el último precio guardado.'],
    coste:['📌 Mi coste','Tu <b>precio de compra medio</b> en esta empresa y tu <b>rendimiento</b>: cuánto ganas (+, verde) o pierdes (−, rojo) respecto al precio actual.<br><br>Si además guardas el <b>número de acciones</b>, la tercera línea muestra el valor de la posición y su <b>peso</b> sobre el total de la cartera — sin eso no se puede medir el riesgo de concentración ni sumar los totales.<br><br>Pulsa la celda para introducir o editar tus datos. Se guardan en este navegador y también aparecen en «Mi posición» dentro del análisis de la empresa.'],
    sem:['📅 Semanal','Variación del precio en la última semana (5 sesiones de mercado).'],
    obj:['🎯 Objetivo de precio','Valor intrínseco HOY: promedio de los 4 múltiplos objetivo (PER, EV/FCF, EV/EBITDA, EV/EBIT) aplicados a los datos del año en curso de tu Excel.<br><br>El % es el <b>Margen de Seguridad (MdS)</b>: cuánto está el precio por debajo (+, verde) o por encima (−, rojo) del valor intrínseco.'],
    entrada:['🟢 Precio de entrada','Precio máximo de compra para lograr un <b>15% anual durante 5 años</b>. Si el precio actual está en o por debajo de esta zona, la fila se resalta: es zona de compra.'],
    obj5:['🔮 Objetivo a 5 años','Precio objetivo a 5 años (promedio de los 4 múltiplos sobre las proyecciones de tu Excel) y el retorno anualizado (CAGR) comprando al precio actual.<br><br>Verde ≥15%/año · ámbar ≥8% · rojo por debajo.'],
    peg:['⚖️ PEG','PER dividido por el crecimiento esperado.<br><br>&lt;1: pagas poco por el crecimiento (barato)<br>1–2: razonable<br>&gt;2: caro.'],
    veredicto:['🧭 Veredicto','El mismo veredicto que verás dentro del análisis de la empresa (COMPRAR / MANTENER / EVITAR) con su puntuación sobre 100.<br><br>Combina cuatro cosas: retorno esperado a 5 años (35), foso competitivo o MOAT (30), ROIC (20) y margen de seguridad del próximo año (15).<br><br>No es una orden: es un resumen. La decisión sigue siendo tuya y la tesis manda sobre el número.'],
  },
  gv:{
    estilo:['🏷️ Estilo','Clasificación automática según crecimiento y valoración: Hyper-growth, Growth, GARP (crecimiento a precio razonable), Calidad/Compounder, Value o Madura/Cíclica.'],
    crec:['📈 Crecimiento','Crecimiento anual de ventas proyectado (de tu Excel). Verde ≥12% · ámbar ≥6% · rojo por debajo. Es el motor principal del retorno a largo plazo.'],
    roic:['🏭 ROIC','Retorno sobre el capital invertido: cuánto beneficio genera la empresa por cada euro que reinvierte.<br><br>Verde ≥20% (negocio excelente) · ámbar ≥12%. La métrica favorita de los inversores de calidad.'],
    mgfcf:['💧 Margen FCF','Qué % de las ventas se convierte en caja libre para el accionista.<br><br>Verde ≥20% · ámbar ≥10%. Un margen alto = negocio poco intensivo en capital.'],
    evfcf:['📊 EV/FCF vs media','Múltiplo actual (valor de empresa ÷ flujo de caja libre) comparado con su media histórica.<br><br>−X% (verde): cotiza X% más BARATA que su media → oportunidad.<br>+X% (rojo): más CARA.'],
    peg:['⚖️ PEG','PER dividido por el crecimiento.<br><br>&lt;1: barato · 1–2: razonable · &gt;2: caro. Permite comparar empresas con crecimientos muy distintos.'],
    r40:['4️⃣0️⃣ Rule of 40','Crecimiento de ventas + margen FCF. Si suma ≥40% la empresa combina bien crecimiento y rentabilidad (verde). Muy usada en software/tecnología.'],
    fcfy:['💰 FCF yield','Flujo de caja libre ÷ capitalización: el "interés" que te paga el negocio al precio actual.<br><br>Verde ≥5% (barata) · ámbar ≥3%. Cuanto más alto, más barata.'],
  }
};
function showColInfo(group,key,ev){
  if(ev) ev.stopPropagation();
  const info=(COL_INFO[group]||{})[key]; if(!info) return;
  let m=document.getElementById('col-info-modal');
  if(!m){
    m=document.createElement('div');
    m.id='col-info-modal';
    m.style.cssText='display:none;position:fixed;inset:0;z-index:2100;background:rgba(0,0,0,.5);align-items:center;justify-content:center;padding:20px;';
    m.onclick=e=>{ if(e.target===m) m.style.display='none'; };
    document.body.appendChild(m);
  }
  m.innerHTML=`<div style="background:var(--surface);border-radius:14px;max-width:400px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.3);border:1.5px solid var(--border);">
    <div style="padding:14px 18px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div style="font-size:13px;font-weight:700;color:var(--text);">${info[0]}</div>
      <button onclick="document.getElementById('col-info-modal').style.display='none'" style="border:none;background:var(--surface2);color:var(--sub);border-radius:8px;padding:3px 9px;cursor:pointer;font-size:12px;font-weight:700;">✕</button>
    </div>
    <div style="padding:12px 18px 16px;font-size:11.5px;color:var(--sub);line-height:1.65;">${info[1]}</div>
  </div>`;
  m.style.display='flex';
}

// ── Popup ayuda: explica las métricas del comparador Growth vs Value ──
function showGvHelp(){
  let m=document.getElementById('gv-help-modal');
  if(m){ m.style.display='flex'; return; }
  const rows=[
    ['Estilo','Clasificación automática de la empresa según crecimiento y valoración: Hyper-growth, Growth, GARP (crecimiento a precio razonable), Calidad/Compounder, Value o Madura/Cíclica.'],
    ['Crec.','Crecimiento anual de ventas proyectado (de tu Excel). Verde ≥12%, ámbar ≥6%, rojo por debajo. Es el motor principal del retorno a largo plazo.'],
    ['ROIC','Retorno sobre el capital invertido: cuánto beneficio genera la empresa por cada euro que reinvierte en el negocio. Verde ≥20% (negocio excelente), ámbar ≥12%, rojo por debajo. Es la métrica favorita de los inversores de calidad.'],
    ['Mg FCF','Margen de flujo de caja libre: qué % de las ventas se convierte en caja disponible para el accionista. Verde ≥20%, ámbar ≥10%. Un margen alto indica un negocio poco intensivo en capital.'],
    ['EV/FCF vs media','Múltiplo actual (valor de empresa ÷ flujo de caja libre) comparado con su media histórica. El % entre paréntesis: −X% significa que cotiza X% más BARATA que su media (verde, oportunidad); +X% más CARA (rojo).'],
    ['PEG','PER dividido por el crecimiento. Por debajo de 1: pagas poco por el crecimiento (barato). Entre 1 y 2: razonable. Por encima de 2: caro. Permite comparar empresas con crecimientos muy distintos.'],
    ['Rule 40','Regla del 40: crecimiento de ventas + margen FCF. Si suma ≥40%, la empresa combina bien crecimiento y rentabilidad (verde). Muy usada para evaluar empresas de software/tecnología.'],
    ['FCF yield','Rentabilidad de caja: flujo de caja libre ÷ capitalización bursátil. Es como el "interés" que te paga el negocio al precio actual. Verde ≥5% (barata), ámbar ≥3%. Lo inverso del EV/FCF: cuanto más alto, más barata.'],
  ];
  m=document.createElement('div');
  m.id='gv-help-modal';
  m.style.cssText='display:flex;position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);align-items:center;justify-content:center;padding:16px;';
  m.onclick=e=>{ if(e.target===m) m.style.display='none'; };
  m.innerHTML=`<div style="background:var(--surface);border-radius:16px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1.5px solid var(--border);">
    <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);">
      <div style="font-size:14px;font-weight:700;color:var(--text);">Métricas Growth vs Value</div>
      <button onclick="document.getElementById('gv-help-modal').style.display='none'" style="border:none;background:var(--surface2);color:var(--sub);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:700;">✕</button>
    </div>
    <div style="padding:14px 20px 18px;">
      ${rows.map(([t,d])=>`<div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--blue);margin-bottom:3px;">${t}</div>
        <div style="font-size:11.5px;color:var(--sub);line-height:1.6;">${d}</div>
      </div>`).join('')}
      <div style="margin-top:14px;padding:10px 12px;background:var(--surface2);border-radius:10px;font-size:10.5px;color:var(--muted);line-height:1.6;">💡 Combinación ideal: crecimiento alto + ROIC alto + múltiplo por debajo de su media histórica. El cuadrante superior derecho (barato + crece) es la zona GARP: donde los inversores de calidad buscan comprar.</div>
    </div>
  </div>`;
  document.body.appendChild(m);
}

// ── Popup ayuda: explica las columnas de la tabla de cartera ──
function showCarteraHelp(){
  let m=document.getElementById('cartera-help-modal');
  if(m){ m.style.display='flex'; return; }
  const rows=[
    ['Precio','Cotización en vivo (Yahoo Finance) y variación del día. Si no hay conexión, muestra el último precio guardado.'],
    ['Sem.','Variación del precio en la última semana (5 sesiones).'],
    ['Obj. precio','Valor intrínseco HOY: promedio de los 4 múltiplos objetivo (PER, EV/FCF, EV/EBITDA, EV/EBIT) aplicados a los datos del año en curso de tu Excel. El % es el Margen de Seguridad (MdS): cuánto está el precio por debajo (+, verde) o por encima (−, rojo) del valor.'],
    ['Entrada','Precio máximo de compra para lograr un 15% anual durante 5 años. Si el precio actual está en o por debajo de esta zona, la fila se resalta: es zona de compra.'],
    ['Obj. 5Y','Precio objetivo a 5 años (promedio de los 4 múltiplos sobre las proyecciones de tu Excel) y el retorno anualizado (CAGR) que implica comprando al precio actual. Verde ≥15%/año, ámbar ≥8%, rojo por debajo.'],
    ['PEG','PER dividido por el crecimiento esperado. Por debajo de 1 suele indicar que pagas poco por el crecimiento; por encima de 2, caro.'],
    ['Veredicto','COMPRAR / MANTENER / EVITAR con su puntuación sobre 100, el mismo que aparece dentro del análisis de la empresa. Pondera retorno esperado 5Y (35), MOAT (30), ROIC (20) y margen de seguridad a un año (15).'],
    ['Escenario prudente','La línea «prud.» de las columnas Obj. precio y Obj. 5Y repite el cálculo con los múltiplos un 20% más bajos. El múltiplo es la parte más frágil de cualquier valoración: si aun contrayéndose el retorno sigue siendo bueno, la tesis es robusta.'],
    ['Calidad del negocio','El botón «⚙ Calidad del negocio» añade cuatro columnas: ROIC medio de 5 años, margen de caja libre, deuda neta ÷ EBITDA y crecimiento de ventas a 5 años. Un inversor value filtra primero por calidad y solo después mira el precio.'],
    ['Excel / estimado','La etiqueta junto al ticker dice de dónde salen los números: «Excel» (de tu hoja, con aviso si se importó hace más de 6 meses), «estimado» (proyecciones calculadas por la app, NO son tuyas) o «sin Excel» (datos de fábrica).'],
    ['Divisa','Cada empresa muestra su precio en la divisa de la bolsa de la que se descarga, y esa divisa la declara la propia fuente (no se adivina). Mientras no haya una descarga se deduce del ticker y aparece con un «?» y el borde punteado. Pulsando la divisa puedes cambiar la bolsa de referencia (por ejemplo ASML.AS en Ámsterdam en euros, o ASML en Nasdaq en dólares): el precio y la divisa cambian juntos, para que nunca compares un precio en dólares con unos objetivos calculados en euros. Los totales del resumen se convierten a la divisa base que elijas arriba.'],
    ['Barra lateral','Semáforo visual del potencial anualizado a 5 años: cuanto más larga y verde, mayor retorno esperado.'],
  ];
  m=document.createElement('div');
  m.id='cartera-help-modal';
  m.style.cssText='display:flex;position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);align-items:center;justify-content:center;padding:16px;';
  m.onclick=e=>{ if(e.target===m) m.style.display='none'; };
  m.innerHTML=`<div style="background:var(--surface);border-radius:16px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1.5px solid var(--border);">
    <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);">
      <div style="font-size:14px;font-weight:700;color:var(--text);">📋 Qué significa cada columna</div>
      <button onclick="document.getElementById('cartera-help-modal').style.display='none'" style="border:none;background:var(--surface2);color:var(--sub);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:700;">✕</button>
    </div>
    <div style="padding:14px 20px 18px;">
      ${rows.map(([t,d])=>`<div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--blue);margin-bottom:3px;">${t}</div>
        <div style="font-size:11.5px;color:var(--sub);line-height:1.6;">${d}</div>
      </div>`).join('')}
      <div style="margin-top:14px;padding:10px 12px;background:var(--surface2);border-radius:10px;font-size:10.5px;color:var(--muted);line-height:1.6;">💡 Todos los cálculos usan los datos y múltiplos objetivo de tu Excel de Google Drive. Haz clic en cualquier fila para abrir el análisis completo de esa empresa.</div>
    </div>
  </div>`;
  document.body.appendChild(m);
}
function toggleGvCompare(){
  const body=document.getElementById('gv-body'),chev=document.getElementById('gv-chevron');
  if(!body) return;
  const open=body.style.display==='none';
  body.style.display=open?'block':'none';
  if(chev) chev.textContent=open?'▲ ocultar':'▼ mostrar';
  body.parentElement.querySelector('[onclick^="toggleGvCompare"]').style.marginBottom=open?'10px':'0';
  localStorage.setItem('vi_gv_open',open?'1':'0');
}

// ── Render portfolio table (compacta y visual) ──
// ── Plegado de las dos listas de la cartera (invertidas / en seguimiento) ──
function carteraGrupoAbierto(gid){
  try{return localStorage.getItem('vi_cart_grp_'+gid)!=='0';}catch(e){return true;}
}
function toggleCarteraGrupo(gid){
  const open=!carteraGrupoAbierto(gid);
  try{localStorage.setItem('vi_cart_grp_'+gid,open?'1':'0');}catch(e){}
  document.querySelectorAll('.cart-r-'+gid).forEach(tr=>{tr.style.display=open?'':'none';});
  const c=document.getElementById('cgc-'+gid); if(c) c.textContent=open?'▾':'▸';
}
