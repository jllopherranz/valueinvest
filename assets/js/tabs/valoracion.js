// ─────────────────────────────────────────────────────────────
// Pestaña Valoración: precio vs valor intrínseco, múltiplos y precios objetivo
// ─────────────────────────────────────────────────────────────
function rValoracion(){
  const vd=calcVerdict(),vc=vd.verdictColor;
  const dcf=calcDCF(),ud=(dcf-price)/price*100;
  const isM=calcISModel();
  // Comparación de proyecciones por AÑO (📊 Excel vs 🤖 Web consenso). La fuente activa define los años.
  const _wp=_webProj[coKeyOf(co)];
  const _activeYears=(_projSource==='auto'&&_wp&&_wp.years&&_wp.years.length)?_wp.years:co.pY;
  const _sheetISDv=sheetISD();
  const _excelByYear={}; (co.pY||[]).forEach((y,i)=>{_excelByYear[y]={sg:_sheetISDv.sg[i],em:_sheetISDv.em[i],tr:_sheetISDv.tr[i],di:_sheetISDv.di[i],cx:_sheetISDv.cx[i],wc:_sheetISDv.wc[i]};});
  const _webByYear=(_wp&&_wp.isdByYear)?_wp.isdByYear:{};
  const _fwdYr=(isM[0]&&isM[0].yr)?isM[0].yr:((co.pY&&co.pY[0])||2026); // año forward de la fuente activa (Excel=2026e, Web FMP=2027e)
  const me=(co.medEvEbit||(Math.round(co.medEvEbitda*co.ebitdaM[9]/Math.max(co.ebitM[9],1))));
  const rowPER=isM.map(m=>Math.round(m.eps*tPER));
  const rowEVF=evfTargetsFor(co); // EV/FCF: misma fuente que el resumen y tu hoja
  const rowEVEB=isM.map(m=>Math.round((m.eb*tEVE-m.nd)/m.sh));
  const rowEVEI=isM.map(m=>Math.round((m.ebit*tEVEI-m.nd)/m.sh));
  const rowAvg=rowEVF.map((_,i)=>Math.round((rowPER[i]+rowEVF[i]+rowEVEB[i]+rowEVEI[i])/4));
  const cagr5={per:((Math.pow(Math.max(rowPER[4],1)/Math.max(price,1),.2)-1)*100),evf:((Math.pow(Math.max(rowEVF[4],1)/Math.max(price,1),.2)-1)*100),eveb:((Math.pow(Math.max(rowEVEB[4],1)/Math.max(price,1),.2)-1)*100),evei:((Math.pow(Math.max(rowEVEI[4],1)/Math.max(price,1),.2)-1)*100),avg:((Math.pow(Math.max(rowAvg[4],1)/Math.max(price,1),.2)-1)*100)};
  const idx=Math.min(hor,5)-1,priceForRet=Math.round(rowEVF[idx]/Math.pow(1+ret/100,idx+1)),diffRet=((priceForRet-price)/price*100);
  const ccol=v=>v>=15?'#16a34a':v>=10?'#d97706':'#dc2626';
  const realPrice=_livePrice||_lastKnownPrice(coKeyOf(co))||co.price; // live, si no el último conocido, si no DB
  const isSimulating=simMode&&Math.abs(price-realPrice)>0.5;
  // Valor intrínseco por PER normal (estilo FastGraphs): EPS forward × mediana histórica de PER
  const curSym=curSymG();
  const _epsFwd=(isM[0]&&isM[0].eps)||co.pEPS[0]||co.eps[9];
  const _fairNow=Math.round(_epsFwd*co.medPER);
  const _fvPrem=_fairNow>0?((price-_fairNow)/_fairNow*100):0;
  const _fvColor=_fvPrem>5?'#dc2626':_fvPrem<-5?'#16a34a':'#d97706';
  const _fvWord=_fvPrem>5?'cara':_fvPrem<-5?'barata':'en precio justo';

  return`<div>
  ${estimatedBanner()}

  <!-- SIM BANNER -->
  <div class="sim-banner${isSimulating?' visible':''}" id="sim-banner">
    🧪 Simulando precio hipotético: <strong>${curSymG()}${N(price,2)}</strong> (precio real: ${curSymG()}${N(realPrice,2)})
    <button onclick="price=${realPrice};simMode=false;recalc();showTab('valoracion');" style="margin-left:10px;padding:2px 8px;border-radius:8px;border:1px solid #92400e;background:transparent;color:#92400e;cursor:pointer;font-size:10px;font-weight:700;">✕ Salir simulación</button>
  </div>

  <!-- PRECIO + CONTEXTO -->
  <div class="card" style="margin-bottom:10px;">
    <div class="val-head" style="display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;flex-wrap:wrap;">
      <div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Precio de análisis</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:13px;color:var(--muted);font-weight:700;">${curSymG()}</span>
          <input id="val-price-inp" type="number" value="${(+price).toFixed(2)}"
            style="width:110px;font-size:28px;font-weight:600;color:${isSimulating?'#d97706':vc};border:none;border-bottom:3px solid ${isSimulating?'#f59e0b':vc};background:transparent;outline:none;text-align:center;transition:color .2s;"
            oninput="price=+this.value||(_livePrice||_lastKnownPrice(coKeyOf(co))||co.price);simMode=Math.abs(price-(_livePrice||_lastKnownPrice(coKeyOf(co))||co.price))>0.5;recalc()"/>
          ${isSimulating?`<span style="font-size:9px;font-weight:700;background:#fffbeb;color:#d97706;border:1px solid #f59e0b;padding:2px 7px;border-radius:8px;">SIM</span>`:''}
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px;">Precio real: ${curSymG()}${N(realPrice,2)} · Introduce otro precio para simular</div>
      </div>
      <div class="val-tiles" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
        ${(()=>{const _ev=price*isM[0].sh+isM[0].nd;return[{id:'mt-per',lbl:'PER',raw:price/Math.max(isM[0].eps,.01),m:co.medPER,c:'#7c3aed',tip:'per'},{id:'mt-evfcf',lbl:'EV/FCF',raw:_ev/Math.max(isM[0].fcf,1),m:co.medEvFcf,c:'#b45309',tip:'evfcf'},{id:'mt-eveb',lbl:'EV/EBITDA',raw:_ev/Math.max(isM[0].eb,1),m:co.medEvEbitda,c:'#2563eb'},{id:'mt-evei',lbl:'EV/EBIT',raw:_ev/Math.max(isM[0].ebit,1),m:me,c:'#16a34a'}];})().map(t=>{const v=Math.round(t.raw),med=Math.round(t.m),ok=t.raw<=t.m,pct=((t.raw-t.m)/t.m*100);return`<div id="${t.id}" ${t.tip?`data-tip="${t.tip}" `:''}style="background:${ok?'#f0fdf4':'#fef2f2'};border:1px solid ${ok?'#bbf7d0':'#fecaca'};border-radius:9px;padding:8px;text-align:center;${t.tip?'cursor:pointer;':''}"><div style="font-size:8px;color:${t.c};font-weight:700;text-transform:uppercase;margin-bottom:3px;">${t.lbl} <span style="opacity:.55;">${_fwdYr}e</span>${t.tip?' <span style="opacity:.6;">ⓘ</span>':''}</div><div class="mt-val" style="font-size:16px;font-weight:600;color:${t.c};">${v}x</div><div class="mt-pct" style="font-size:9px;font-weight:700;color:${ok?'#16a34a':'#dc2626'};">${pct>=0?'+':''}${pct.toFixed(0)}% vs med</div></div>`;}).join('')}
      </div>
      <div id="val-verd-box" style="background:${vc}12;border:1.5px solid ${vc}40;border-radius:10px;padding:10px 14px;text-align:center;min-width:90px;">
        <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Veredicto</div>
        <div class="val-verd-txt" style="font-size:14px;font-weight:600;color:${vc};">${vd.verdict}</div>
        <div class="val-verd-sub" style="font-size:9px;color:${vc};font-weight:600;">${vd.totalScore}/100</div>
      </div>
    </div>
  </div>

  <!-- PRECIO vs VALOR INTRÍNSECO (estilo FastGraphs) -->
  <div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
      <div class="ctitle" style="margin-bottom:0;">Precio vs Valor intrínseco — ¿cara o barata?</div>
      <span style="font-size:9px;color:var(--muted);">Valor = EPS × PER normal (${Math.round(co.medPER)}x)</span>
    </div>
    <div style="position:relative;height:230px;"><canvas id="c-fairvalue"></canvas></div>
    <div style="font-size:10.5px;color:var(--sub);margin-top:8px;line-height:1.55;text-align:center;">
      A su PER normal (${Math.round(co.medPER)}x) el valor rondaría <b>${curSym}${N(_fairNow)}</b>. Cotiza a <b>${curSym}${N(Math.round(price))}</b> →
      <b style="color:${_fvColor};">${_fvPrem>=0?'+':''}${_fvPrem.toFixed(0)}% (${_fvWord})</b>.
      Línea azul (precio) por encima de la dorada (valor) = cara; por debajo = barata.
    </div>
  </div>

  <!-- MÚLTIPLOS HISTÓRICOS + CHART -->
  <div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div class="ctitle" style="margin-bottom:0;">Múltiplos históricos vs mediana</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;">
        <button id="btn-evfcf" style="background:#b45309;border-color:#b45309;color:#fff;font-size:10px;padding:2px 9px;border-radius:12px;border:1.5px solid;cursor:pointer;font-weight:700;" onclick="toggleMultSeries('evfcf')">EV/FCF</button>
        <button id="btn-per" style="font-size:10px;padding:2px 9px;border-radius:12px;border:1.5px solid var(--border);cursor:pointer;font-weight:700;color:var(--muted);" onclick="toggleMultSeries('per')">PER</button>
        <button id="btn-evebitda" style="font-size:10px;padding:2px 9px;border-radius:12px;border:1.5px solid var(--border);cursor:pointer;font-weight:700;color:var(--muted);" onclick="toggleMultSeries('evebitda')">EV/EBITDA</button>
        <button id="btn-evebit" style="font-size:10px;padding:2px 9px;border-radius:12px;border:1.5px solid var(--border);cursor:pointer;font-weight:700;color:var(--muted);" onclick="toggleMultSeries('evebit')">EV/EBIT</button>
      </div>
    </div>
    ${co.spinoffNote?`<div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:7px 11px;font-size:10px;color:#92400e;margin-bottom:8px;border-radius:4px;">⚠ <strong>Atención a las medianas:</strong> los datos pre-${co.years[8]} incluyen el negocio escindido. <strong>Mediana 5Y</strong> es más representativa pero contiene años de pérdidas (FY23-24). Trata Med 10Y con cautela.</div>`:''}
    <div class="val-hist" style="display:grid;grid-template-columns:1fr 300px;gap:14px;align-items:start;">
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;"><table style="width:100%;min-width:520px;border-collapse:collapse;font-size:12.5px;"><thead><tr style="background:${_dm()?'#1c2333':'#f7f6f3'};"><th style="text-align:left;padding:7px 8px;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border);">Múltiplo</th>${co.years.map(y=>`<th style="text-align:center;padding:5px 4px;font-weight:600;color:var(--muted);border-bottom:2px solid var(--border);">${y}</th>`).join('')}<th style="text-align:center;padding:5px 6px;font-weight:600;color:#b45309;border-bottom:2px solid var(--border);background:#fff3e0;" title="Múltiplo forward ${_fwdYr}e: EV = precio actual × acciones proyectadas + deuda neta proyectada de ese año, ÷ la métrica proyectada (fuente activa: Excel o Web). Cambia con el precio y las proyecciones.">${_fwdYr}e<br><span style="font-size:7px;font-weight:600;color:#b45309;">estim.</span></th><th style="text-align:center;padding:5px 6px;font-weight:600;color:#1e3a5f;border-bottom:2px solid var(--border);background:${_dm()?'#1a1200':'#fef3c7'};">Med 5Y</th><th style="text-align:center;padding:5px 6px;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border);background:${_dm()?'#0c1832':'#eff6ff'};">Med 10Y</th></tr></thead><tbody>${[{label:'PER',k:'per',data:co.hPER,med10:co.medPER,med5:(co.med5PER||co.medPER),color:'#7c3aed',fwd:+(price/Math.max(isM[0].eps,0.01)).toFixed(1)},{label:'EV/FCF',k:'evfcf',data:co.hEvF,med10:co.medEvFcf,med5:(co.med5EvFcf||co.medEvFcf),color:'#b45309',fwd:+((price*isM[0].sh+isM[0].nd)/Math.max(isM[0].fcf,1)).toFixed(1)},{label:'EV/EBITDA',k:'eveb',data:co.hEvEbitda,med10:co.medEvEbitda,med5:(co.med5EvEbitda||co.medEvEbitda),color:'#2563eb',fwd:+((price*isM[0].sh+isM[0].nd)/Math.max(isM[0].eb,1)).toFixed(1)},{label:'EV/EBIT',k:'evei',data:co.hEvEbit,med10:me,med5:(co.med5EvEbit||me),color:'#16a34a',fwd:+((price*isM[0].sh+isM[0].nd)/Math.max(isM[0].ebit,1)).toFixed(1)}].map(row=>{const cells=row.data.map((v,i)=>{const val=(v??null),clr=val!=null?(val<=row.med5?'#16a34a':'#dc2626'):'var(--muted)';return`<td style="text-align:center;padding:6px 5px;font-weight:500;color:${clr};border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">${val!=null?Math.round(val)+'x':'—'}</td>`;}).join('');const fwdClr=row.fwd<=row.med5?'#16a34a':'#dc2626';const fwdCell=`<td id="fwd-${row.k}" data-med5="${row.med5}" style="text-align:center;padding:6px 5px;font-weight:600;color:${fwdClr};background:${_dm()?'#1a1000':'#fff8f0'};border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">${Math.round(row.fwd)}x</td>`;return`<tr><td style="padding:6px 8px;font-weight:700;color:${row.color};border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};border-left:3px solid ${row.color};">${row.label}</td>${cells}${fwdCell}<td style="text-align:center;padding:5px 6px;font-weight:600;color:#1e3a5f;background:${_dm()?'#1a1200':'#fef3c7'};border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">${Math.round(row.med5)}x</td><td style="text-align:center;padding:5px 6px;font-weight:700;color:var(--muted);background:${_dm()?'#0c1832':'#eff6ff'};border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};">${Math.round(row.med10)}x</td></tr>`;}).join('')}</tbody></table></div>
      <div><div style="position:relative;height:130px;background:#fafaf9;border-radius:10px;padding:6px;"><canvas id="c-mult-hist"></canvas></div><div style="font-size:9px;color:var(--muted);text-align:center;margin-top:3px;">Verde ≤ mediana · Rojo > mediana</div></div>
    </div>
  </div>

  <!-- MÚLTIPLOS OBJETIVO + ESCENARIOS -->
  <div class="card" style="margin-bottom:10px;">
    <div class="ctitle">Múltiplos objetivo — Escenarios</div>
    <div style="font-size:9px;color:var(--muted);margin:-4px 0 8px;">Por defecto se aplica <strong style="color:#1e3a5f;">Tu hoja (Excel)</strong>. Los escenarios salen de los <strong>percentiles del histórico de CADA empresa</strong>: Optimista P90 · Base mediana · Conservador P25 o últimos 3 años (lo menor) · Pesimista P10.</div>
    <div class="val-scen" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
      ${(()=>{const gm=getCompanyMults(coKeyOf(co));const sm=scenarioMults();const scenarios=[
        {key:'hoja',l:'📊 Tu hoja',evf:gm.evf,per:gm.per,eve:gm.eveb,evei:gm.evei,c:'#1e3a5f',bg:'#eef2f7',bda:'#1e3a5f',txt:'Tus múltiplos del Excel (por defecto)'},
        {key:'opt',l:'🐂 Optimista',evf:sm.opt.evf,per:sm.opt.per,eve:sm.opt.eve,evei:sm.opt.evei,c:'#16a34a',bg:'#f0fdf4',bda:'#16a34a',txt:'P90 histórico — re-rating alto'},
        {key:'base',l:'⚖️ Base',evf:sm.base.evf,per:sm.base.per,eve:sm.base.eve,evei:sm.base.evei,c:'#2563eb',bg:'#eff6ff',bda:'#2563eb',txt:'Mediana histórica (P50)'},
        {key:'cons',l:'🐻 Conserv.',evf:sm.cons.evf,per:sm.cons.per,eve:sm.cons.eve,evei:sm.cons.evei,c:'#d97706',bg:'#fffbeb',bda:'#d97706',txt:'P25 / mediana últimos 3 años (lo menor)'},
        {key:'pes',l:'😱 Pesimista',evf:sm.pes.evf,per:sm.pes.per,eve:sm.pes.eve,evei:sm.pes.evei,c:'#dc2626',bg:'#fef2f2',bda:'#dc2626',txt:'P10 — suelo histórico'}
      ];return scenarios.map(s=>{const isActive=(s.evf===tEVF&&s.per===tPER&&s.eve===tEVE&&s.evei===tEVEI);return`<button id="scen-btn-${s.key}" onclick="applyScenario('${s.key}',${s.evf},${s.per},${s.eve},${s.evei})" title="${s.txt} · PER ${Math.round(s.per)}x · EV/EBITDA ${Math.round(s.eve)}x · EV/EBIT ${Math.round(s.evei)}x" style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;border:${isActive?'2px':'1.5px'} solid ${s.bda}${isActive?'':'45'};background:${s.bg};cursor:pointer;${isActive?'box-shadow:0 1px 5px '+s.bda+'40;':''}"><span style="font-size:10px;font-weight:700;color:${s.c};">${s.l}</span><span style="font-size:10px;font-weight:600;color:#1e3a5f;">${Math.round(s.evf)}x</span></button>`;}).join('');})()}
    </div>
    <div class="val-tgt" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
      ${[{id:'tPER',label:'PER',val:tPER,med:co.medPER,c:'#7c3aed'},{id:'tEVF',label:'EV/FCF',val:tEVF,med:co.medEvFcf,c:'#b45309'},{id:'tEVE',label:'EV/EBITDA',val:tEVE,med:co.medEvEbitda,c:'#2563eb'},{id:'tEVEI',label:'EV/EBIT',val:tEVEI,med:me,c:'#16a34a'}].map(m=>`<div style="text-align:center;"><div style="font-size:8px;color:${m.c};font-weight:700;text-transform:uppercase;margin-bottom:3px;">${m.label}</div><input type="number" value="${m.val}" id="ni-${m.id}" style="width:100%;font-size:16px;font-weight:600;color:#1e3a5f;background:#fff7e6;border:1.5px solid #f59e0b;border-radius:7px;text-align:center;outline:none;padding:6px 0;" oninput="${m.id}=+this.value;clearScenBtn();_persistMults();recalc()"/><div style="font-size:9px;color:var(--muted);margin-top:2px;">med: ${Math.round(m.med)}x</div></div>`).join('')}
    </div>
  </div>

  <!-- PRECIO OBJETIVO + CAGR — TABLA UNIFICADA -->
  <div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
      <div class="ctitle" style="margin-bottom:0;">Precio objetivo ${co.pY[0]}–${co.pY[4]} + CAGR 5Y</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:9px;background:#fff3e0;color:#b45309;border:1.5px solid #f59e0b;padding:2px 8px;border-radius:10px;font-weight:700;">★ EV/FCF = referencia principal</span>
        <div style="text-align:center;background:#1e3a5f;border-radius:8px;padding:5px 14px;"><div style="font-size:7px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.06em;margin-bottom:1px;">CAGR promedio 5Y</div><div id="cagr-big" style="font-size:20px;font-weight:600;color:${cagrColor(cagr5.avg)};line-height:1;">${cagr5.avg>=0?'+':''}${cagr5.avg.toFixed(0)}%</div></div>
      </div>
    </div>
    <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:${_dm()?'#1c2333':'#f7f6f3'};">
          <th style="text-align:left;padding:6px 10px;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border);" rowspan="2">Modelo</th>
          ${co.pY.map((y,i)=>`<th colspan="2" style="text-align:center;padding:5px 4px;font-weight:600;border-bottom:1px solid var(--border);${i===4?`background:${_dm()?'#0c1832':'#eff6ff'};color:${_dm()?'#7ab4f5':'#1e3a5f'};`:'color:#2563eb;'}">${y}E</th>`).join('')}
          <th style="text-align:center;padding:5px 8px;font-weight:600;color:#1e3a5f;border-bottom:2px solid var(--border);background:${_dm()?'#0c1832':'#eff6ff'};" rowspan="2">CAGR<br>5Y</th>
        </tr>
        <tr style="background:#fafaf9;">
          ${co.pY.map(()=>`<td style="text-align:center;font-size:8px;color:var(--muted);padding:2px 3px;border-bottom:2px solid var(--border);">Precio</td><td style="text-align:center;font-size:8px;color:var(--muted);padding:2px 3px;border-bottom:2px solid var(--border);">Pot.</td>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${[{id:'ptr-per',label:'PER',data:rowPER,cagrV:cagr5.per,cagrId:'cagr-per',c:'#7c3aed',evfRow:false},{id:'ptr-evf',label:'EV/FCF ★',data:rowEVF,cagrV:cagr5.evf,cagrId:'cagr-evf',c:'#b45309',evfRow:true},{id:'ptr-eveb',label:'EV/EBITDA',data:rowEVEB,cagrV:cagr5.eveb,cagrId:'cagr-eveb',c:'#2563eb',evfRow:false},{id:'ptr-evei',label:'EV/EBIT',data:rowEVEI,cagrV:cagr5.evei,cagrId:'cagr-evei',c:'#16a34a',evfRow:false},{id:'ptr-avg',label:'Promedio',data:rowAvg,cagrV:cagr5.avg,cagrId:'cagr-avg',c:'#1e3a5f',bold:true}].map(row=>{
          const boldBg=_dm()?'background:#0c1832;':'background:#eff6ff;';
          const evfBg=_dm()?'background:#1a1000;':'background:#fff8f0;';
          const evfBgR=row.evfRow?evfBg:'';
          return`<tr style="border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};${row.bold?boldBg:row.evfRow?'background:#fffbf0;':''}">
            <td style="padding:6px 10px;font-weight:${row.bold||row.evfRow?'800':'600'};color:${row.c};border-left:3px solid ${row.c};white-space:nowrap;">${row.label}</td>
            ${row.data.map((v,i)=>{const up=(v-price)/price*100;return`<td id="${row.id}-${i}" style="text-align:right;padding:5px 4px;${evfBgR}border-right:none;"><div class="ptv" style="font-size:11px;font-weight:${row.bold||row.evfRow?'800':'600'};color:${potColor(up)};">${curSymG()}${N(v)}</div></td><td style="text-align:left;padding:5px 2px 5px 1px;${evfBgR}border-right:1px solid ${_dm()?'#2a3a52':'#f0ede8'};"><div class="ptp" style="font-size:10px;font-weight:700;color:${potColor(up)};">${up>=0?'+':''}${up.toFixed(0)}%</div></td>`;}).join('')}
            <td style="text-align:center;padding:6px 8px;background:${_dm()?'#0c1832':'#eff6ff'};"><span id="${row.cagrId}-5y" style="font-size:14px;font-weight:600;color:${cagrColor(row.cagrV)};">${row.cagrV>=0?'+':''}${row.cagrV.toFixed(0)}%</span></td>
          </tr>`;
        }).join('')}
        <tr style="background:${_dm()?'#161b27':'#f9f8f6'};border-top:1px solid var(--border);">
          <td style="padding:4px 10px;font-size:9px;color:var(--muted);font-style:italic;">MdS / Potencial EV/FCF<br><span style="font-size:8px;">(objetivo−precio)/precio · mismo criterio que el veredicto</span></td>
          ${rowEVF.map((v,i)=>{const p=(v-price)/price*100;return`<td colspan="2" style="text-align:center;padding:4px 3px;"><span id="ptr-mds-${i}" style="font-weight:700;font-size:10px;color:${potColor(p)};">${p>=0?'+':''}${p.toFixed(0)}%</span></td>`;}).join('')}
          <td style="background:${_dm()?'#0c1832':'#eff6ff'};"></td>
        </tr>
      </tbody>
    </table></div>
  </div>

  <!-- RETORNO OBJETIVO -->
  <div style="margin-bottom:10px;">
    <div class="card" style="padding:12px 14px;">
      <div class="ctitle">Precio de compra para retorno objetivo</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:5px;background:#fff7e6;border:1.5px solid #f59e0b;border-radius:8px;padding:5px 10px;">
          <input type="number" value="${ret}" id="ni-ret" style="width:45px;font-size:18px;font-weight:600;color:#1e3a5f;border:none;background:transparent;outline:none;text-align:center;" oninput="ret=+this.value;recalc()"/>
          <span style="font-size:13px;font-weight:700;color:#b45309;">% anual</span>
        </div>
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:var(--muted);">Horizonte:</span>
          <select onchange="hor=+this.value;recalc();" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:11px;font-weight:600;background:#fff;">${[1,2,3,4,5].map(y=>`<option value="${y}" ${y===hor?'selected':''}>${y}a</option>`).join('')}</select>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:9px;flex-wrap:wrap;gap:6px;">
        <div><div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">Comprar a no más de (EV/FCF, ${hor}a)</div><div id="ret-price" style="font-size:22px;font-weight:600;color:#1e3a5f;">${curSymG()}${N(priceForRet)}</div></div>
        <div style="text-align:right;"><div style="font-size:9px;color:var(--muted);margin-bottom:2px;">vs precio actual</div><div id="ret-diff" style="font-size:18px;font-weight:600;color:${cu(diffRet)};">${diffRet>=0?'+':''}${diffRet.toFixed(0)}%</div></div>
      </div>
    </div>
  </div>

  
  <!-- IS MODEL — ALWAYS OPEN, COLLAPSIBLE -->
  <div class="card" style="padding:0;overflow:hidden;margin-bottom:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${_dm()?'#161b27':'#f9f8f6'};cursor:pointer;user-select:none;" onclick="var b=this.nextElementSibling;b.style.display=b.style.display==='none'?'block':'none';this.querySelector('.is-arrow').style.transform=b.style.display!=='none'?'rotate(180deg)':'';">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:#1e3a5f;">Proyecciones IS / FCF</span>
        <div onclick="event.stopPropagation();" style="display:inline-flex;align-items:center;background:${_dm()?'#1c2333':'#e9ecf0'};border-radius:9px;padding:2px;gap:2px;">
          <span style="font-size:8px;color:#64748b;font-weight:700;padding:0 4px;">Valorar con:</span>
          <button onclick="event.stopPropagation();setProjSource('sheet')" title="Valorar con las proyecciones de tu hoja (Excel/TIKR)" style="font-size:9px;padding:3px 9px;border-radius:7px;border:none;cursor:pointer;font-weight:${_projSource==='sheet'?'800':'700'};background:${_projSource==='sheet'?(_dm()?'#1c2a42':'#fff'):'transparent'};color:${_projSource==='sheet'?(_dm()?'#7ab4f5':'#1e3a5f'):'#94a3b8'};box-shadow:${_projSource==='sheet'?'0 1px 3px rgba(0,0,0,.14)':'none'};">Excel</button>
          <button onclick="event.stopPropagation();setProjSource('auto')" title="Valorar con las proyecciones web actualizadas (editables)" style="font-size:9px;padding:3px 9px;border-radius:7px;border:none;cursor:pointer;font-weight:${_projSource==='auto'?'800':'700'};background:${_projSource==='auto'?(_dm()?'#0c2233':'#fff'):'transparent'};color:${_projSource==='auto'?(_dm()?'#39c5cf':'#0891b2'):'#94a3b8'};box-shadow:${_projSource==='auto'?'0 1px 3px rgba(0,0,0,.14)':'none'};">🤖 Web</button>
        </div>
        ${_isEdited?'<span style="font-size:8px;font-weight:700;color:#d97706;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:1px 6px;">editado</span>':''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${(_isEdited||_projSource==='auto')?`<button onclick="event.stopPropagation();setProjSource('sheet')" title="Volver a las proyecciones de tu hoja" style="font-size:9px;padding:2px 8px;border-radius:10px;border:1px solid var(--border);cursor:pointer;background:${_dm()?'#1c2333':'#fff'};font-weight:600;color:var(--muted);">↺ Reset a hoja</button>`:''}
        <span class="is-arrow" style="font-size:12px;color:var(--muted);transition:transform .2s;transform:rotate(180deg);">▾</span>
      </div>
    </div>
    <div style="padding:10px 14px;display:block;">
      <div style="font-size:9px;color:var(--muted);margin-bottom:7px;line-height:1.5;">
        Cada celda muestra las 2 opciones: <b style="color:#1e3a5f;">Excel</b> (tu hoja) y <b style="color:#0891b2;">🤖 Web</b> (${_wp&&_wp.src==='fmp'?`consenso de analistas FMP${_wp.nA?' · '+_wp.nA+' analistas':''}`:_wp&&_wp.src==='sec'?'modelo sobre datos SEC (sin consenso FMP)':getFMPKey()?'consenso FMP':'modelo SEC'}). El botón de arriba elige con cuál se <b>VALORA</b> (precios objetivo + veredicto). ${_wp&&_wp.src==='fmp'?'<b style="color:#0891b2;">Los años web salen de FMP → ya en 2027e+ (2026 es definitivo).</b>':''}
        ${!_wp?'<span style="color:#0891b2;"> (cargando consenso…)</span>':''}${_wp&&_wp.error?'<span style="color:#dc2626;"> '+_wp.error+'</span>':''}
        <button onclick="event.stopPropagation();promptFMPKey()" style="font-size:9px;padding:1px 7px;border-radius:8px;border:1px solid ${getFMPKey()?'#bbf7d0':'#a5f3fc'};background:${getFMPKey()?(_dm()?'#0d2117':'#f0fdf4'):(_dm()?'#0c1e2a':'#ecfeff')};color:#0891b2;cursor:pointer;font-weight:700;margin-left:4px;">${getFMPKey()?'🔑 FMP conectado ✓':'🔑 Conectar FMP (consenso analistas)'}</button>
      </div>
      <div style="overflow-x:auto;"><table class="is-tbl" style="font-size:10px;"><thead><tr><th style="text-align:left;min-width:90px;">Métrica</th>${_activeYears.map(y=>`<th style="text-align:right;color:#2563eb;">${y}E</th>`).join('')}</tr></thead><tbody>
        ${[{lbl:'% Crec. Ventas',nm:'isSG',ok:'sg',st:'0.5'},{lbl:'Mg. EBIT %',nm:'isEM',ok:'em',st:'0.1'},{lbl:'Tax Rate %',nm:'isTR',ok:'tr',st:'0.5'},{lbl:'Dil. Acc. %',nm:'isDI',ok:'di',st:'0.1'},{lbl:'CapEx/Vtas %',nm:'isCX',ok:'cx',st:'0.1'},{lbl:'WC/Vtas %',nm:'isWC',ok:'wc',st:'1',last:true}].map(r=>{const arr={isSG,isEM,isTR,isDI,isCX,isWC}[r.nm];return `<tr style="background:#fffbeb;${r.last?'border-bottom:2px solid var(--border);':''}"><td style="color:#d97706;font-weight:700;">${r.lbl}</td>${_activeYears.map((y,i)=>{
          const exV=(_excelByYear[y]&&_excelByYear[y][r.ok]!=null)?_excelByYear[y][r.ok]:null;
          const wbV=(_webByYear[y]&&_webByYear[y][r.ok]!=null)?_webByYear[y][r.ok]:null;
          const sLine=_projSource==='sheet'
            ? `<span style="font-size:8px;"></span><input class="isinp" type="number" value="${arr[i]!=null?arr[i]:(exV!=null?exV:'')}" step="${r.st}" onchange="${r.nm}[${i}]=+this.value;_isEdited=true;recalc()"/>`
            : `<span style="font-size:8px;"></span><span style="font-size:9px;color:#64748b;font-weight:700;min-width:24px;text-align:right;">${exV!=null?exV:'—'}</span>`;
          const wLine=`<span style="font-size:8px;">🤖</span><span style="font-size:9px;color:#0891b2;font-weight:700;min-width:24px;text-align:right;">${wbV!=null?wbV:'—'}</span>`;
          return `<td style="text-align:center;padding:3px 4px;">
            <div style="display:flex;align-items:center;justify-content:center;gap:2px;${_projSource==='sheet'?'':'opacity:.65;'}">${sLine}<span style="font-size:8px;color:#94a3b8;">%</span></div>
            <div style="display:flex;align-items:center;justify-content:center;gap:2px;margin-top:2px;${_projSource==='auto'?'':'opacity:.65;'}">${wLine}<span style="font-size:8px;color:#94a3b8;">%</span></div>
          </td>`;}).join('')}</tr>`;}).join('')}
        ${[{l:"Ventas",k:"s",c:"#2563eb",f:v=>curSymG()+N(Math.round(v))},{l:"EBIT",k:"ebit",c:"#b45309",f:v=>curSymG()+N(Math.round(v))},{l:"FCF",k:"fcf",c:"#16a34a",f:v=>curSymG()+N(Math.round(v))},{l:"EPS",k:"eps",c:"#d97706",f:v=>curSymG()+N(v,2)}].map(r=>`<tr style="background:${_dm()?'#161b27':'#f9f8f6'};"><td style="color:${r.c};font-weight:700;">${r.l}</td>${isM.map(m=>`<td class="isres" style="color:${r.c}">${r.f(m[r.k])}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>

  </div>`;
}
