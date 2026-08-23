// ─────────────────────────────────────────────────────────────
// Render del bloque "Mi posición" dentro de Análisis
// ─────────────────────────────────────────────────────────────
function rMiPosicion(vd,fv5){
  const pos=getMiPosicion();
  // Sin posición todavía → call to action
  if(!pos){
    return`
    <div class="card" style="margin-bottom:10px;background:${_dm()?'#1c2333':'linear-gradient(135deg,#f7f6f3 0%,#fff 100%)'};border:1.5px dashed var(--border);">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Mi posición</div>
          <div style="font-size:14px;color:var(--sub);">¿Ya tienes acciones de ${co.ticker}? Registra tu compra para ver tu P&amp;L y análisis personalizado.</div>
        </div>
        <button onclick="openMiPosicionForm()" style="background:${co.color};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:12px;font-weight:700;cursor:pointer;">+ Añadir mi compra</button>
      </div>
    </div>`;
  }
  // Con posición → análisis completo
  const cost=pos.buyPrice*pos.shares;
  const valNow=price*pos.shares;
  const pnl=valNow-cost;
  const pnlPct=(pnl/cost)*100;
  const pnlAnnual=pos.buyDate?(()=>{
    const days=(Date.now()-new Date(pos.buyDate).getTime())/(1000*86400);
    if(days<30) return null;
    const years=days/365.25;
    return ((Math.pow(valNow/cost,1/years)-1)*100);
  })():null;
  // Comparación S&P
  const spComp=pos.spReturn?(pnlPct-pos.spReturn):null;
  // Análisis: ¿es buen momento para promediar?
  const ms=vd.msBase!=null?vd.msBase:vd.ms;
  let avgAdvice='',avgColor='',avgBg='',avgIcon='';
  if(vd.verdict==='COMPRAR'&&ms>15){
    avgAdvice='Buen momento para promediar a la baja: MdS amplio + MOAT sólido.';avgColor=_dm()?'#3fb950':'#16a34a';avgBg=_dm()?'#0d2117':'#f0fdf4';avgIcon='✅';
  } else if(vd.verdict==='COMPRAR'){
    avgAdvice='Punto razonable para añadir posición, pero MdS moderado.';avgColor=_dm()?'#3fb950':'#16a34a';avgBg=_dm()?'#0d2117':'#f0fdf4';avgIcon='✅';
  } else if(vd.verdict==='MANTENER'&&ms>-5){
    avgAdvice='No vendas pero NO promedies aquí. Espera mejor punto de entrada.';avgColor=_dm()?'#e3b341':'#d97706';avgBg=_dm()?'#1a1200':'#fffbeb';avgIcon='⚖️';
  } else if(vd.euforiaPenalty>=15){
    avgAdvice='⚠ Múltiplos en burbuja — considerar reducir posición o tomar beneficios parciales.';avgColor=_dm()?'#f78166':'#dc2626';avgBg=_dm()?'#200a0a':'#fef2f2';avgIcon='🚨';
  } else {
    avgAdvice='No promedies. Si la pérdida es estructural, evaluar tesis. Si es cíclica, paciencia.';avgColor=_dm()?'#f78166':'#dc2626';avgBg=_dm()?'#200a0a':'#fef2f2';avgIcon='⚠️';
  }
  // Target a 5Y desde tu coste
  const upside5Y=fv5?((fv5-pos.buyPrice)/pos.buyPrice*100):null;
  const upside5YFromNow=fv5?((fv5-price)/price*100):null;

  return`
  <div class="card" style="margin-bottom:10px;border-left:4px solid ${co.color};">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div class="ctitle" style="margin-bottom:0;">Mi posición en ${co.ticker}</div>
      <div style="display:flex;gap:6px;">
        <button onclick="openMiPosicionForm()" style="font-size:10px;padding:4px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);cursor:pointer;font-weight:600;">✏️ Editar</button>
        <button onclick="if(confirm('¿Borrar tu posición?'))clearMiPosicion()" style="font-size:10px;padding:4px 10px;border-radius:8px;border:1px solid #fecaca;background:#fff;cursor:pointer;color:#dc2626;font-weight:600;">🗑️</button>
      </div>
    </div>

    <!-- Bloque principal: P&L grande -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
      <div style="background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:10px;padding:10px 12px;">
        <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Precio compra · Acciones</div>
        <div style="font-size:14px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${mny(curSymG()+N(pos.buyPrice,2)+' × '+N(pos.shares))}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;">Coste total: ${mny(curSymG()+N(Math.round(cost)))}</div>
      </div>
      <div style="background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:10px;padding:10px 12px;">
        <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Valor hoy · Precio ${curSymG()}${N(price,2)}</div>
        <div style="font-size:14px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${mny(curSymG()+N(Math.round(valNow)))}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;">${pos.buyDate?'Comprado: '+pos.buyDate:'Sin fecha'}</div>
      </div>
      <div style="background:${pnl>=0?'#f0fdf4':'#fef2f2'};border:1.5px solid ${pnl>=0?'#bbf7d0':'#fecaca'};border-radius:10px;padding:10px 12px;text-align:center;">
        <div style="font-size:8px;color:${pnl>=0?'#16a34a':'#dc2626'};text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:2px;">P&amp;L total</div>
        <div style="font-size:22px;font-weight:600;color:${pnl>=0?'#16a34a':'#dc2626'};line-height:1;">${privado()?(pnlPct>=0?'+':'')+pnlPct.toFixed(1)+'%':(pnl>=0?'+':'')+curSymG()+N(Math.round(Math.abs(pnl)))}</div>
        <div style="font-size:11px;font-weight:700;color:${pnl>=0?'#16a34a':'#dc2626'};margin-top:3px;">${pnlPct>=0?'+':''}${pnlPct.toFixed(1)}%${pnlAnnual!==null?' · '+(pnlAnnual>=0?'+':'')+pnlAnnual.toFixed(1)+'% anual':''}</div>
      </div>
    </div>

    <!-- Análisis: vs SP500, target desde coste, recomendación -->
    <div style="display:grid;grid-template-columns:${spComp!==null?'1fr 1fr 1fr':'1fr 1fr'};gap:8px;">
      ${spComp!==null?`
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:9px 11px;">
        <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px;">vs S&amp;P 500 desde tu compra</div>
        <div style="font-size:15px;font-weight:600;color:${spComp>=0?'#16a34a':'#dc2626'};">${spComp>=0?'+':''}${spComp.toFixed(1)}pp</div>
        <div style="font-size:9px;color:var(--muted);">Tú: ${pnlPct>=0?'+':''}${pnlPct.toFixed(1)}% · S&amp;P: ${pos.spReturn>=0?'+':''}${(+pos.spReturn).toFixed(1)}%</div>
      </div>`:''}
      ${fv5?`
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:9px 11px;">
        <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px;">Target 5Y desde tu coste</div>
        <div style="font-size:15px;font-weight:600;color:${upside5Y>=0?'#16a34a':'#dc2626'};">${upside5Y>=0?'+':''}${upside5Y.toFixed(0)}%</div>
        <div style="font-size:9px;color:var(--muted);">vs ${upside5YFromNow>=0?'+':''}${upside5YFromNow.toFixed(0)}% desde precio actual</div>
      </div>`:''}
      <div style="background:${avgBg};border:1.5px solid ${avgColor}40;border-radius:10px;padding:9px 11px;">
        <div style="font-size:8px;color:${avgColor};text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:2px;">${avgIcon} ¿Promediar ahora?</div>
        <div style="font-size:11px;color:${avgColor};font-weight:600;line-height:1.4;">${avgAdvice}</div>
      </div>
    </div>

    <!-- Línea contextual -->
    <div style="margin-top:8px;padding:7px 10px;background:${_dm()?'#161b27':'#f9f8f6'};border-radius:7px;font-size:10px;color:var(--sub);">
      ${pnl>=0?
        `Llevas un beneficio del ${pnlPct.toFixed(1)}% en ${co.ticker}. ${vd.verdict==='EVITAR'?'El veredicto actual es <strong style="color:#dc2626;">EVITAR</strong> — considera tomar beneficios parciales.':vd.verdict==='COMPRAR'?'El veredicto actual es <strong style="color:#16a34a;">COMPRAR</strong> — la tesis sigue intacta, mantén o promedia.':'El veredicto actual es <strong style="color:#d97706;">MANTENER</strong> — sin razones para vender ni añadir agresivamente.'}`
        :
        `Llevas una pérdida del ${Math.abs(pnlPct).toFixed(1)}% en ${co.ticker}. ${vd.verdict==='COMPRAR'&&ms>15?'El veredicto es <strong style="color:#16a34a;">COMPRAR con MdS amplio</strong> — buen punto para promediar a la baja.':vd.verdict==='EVITAR'?'El veredicto es <strong style="color:#dc2626;">EVITAR</strong> — re-evaluar tesis antes de añadir más capital.':'Mantén la posición pero <strong>no añadas más</strong> hasta que mejore el setup.'}`
      }
    </div>
  </div>

  <!-- MODAL: formulario edición posición -->
  <div id="mp-form-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:var(--surface);border-radius:14px;padding:22px;max-width:420px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,.2);">
      <div style="font-size:14px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};margin-bottom:14px;">Mi posición en ${co.ticker}</div>
      <div style="display:grid;gap:10px;">
        <div>
          <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;font-weight:700;">Precio de compra (USD)</label>
          <input id="mp-form-buyPrice" type="number" step="0.01" placeholder="ej: 75.50" style="width:100%;font-size:14px;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;margin-top:3px;outline:none;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;font-weight:700;">Número de acciones</label>
          <input id="mp-form-shares" type="number" step="1" placeholder="ej: 100" style="width:100%;font-size:14px;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;margin-top:3px;outline:none;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;font-weight:700;">Fecha de compra (opcional)</label>
          <input id="mp-form-buyDate" type="date" style="width:100%;font-size:14px;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;margin-top:3px;outline:none;" />
        </div>
        <div>
          <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;font-weight:700;">Retorno S&amp;P 500 desde tu compra % (opcional)</label>
          <input id="mp-form-spReturn" type="number" step="0.1" placeholder="ej: 12.5 (puedes consultar en spglobal.com)" style="width:100%;font-size:14px;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;margin-top:3px;outline:none;" />
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button onclick="closeMiPosicionForm()" style="flex:1;padding:9px;border:1px solid var(--border);background:var(--surface2);color:var(--text);border-radius:8px;cursor:pointer;font-weight:600;">Cancelar</button>
        <button onclick="submitMiPosicionForm()" style="flex:1;padding:9px;border:none;background:${co.color};color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">Guardar</button>
      </div>
    </div>
  </div>`;
}
