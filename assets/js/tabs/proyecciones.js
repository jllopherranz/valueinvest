// ─────────────────────────────────────────────────────────────
// Render de la tabla de proyecciones editable
// ─────────────────────────────────────────────────────────────
function rProyecciones(){
  const isM=calcISModel();
  const pts=co.pY.map((yr,i)=>{
    const f=(co.pF[i]*tEVF-co.pND[i])/co.shares;
    const p=co.pEPS[i]*tPER;
    const e=(co.pEB[i]*tEVE-co.pND[i])/co.shares;
    const ei=(co.pEB[i]*tEVEI-co.pND[i])/co.shares; // EV/EBIT approx
    return{yr,f,p,e,ei,avg:(f+p+e)/3};
  });
  // Multi-scenario: percentiles del histórico de cada empresa (igual que la pestaña Valoración)
  const _sm=scenarioMults();
  const scenarios=[
    {key:'opt',l:'🐂 Optimista',evf:_sm.opt.evf,c:'#16a34a',bg:'#f0fdf4'},
    {key:'base',l:'⚖️ Base',evf:_sm.base.evf,c:'#2563eb',bg:'#eff6ff'},
    {key:'cons',l:'🐻 Conservador',evf:_sm.cons.evf,c:'#d97706',bg:'#fffbeb'},
    {key:'pes',l:'😱 Pesimista',evf:_sm.pes.evf,c:'#dc2626',bg:'#fef2f2'},
  ];
  const bps=[Math.round(price*0.6),Math.round(price*0.7),Math.round(price*0.8),Math.round(price*0.9),Math.round(price),Math.round(price*1.1),Math.round(price*1.2)];

  return`
  ${estimatedBanner()}
  <div class="card" style="margin-bottom:10px;">
    <div class="ctitle">Precio objetivo ${co.pY[0]}–${co.pY[4]} por escenario</div>
    <div style="position:relative;height:240px;margin-bottom:8px;"><canvas id="c-pt"></canvas></div>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:${_dm()?'#1c2333':'#f7f6f3'};"><th style="text-align:left;padding:6px 10px;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border);">Escenario</th><th style="text-align:center;padding:5px 6px;color:var(--muted);font-weight:600;border-bottom:2px solid var(--border);">Múltiplo EV/FCF</th>${co.pY.map(y=>`<th style="text-align:center;padding:5px 6px;color:#2563eb;font-weight:600;border-bottom:2px solid var(--border);">${y}E</th>`).join('')}<th style="text-align:center;padding:5px 6px;font-weight:600;color:#1e3a5f;border-bottom:2px solid var(--border);background:${_dm()?'#0c1832':'#eff6ff'};">CAGR 5Y</th></tr></thead>
      <tbody>${scenarios.map(sc=>{
        const targets=co.pF.map(fcf=>Math.round((fcf*sc.evf-co.netDebt[9])/co.shares));
        // Use IS model FCF instead for more accurate projection
        const tgts=isM.map(m=>Math.round((m.fcf*sc.evf-m.nd)/m.sh));
        const c5=((Math.pow(Math.max(tgts[4],1)/Math.max(price,1),0.2)-1)*100);
        return`<tr style="background:${sc.bg};"><td style="padding:6px 10px;font-weight:700;color:${sc.c};border-left:4px solid ${sc.c};">${sc.l}</td><td style="text-align:center;padding:5px 6px;font-weight:700;color:${sc.c};">${sc.evf}x</td>${tgts.map((v,i)=>{const up=(v-price)/price*100;return`<td style="text-align:center;padding:5px 4px;"><div style="font-size:12px;font-weight:700;color:${up>15?'#16a34a':up>0?'#2563eb':up>-15?'#d97706':'#dc2626'};">${curSymG()}${N(v)}</div><div style="font-size:9px;color:${up>=0?'#16a34a':'#dc2626'};">${up>=0?'+':''}${up.toFixed(0)}%</div></td>`;}).join('')}<td style="text-align:center;padding:5px 8px;font-weight:600;color:${c5>15?'#16a34a':c5>10?'#d97706':'#dc2626'};background:rgba(255,255,255,.5);">${c5>0?'+':''}${c5.toFixed(1)}%</td></tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>

  <div class="card">
    <div class="ctitle">CAGR esperado por precio de compra — Escenario base</div>
    <div style="overflow-x:auto;"><table class="ptbl"><thead><tr><th style="text-align:left;">Precio entrada</th>${co.pY.map(y=>`<th style="text-align:center;">→ ${y}</th>`).join('')}</tr></thead><tbody>${bps.map(bp=>`<tr style="background:${bp===Math.round(price)?co.color+'0d':''}"><td style="font-weight:${bp===Math.round(price)?'700':'400'};color:${bp===Math.round(price)?co.color:'var(--sub)'};">${curSymG()}${N(bp)}${bp===Math.round(price)?` <span style="font-size:9px;font-weight:700;background:${co.color}18;padding:1px 5px;border-radius:8px;color:${co.color};">ACTUAL</span>`:''}</td>${pts.map((t,i)=>{const c=((Math.pow(Math.max(t.avg,1)/Math.max(bp,1),1/(i+1))-1)*100);return`<td style="text-align:center;font-weight:700;color:${c>20?'#16a34a':c>15?'#16a34a':c>10?'#d97706':c>5?'#d97706':'#dc2626'}">${c.toFixed(1)}%</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
  </div>`;
}
