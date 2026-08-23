// ─────────────────────────────────────────────────────────────
// Render MOAT + DCF interactivo + modal de gráfico por métrica
// ─────────────────────────────────────────────────────────────
function rMoat(){
  const m=calcMoat();
  return`<div class="card" style="background:${m.color}07;border-color:${m.color}35;margin-bottom:14px;"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;"><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;">Puntuación MOAT Global</div><div style="display:flex;align-items:baseline;gap:10px;"><div style="font-size:56px;font-weight:600;color:${m.color};line-height:1">${m.overall}</div><div><div style="font-size:12px;color:var(--muted)">/100</div><div style="font-size:16px;font-weight:700;color:${m.color}">${m.label}</div></div></div></div><div style="min-width:220px;flex:1;max-width:300px;"><div class="moat-bar-wrap"><div class="moat-fill" style="width:${m.overall}%;background:linear-gradient(90deg,#d97706,${m.color});"></div></div><p style="font-size:12px;color:var(--sub);line-height:1.65;margin-top:8px;">Puntuación compuesta de <strong>10 criterios cuantitativos ponderados</strong>.</p></div></div></div>
  <div class="card"><div class="ctitle">Criterios detallados</div>${m.items.map(it=>{const bc=it.s>=85?'#16a34a':it.s>=65?'#0891b2':it.s>=50?'#d97706':'#dc2626',bg2=it.s>=85?'#f0fdf4':it.s>=65?'#f0fdfa':it.s>=50?'#fffbeb':'#fef2f2',bd2=it.s>=85?'#bbf7d0':it.s>=65?'#99f6e4':it.s>=50?'#fde68a':'#fecaca';return`<div class="crit" style="background:${bg2};border-color:${bd2};"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;"><div style="flex:1;"><div class="crit-name">${it.n} <span style="font-size:10px;color:var(--muted);font-weight:400;">Peso: ${it.w}%</span></div><div class="crit-why">${it.why}</div></div><div style="text-align:center;min-width:46px;"><div style="font-size:26px;font-weight:600;color:${bc};line-height:1">${it.s}</div><div style="font-size:10px;color:var(--muted)">/100</div></div></div><div class="crit-row"><div class="crit-prog"><div class="crit-fill" style="width:${it.s}%;background:${bc};"></div></div><span class="score-badge" style="color:${bc}">${it.s}/100</span></div></div>`;}).join('')}</div>
  <div style="padding:12px 16px;background:${_dm()?'#0c1832':'#eff6ff'};border:1px solid #bfdbfe;border-radius:12px;font-size:12px;color:#1e40af;">85+ = Excepcional · 70-84 = Sólido · 55-69 = Moderado · &lt;55 = Débil.</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// DCF — Enhanced with Reverse DCF + Stress Test cards
// ═══════════════════════════════════════════════════════════════════
function rDCF(){
  const dcf=calcDCF(),ud=(dcf-price)/price*100;
  const rev=calcReverseDCF(),stress=calcStressDCF();
  const revColor=rev.diff>10?'#dc2626':rev.diff>2?'#d97706':'#16a34a';
  const stressColor=stress.impact<-30?'#dc2626':stress.impact<-15?'#d97706':'#16a34a';

  return`<div class="two-col">
  <div>
    <!-- DCF PARAMS (moved from Valoracion) -->
    <div class="card" style="margin-bottom:12px;">
      <div class="ctitle">Parámetros DCF — Ajusta las hipótesis del modelo
        <span data-tip="dcf" style="cursor:pointer;color:#2563eb;font-weight:700;border:1px solid #2563eb55;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;margin-left:4px;">i</span>
        <span data-tip="wacc" style="cursor:pointer;font-size:9px;font-weight:700;color:#6b7280;border:1px solid #6b728055;border-radius:10px;padding:1px 7px;margin-left:4px;">WACC ⓘ</span>
      </div>
      <div class="dcf-info-box">Fórmula: DCF = Σ[FCF×(1+g)ⁿ/(1+r)ⁿ] + TV×/(1+r)¹⁰ donde TV=FCF₁₀×(1+g)/(r−g)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
        ${[['gr','Crecimiento FCF (10a)',gr,0,30,0.5,'%','#2563eb','CAGR hist: ~'+((((Math.pow(Math.max(co.fcf[9],.01)/Math.max(co.fcf[0],.01),1/9))-1)*100).toFixed(0))+'%'],['dr','Tasa de descuento',dr,6,20,0.5,'%','#1e3a5f','WACC ~10%'],['tg','Crecimiento terminal',tg,0,5,0.5,'%','#7c3aed','PIB nominal ~4-5%']].map(p=>`<div>${sld(p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8])}</div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 12px;background:${(calcDCF()-price)/price*100>=0?'#f0fdf4':'#fef2f2'};border-radius:8px;margin-top:8px;border:1px solid ${(calcDCF()-price)/price*100>=0?'#bbf7d0':'#fecaca'};">
        <span style="font-size:12px;color:var(--muted);">Valor DCF intrínseco</span>
        <span id="dcf-main-val" style="font-size:18px;font-weight:600;color:${cu((calcDCF()-price)/price*100)};">${curSymG()}${N(dcf)} <span style="font-size:11px;">(${ud>=0?'+':''}${ud.toFixed(1)}%)</span></span>
      </div>
    </div>

    <!-- Reverse DCF Card -->
    <div class="rev-dcf-card" style="margin-bottom:12px;">
      <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Reverse DCF — ¿Qué crecimiento descuenta el precio actual?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;">
        <div>
          <div style="font-size:9px;color:#92400e;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">CAGR FCF implícito en precio</div>
          <div style="font-size:42px;font-weight:600;color:${revColor};line-height:1;">${rev.impliedG}%</div>
          <div style="font-size:11px;color:#92400e;margin-top:6px;">vs histórico <strong>${rev.historicalFCFCagr}%</strong> → <span style="font-weight:700;color:${revColor};">${rev.diff>=0?'+':''}${rev.diff}pp diferencia</span></div>
        </div>
        <div style="background:rgba(255,255,255,.8);border-radius:10px;padding:12px;">
          <div style="font-size:9px;color:#92400e;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Interpretación</div>
          <div style="font-size:11px;color:#92400e;line-height:1.6;">${rev.label}</div>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <div style="text-align:center;flex:1;background:#fffbeb;border-radius:8px;padding:6px;border:1px solid #fde68a;">
              <div style="font-size:9px;color:#92400e;text-transform:uppercase;">Implícito</div>
              <div style="font-size:16px;font-weight:600;color:${revColor};">${rev.impliedG}%</div>
            </div>
            <div style="text-align:center;flex:1;background:#fffbeb;border-radius:8px;padding:6px;border:1px solid #fde68a;">
              <div style="font-size:9px;color:#92400e;text-transform:uppercase;">Histórico</div>
              <div style="font-size:16px;font-weight:600;color:#16a34a;">${rev.historicalFCFCagr}%</div>
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top:10px;padding:9px 12px;background:rgba(255,255,255,.6);border-radius:8px;font-size:11px;color:#92400e;">💡 <strong>Cómo leerlo:</strong> Si el implícito &lt; histórico, el mercado descuenta MENOS que lo que la empresa ha demostrado crecer — potencial señal de infravaloración. Si el implícito &gt; histórico, el mercado exige que la empresa mejore su historial.</div>
    </div>

    <!-- Stress Test Card -->
    <div class="stress-card" style="margin-bottom:12px;">
      <div style="font-size:10px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">🔴 Stress Test Recesión — Escenario adverso 10Y</div>
      <div style="font-size:11px;color:#991b1b;margin-bottom:10px;">Supuestos: Año 1: ventas −20%, margen FCF −5pp | Año 2: ventas −5%, margen −3pp | Año 3: recovery +12% | Años 4-10: vuelta al crecimiento base (${gr}%)</div>
      <div class="stress-grid">
        ${[{l:'DCF Base',v:''+curSymG()+N(stress.baseDCF),c:'#16a34a'},{l:'DCF Estresado',v:''+curSymG()+N(stress.stressedDCF),c:stressColor},{l:'Impacto en DCF',v:stress.impact+'%',c:stressColor},{l:'Upside Estresado',v:(stress.upsideStress>=0?'+':'')+stress.upsideStress+'%',c:stress.upsideStress>=0?'#16a34a':'#dc2626'},{l:'FCF Mínimo (Año1)',v:''+curSymG()+N(stress.fcf1)+'M',c:'#dc2626'},{l:'Caída FCF vs 2025',v:stress.fcfDrop.toFixed(1)+'%',c:'#dc2626'}].map(m=>`<div style="background:rgba(255,255,255,.8);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(239,68,68,.25);"><div style="font-size:9px;color:#991b1b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;font-weight:600;">${m.l}</div><div style="font-size:18px;font-weight:600;color:${m.c};">${m.v}</div></div>`).join('')}
      </div>
      <div style="margin-top:10px;padding:9px 12px;background:rgba(255,255,255,.6);border-radius:8px;font-size:11px;color:#991b1b;">
        ${stress.upsideStress>20?'🟢 Incluso en recesión severa el precio actual ofrece margen de seguridad sólido. El negocio muestra alta resiliencia.':stress.upsideStress>0?'🟡 En recesión el margen de seguridad se estrecha. Posición de tamaño moderado recomendable.':'🔴 En recesión el precio actual ya no ofrece margen de seguridad. Alta volatilidad potencial si se materializan los riesgos.'}
      </div>
    </div>
  </div>

  <div>
    <div class="card">
      <div class="ctitle">Parámetros DCF</div>
      <div class="dcf-info-box"><strong>DCF:</strong> Descuenta flujos futuros al presente. Fórmula: Σ [FCF_n/(1+r)^n] + TV/(1+r)^10 donde TV=FCF₁₀×(1+g)/(r−g).</div>
      ${sld('gr','Crecimiento FCF (10 años)',gr,0,30,0.5,'%','#2563eb','CAGR histórico: ~'+((((Math.pow(Math.max(co.fcf[9],.01)/Math.max(co.fcf[0],.01),1/9))-1)*100).toFixed(0))+'%')}
      ${sld('dr','Tasa de descuento',dr,6,20,0.5,'%','#1e3a5f','WACC ~10%')}
      ${sld('tg','Crecimiento terminal',tg,0,5,0.5,'%','#7c3aed','PIB nominal ~4-5%')}
      <div style="display:flex;justify-content:space-between;padding:9px 12px;background:${ud>=0?'#f0fdf4':'#fef2f2'};border-radius:8px;margin-top:8px;border:1px solid ${ud>=0?'#bbf7d0':'#fecaca'};"><span style="font-size:12px;color:var(--muted);">Valor DCF intrínseco</span><span style="font-size:18px;font-weight:600;color:${cu(ud)};">${curSymG()}${N(dcf)} <span style="font-size:11px;">(${ud>=0?'+':''}${ud.toFixed(1)}%)</span></span></div>
    </div>
    <div class="card">
      <div class="ctitle">Sensibilidad DCF — Crec. FCF × Tasa descuento</div>
      <div style="overflow-x:auto;"><table class="sens-tbl"><thead><tr><th style="text-align:left;">FCF↓ Desc→</th>${[7,8,9,10,11,12,13].map(d=>`<th style="text-align:center;background:${d===dr?'#2563eb18':'#f7f6f3'};color:${d===dr?'#2563eb':'var(--muted)'};font-weight:${d===dr?'700':'400'}">${d}%</th>`).join('')}</tr></thead><tbody>${[8,10,12,15,18,20,25].map(g=>`<tr><td style="background:${g===gr?'#b4530918':'#f7f6f3'};color:${g===gr?'#b45309':'var(--muted)'};font-weight:${g===gr?'700':'400'};padding:5px 8px;">${g}%</td>${[7,8,9,10,11,12,13].map(d=>{if(d<=tg+1)return`<td class="sens-td" style="background:${_dm()?'#1c2333':'#f7f6f3'};color:var(--muted)">—</td>`;let pv=0;for(let i=1;i<=10;i++)pv+=(co.fcf[9]*Math.pow(1+g/100,i))/Math.pow(1+d/100,i);const tv=(co.fcf[9]*Math.pow(1+g/100,10)*(1+tg/100))/(d/100-tg/100);const val=(pv+tv/Math.pow(1+d/100,10)-co.netDebt[9])/co.shares,up=(val-price)/price*100,isA=g===gr&&d===dr;return`<td class="sens-td" style="background:${isA?'#d9770618':cbg(up)};color:${isA?'#d97706':cu(up)};border:${isA?'2px solid #d9770650':'none'};font-weight:${isA?'700':'400'}"><div>${curSymG()}${N(val)}</div><div style="font-size:9px">${up>0?'+':''}${up.toFixed(0)}%</div></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
    </div>
    <div class="card">
      <div class="ctitle">Sensibilidad g terminal — Crec. FCF × g perpetuo</div>
      <div style="overflow-x:auto;"><table class="sens-tbl"><thead><tr><th style="text-align:left;">FCF↓ g→</th>${[1,1.5,2,2.5,3,3.5,4].map(g=>`<th style="text-align:center;background:${g===tg?'#7c3aed18':'#f7f6f3'};color:${g===tg?'#7c3aed':'var(--muted)'};font-weight:${g===tg?'700':'400'}">${g}%</th>`).join('')}</tr></thead><tbody>${[8,10,12,15,18,20].map(g=>`<tr><td style="background:${g===gr?'#2563eb18':'#f7f6f3'};color:${g===gr?'#2563eb':'var(--muted)'};font-weight:${g===gr?'700':'400'};padding:5px 8px;">${g}%</td>${[1,1.5,2,2.5,3,3.5,4].map(tg2=>{if(dr<=tg2+0.5)return`<td class="sens-td" style="background:${_dm()?'#1c2333':'#f7f6f3'};color:var(--muted)">—</td>`;let pv=0;for(let i=1;i<=10;i++)pv+=(co.fcf[9]*Math.pow(1+g/100,i))/Math.pow(1+dr/100,i);const tv2=(co.fcf[9]*Math.pow(1+g/100,10)*(1+tg2/100))/(dr/100-tg2/100);const val=(pv+tv2/Math.pow(1+dr/100,10)-co.netDebt[9])/co.shares,up=(val-price)/price*100,isA=g===gr&&tg2===tg;return`<td class="sens-td" style="background:${isA?'#7c3aed18':cbg(up)};color:${isA?'#7c3aed':cu(up)};border:${isA?'2px solid #7c3aed50':'none'};font-weight:${isA?'700':'400'}"><div>${curSymG()}${N(val)}</div><div style="font-size:9px">${up>0?'+':''}${up.toFixed(0)}%</div></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
    </div>
  </div>
  </div>`;
}
function refreshDCFSim(){} // placeholder if needed

// ═══════════════════════════════════════════════════════════════════
// ALERTAS
// ═══════════════════════════════════════════════════════════════════
// ── Gráfico ampliado de una partida (clic en Análisis) para ver la tendencia ──
let _metricChartInst=null;
async function openMetricChart(el){
  await ensureChart(); if(typeof Chart==='undefined') return;
  const series=(el.dataset.cs||'').split(',').map(v=>v===''?null:+v);
  if(!series.length) return;
  const label=el.dataset.cl||'', color=el.dataset.color||'#2563eb', unit=el.dataset.cu||'';
  const fmt=unit==='%'?(v=>(Math.round(v*10)/10)+'%'):unit==='$'?(v=>''+curSymG()+N(v,2)):(v=>''+curSymG()+N(Math.round(v))+'M');
  const labels=co.years.slice(-series.length).map(String);
  let modal=document.getElementById('metric-modal');
  if(!modal){
    modal=document.createElement('div'); modal.id='metric-modal';
    modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2000;align-items:center;justify-content:center;padding:16px;';
    modal.addEventListener('click',e=>{if(e.target===modal)closeMetricChart();});
    modal.innerHTML=`<div style="background:${_dm()?'#161b27':'#fff'};border-radius:14px;padding:18px;max-width:700px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.25);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;"><div id="metric-modal-title" style="font-size:14px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};"></div><button onclick="closeMetricChart()" style="border:none;background:${_dm()?'#2a3a52':'#f0ede8'};border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:16px;flex-shrink:0;">✕</button></div><div style="position:relative;height:320px;"><canvas id="metric-modal-canvas"></canvas></div><div id="metric-modal-note" style="font-size:10px;color:var(--muted);margin-top:8px;"></div></div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('metric-modal-title').textContent=label+' · '+co.name;
  document.getElementById('metric-modal-note').textContent='Tendencia '+labels[0]+'–'+labels[labels.length-1]+(unit==='%'?' (%)':unit==='$'?' (por acción)':' (millones '+curSymG()+')')+'. Toca fuera o ✕ para cerrar.';
  modal.style.display='flex';
  if(_metricChartInst){try{_metricChartInst.destroy();}catch(e){}}
  _metricChartInst=new Chart(document.getElementById('metric-modal-canvas'),{type:'line',data:{labels,datasets:[{label,data:series,borderColor:color,backgroundColor:color+'18',fill:true,tension:.3,pointRadius:4,borderWidth:2.5,pointBackgroundColor:series.map(v=>v!=null&&v<0?'#dc2626':color)}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+(c.raw!=null?fmt(c.raw):'—')}}},scales:{x:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10}}},y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10},callback:v=>fmt(v)}}}}});
}
function closeMetricChart(){const m=document.getElementById('metric-modal');if(m)m.style.display='none';if(_metricChartInst){try{_metricChartInst.destroy();}catch(e){}_metricChartInst=null;}}
