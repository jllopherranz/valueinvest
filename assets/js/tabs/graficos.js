// ─────────────────────────────────────────────────────────────
// Pestaña Gráficos + gráfico de múltiplos históricos y escenarios
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// GRÁFICOS
// ═══════════════════════════════════════════════════════════════════
function rGraficos(){
  const H='position:relative;height:220px;'; // mismo tamaño para todos
  return`
  <div class="card"><div class="ctitle">Histórico — Ventas, FCF y EPS (${co.years[0]}–${co.years[9]})</div><div style="${H}"><canvas id="c-hist"></canvas></div><div class="chart-note">Ventas y FCF en ${curSymG()}M (eje izq) · EPS en ${curSymG()} (eje der)</div></div>
  <div class="card"><div class="ctitle">Proyecciones de tu hoja — Ventas, FCF y EPS (${co.pY[0]}–${co.pY[4]})</div><div style="${H}"><canvas id="c-proj"></canvas></div><div class="chart-note">Estimaciones de tu Excel · mismo formato que el histórico (Ventas/FCF ${curSymG()}M eje izq · EPS ${curSymG()} eje der)</div></div>
  <div class="card"><div class="ctitle">Márgenes históricos — EBITDA %, EBIT % y FCF %</div><div style="${H}"><canvas id="c-mg"></canvas></div></div>
  <div class="card"><div class="ctitle">ROIC vs WACC (${co.wacc}%) — Creación de valor</div><div style="${H}"><canvas id="c-roic"></canvas></div><div class="chart-note">Verde = ROIC > WACC (crea valor) · Rojo = destruye valor</div></div>
  <div class="card"><div class="ctitle">💹 Múltiplos históricos — EV/FCF y PER</div><div style="${H}"><canvas id="c-mult"></canvas></div><div class="chart-note">Línea punteada = mediana histórica</div></div>`;
}

// ═══════════════════════════════════════════════════════════════════
// VALORACIÓN
// ═══════════════════════════════════════════════════════════════════
let _multVisible={evfcf:true,per:false,evebitda:false,evebit:false};
let _multChartInst=null;

// ── Escenarios por empresa = percentiles de SU propio histórico de múltiplos ──
// Optimista P90 (re-rating alto) · Base mediana (P50) · Conservador = min(P25, mediana últimos 3 años)
// (capta normalización tras burbujas, ej. NVDA) · Pesimista P10 (suelo). Robusto a un pico aislado.
function _pctile(sortedAsc,q){
  if(!sortedAsc.length) return null;
  if(sortedAsc.length===1) return sortedAsc[0];
  const i=q*(sortedAsc.length-1),lo=Math.floor(i),hi=Math.ceil(i);
  return sortedAsc[lo]+(sortedAsc[hi]-sortedAsc[lo])*(i-lo);
}
function _seriesStats(series){
  const clean=(series||[]).filter(v=>v!=null&&v>0);
  if(!clean.length) return null;
  const sorted=[...clean].sort((a,b)=>a-b);
  const last3=clean.slice(-3); const s3=[...last3].sort((a,b)=>a-b);
  return {p90:_pctile(sorted,0.90),p50:_pctile(sorted,0.50),p25:_pctile(sorted,0.25),p10:_pctile(sorted,0.10),med3:_pctile(s3,0.5)};
}
function scenarioMults(){
  const me=(co.medEvEbit||Math.round(co.medEvEbitda*co.ebitdaM[9]/Math.max(co.ebitM[9],1)));
  const metrics={evf:co.hEvF,per:co.hPER,eve:co.hEvEbitda,evei:co.hEvEbit};
  const fb={evf:(co.med5EvFcf||co.medEvFcf),per:(co.med5PER||co.medPER),eve:(co.med5EvEbitda||co.medEvEbitda),evei:me};
  const R={opt:{},base:{},cons:{},pes:{}};
  for(const k in metrics){
    const st=_seriesStats(metrics[k]);
    if(!st){ const b=fb[k]||0; R.opt[k]=Math.round(b); R.base[k]=Math.round(b*0.85); R.cons[k]=Math.round(b*0.7); R.pes[k]=Math.round(b*0.5); continue; }
    R.opt[k]=Math.max(1,Math.round(st.p90));
    R.base[k]=Math.max(1,Math.round(st.p50));
    R.cons[k]=Math.max(1,Math.round(Math.min(st.p25,st.med3)));
    R.pes[k]=Math.max(1,Math.round(st.p10));
  }
  return R;
}
function applyScenario(key,evf,per,eve,evei){
  tEVF=evf;tPER=per;tEVE=eve;tEVEI=evei;
  _persistMults(); // guarda como mis últimos múltiplos para esta empresa
  const map={tEVF:evf,tPER:per,tEVE:eve,tEVEI:evei};
  Object.entries(map).forEach(([id,val])=>{
    const inp=document.getElementById('ni-'+id);
    if(inp){inp.value=val;inp.style.background='#fef08a';setTimeout(()=>{if(inp)inp.style.background='#fff7e6';},350);}
  });
  const colors={hoja:'#1e3a5f',opt:'#16a34a',base:'#2563eb',cons:'#d97706',pes:'#dc2626'};
  Object.keys(colors).forEach(k=>{
    const btn=document.getElementById('scen-btn-'+k);if(!btn) return;
    if(k===key){btn.style.border='2.5px solid '+colors[k];btn.style.boxShadow='0 2px 8px '+colors[k]+'35';btn.style.transform='scale(1.04)';}
    else{btn.style.border='2px solid '+colors[k]+'35';btn.style.boxShadow='none';btn.style.transform='scale(1)';}
  });
  recalc();
}
function clearScenBtn(){
  const colors={hoja:'#1e3a5f',opt:'#16a34a',base:'#2563eb',cons:'#d97706',pes:'#dc2626'};
  Object.keys(colors).forEach(k=>{const btn=document.getElementById('scen-btn-'+k);if(btn){btn.style.border='2px solid '+colors[k]+'35';btn.style.boxShadow='none';btn.style.transform='scale(1)';}});
}
function toggleMultSeries(key){
  _multVisible[key]=!_multVisible[key];
  const btn=document.getElementById('btn-'+key);
  const colors={evfcf:'#b45309',per:'#7c3aed',evebitda:'#2563eb',evebit:'#16a34a'};
  if(btn){if(_multVisible[key]){btn.style.background=colors[key];btn.style.borderColor=colors[key];btn.style.color='#fff';}else{btn.style.background='transparent';btn.style.borderColor='var(--border)';btn.style.color='var(--muted)';}}
  buildMultHistChart();
}
async function buildMultHistChart(){
  await ensureChart(); if(typeof Chart==='undefined') return;
  if(_multChartInst){try{_multChartInst.destroy();}catch(e){}}_multChartInst=null;
  const c=document.getElementById('c-mult-hist');if(!c) return;
  const gc='rgba(0,0,0,0.04)',tc='#9a958e',ny=co.years.length,labels=[...co.years.map(String),(co.pY&&co.pY[0]?co.pY[0]+'e':'2026e')],n=labels.length;
  const _ism=calcISModel()[0]; // proyección 2026e (misma fuente que la hoja)
  const _evF=price*_ism.sh+_ism.nd; // EV con acciones/deuda proyectadas (como la hoja)
  const fwdPER=+(price/Math.max(_ism.eps,0.01)).toFixed(1),fwdEvF=+(_evF/Math.max(_ism.fcf,1)).toFixed(1),fwdEvEB=+(_evF/Math.max(_ism.eb,1)).toFixed(1),fwdEvEBIT=+(_evF/Math.max(_ism.ebit,1)).toFixed(1);
  const medEvEBIT=co.medEvEbit||(Math.round(co.medEvEbitda*co.ebitdaM[9]/Math.max(co.ebitM[9],1)));
  function withFwd(arr,fwd){const a=[...arr];while(a.length<ny)a.push(null);a.length=ny;a.push(fwd);return a;} // 2025 queda fijo, se añade 2026e
  const series={evfcf:{label:'EV/FCF',data:withFwd(co.hEvF,fwdEvF),color:'#b45309',med:co.medEvFcf},per:{label:'PER',data:withFwd(co.hPER,fwdPER),color:'#7c3aed',med:co.medPER},evebitda:{label:'EV/EBITDA',data:withFwd(co.hEvEbitda||[],fwdEvEB),color:'#2563eb',med:co.medEvEbitda},evebit:{label:'EV/EBIT',data:withFwd(co.hEvEbit||[],fwdEvEBIT),color:'#16a34a',med:medEvEBIT}};
  const datasets=[];
  Object.entries(series).forEach(([k,s])=>{
    if(!_multVisible[k]) return;
    datasets.push({label:s.label,data:s.data,borderColor:s.color,backgroundColor:s.color,pointRadius:s.data.map((_,i)=>i===n-1?5:3),pointBackgroundColor:s.data.map((_,i)=>i===n-1?'#fff':s.color),pointBorderColor:s.color,pointBorderWidth:s.data.map((_,i)=>i===n-1?2.5:1.5),borderWidth:2.5,tension:.3,spanGaps:true,fill:false,order:2});
    datasets.push({label:`Med. ${s.label} ${Math.round(s.med)}x`,data:Array(n).fill(s.med),borderColor:s.color,borderWidth:1.5,borderDash:[5,4],pointRadius:0,fill:false,order:1,tension:0,spanGaps:true});
  });
  if(datasets.length===0) return;
  _multChartInst=new Chart(c,{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:true,position:'top',labels:{font:{size:9},boxWidth:10,padding:8,usePointStyle:true,filter:item=>!item.text.startsWith('Med.')}},tooltip:{backgroundColor:'rgba(255,255,255,.97)',borderColor:'#e4e0d8',borderWidth:1,titleColor:'#1a1814',bodyColor:'#5a5650',padding:10,callbacks:{title:items=>'Año '+items[0].label,label:ctx=>ctx.raw!=null?` ${ctx.dataset.label}: ${Math.round(ctx.raw)}x`:null}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:9}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:9},callback:v=>Math.round(v)+'x'},suggestedMin:0}}}});
}
