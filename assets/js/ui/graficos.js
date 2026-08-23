// ─────────────────────────────────────────────────────────────
// buildCharts(): despacha los gráficos Chart.js de cada pestaña
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════════
async function buildCharts(tab){
  await ensureChart(); if(typeof Chart==='undefined') return;
  const gc='rgba(0,0,0,0.06)',tc='#9a958e',cs=curSymG();   // cs = símbolo de la divisa de esta empresa
  const baseOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10}}}}};

  if(tab==='graficos'){
    const _vfeOpts={...baseOpts,plugins:{legend:{display:true,labels:{color:tc,font:{size:11},boxWidth:10,padding:12}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{position:'left',grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>v>=1000?cs+(v/1000).toFixed(0)+'K':cs+v}},y1:{position:'right',grid:{display:false},ticks:{color:'#d97706',font:{size:10},callback:v=>cs+v}}}};
    const cH=document.getElementById('c-hist');
    if(cH) charts.hist=new Chart(cH,{data:{labels:co.years.map(String),datasets:[
      {type:'bar',label:'Ventas ('+curSymG()+'M)',data:co.sales,backgroundColor:'#2563eb',borderRadius:4,yAxisID:'y',order:3},
      {type:'bar',label:'FCF ('+curSymG()+'M)',data:co.fcf,backgroundColor:'#16a34a',borderRadius:4,yAxisID:'y',order:2},
      {type:'line',label:'EPS ($)',data:co.eps,borderColor:'#d97706',backgroundColor:'#d97706',tension:.35,pointRadius:3,borderWidth:2.5,yAxisID:'y1',order:1}
    ]},options:_vfeOpts});
    const c2=document.getElementById('c-mg');
    if(c2) charts.mg=new Chart(c2,{type:'line',data:{labels:co.years,datasets:[{label:'EBITDA %',data:co.ebitdaM,borderColor:'#b45309',tension:.35,pointRadius:3,borderWidth:2.5},{label:'EBIT %',data:co.ebitM,borderColor:'#d97706',tension:.35,pointRadius:3,borderWidth:2,borderDash:[4,2]},{label:'FCF %',data:co.fcfM,borderColor:'#16a34a',tension:.35,pointRadius:3,borderWidth:2,borderDash:[7,3]}]},options:{...baseOpts,plugins:{legend:{display:true,labels:{color:tc,font:{size:11},boxWidth:10}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>v+'%'}}}}});
    const c3=document.getElementById('c-roic');
    if(c3){
      const roicBg=co.roic.map(v=>v>=co.wacc?'#16a34a80':'#dc262680');
      const roicBdr=co.roic.map(v=>v>=co.wacc?'#16a34a':'#dc2626');
      charts.roic=new Chart(c3,{type:'bar',data:{labels:co.years,datasets:[{label:'ROIC %',data:co.roic,backgroundColor:roicBg,borderColor:roicBdr,borderWidth:2,borderRadius:5},{label:`WACC ${co.wacc}%`,data:Array(co.years.length).fill(co.wacc),type:'line',borderColor:'#1e3a5f',borderWidth:2,borderDash:[5,3],pointRadius:0,fill:false}]},options:{...baseOpts,plugins:{legend:{display:true,labels:{color:tc,font:{size:11},boxWidth:10}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>v+'%'},min:0}}}});
    }
    const c4=document.getElementById('c-mult');
    if(c4) charts.mult=new Chart(c4,{type:'line',data:{labels:co.years,datasets:[{label:'EV/FCF',data:co.hEvF,borderColor:'#b45309',tension:.35,pointRadius:3,borderWidth:2.5,spanGaps:false},{label:'PER',data:co.hPER,borderColor:'#7c3aed',tension:.35,pointRadius:3,borderWidth:2,borderDash:[5,3],spanGaps:false},{label:`Med. EV/FCF ${Math.round(co.medEvFcf)}x`,data:Array(co.years.length).fill(co.medEvFcf),borderColor:'#b45309',borderWidth:1,borderDash:[3,3],pointRadius:0},{label:`Med. PER ${Math.round(co.medPER)}x`,data:Array(co.years.length).fill(co.medPER),borderColor:'#7c3aed',borderWidth:1,borderDash:[3,3],pointRadius:0}]},options:{...baseOpts,plugins:{legend:{display:true,labels:{color:tc,font:{size:11},boxWidth:10}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>Math.round(v)+'x'}}}}});
    const c5=document.getElementById('c-proj');
    if(c5&&co.pS&&co.pF&&co.pEPS) charts.proj=new Chart(c5,{data:{labels:co.pY.map(y=>y+'e'),datasets:[
      {type:'bar',label:'Ventas ('+curSymG()+'M)',data:co.pS,backgroundColor:'#2563eb',borderRadius:4,yAxisID:'y',order:3},
      {type:'bar',label:'FCF ('+curSymG()+'M)',data:co.pF,backgroundColor:'#16a34a',borderRadius:4,yAxisID:'y',order:2},
      {type:'line',label:'EPS ($)',data:co.pEPS,borderColor:'#d97706',backgroundColor:'#d97706',tension:.35,pointRadius:4,borderWidth:2.5,yAxisID:'y1',order:1}
    ]},options:_vfeOpts});
  }
  if(tab==='resumen'){
    setTimeout(()=>renderTechnicals(),80);   // análisis técnico bajo el gráfico de cotización
  }
  if(tab==='valoracion'){
    setTimeout(()=>buildMultHistChart(),60);
    setTimeout(()=>buildFairValueChart(),60);
    // Prefetch del consenso web (FMP/SEC) en segundo plano para la columna comparativa
    const _k=coKeyOf(co);
    if(!_webProj[_k]){
      setTimeout(()=>ensureWebProj(_k).then(w=>{ if(w && curTab==='valoracion' && coKeyOf(co)===_k) showTab('valoracion'); }),80);
    }
  }
  if(tab==='proyecciones'){
    const pts=co.pY.map((yr,i)=>{const f=(co.pF[i]*tEVF-co.pND[i])/co.shares,p=co.pEPS[i]*tPER,e=(co.pEB[i]*tEVE-co.pND[i])/co.shares;return{yr,avg:(f+p+e)/3,f,p};});
    const cp=document.getElementById('c-pt');
    if(cp) charts.pt=new Chart(cp,{type:'line',data:{labels:['Actual',...co.pY.map(String)],datasets:[{label:'Promedio',data:[price,...pts.map(p=>Math.round(p.avg))],borderColor:co.color,backgroundColor:co.color+'14',fill:true,tension:.35,pointRadius:5,borderWidth:3},{label:'EV/FCF',data:[price,...pts.map(p=>Math.round(p.f))],borderColor:'#b45309',tension:.35,borderDash:[5,3],pointRadius:3,borderWidth:1.5},{label:'PER',data:[price,...pts.map(p=>Math.round(p.p))],borderColor:'#7c3aed',tension:.35,borderDash:[5,3],pointRadius:3,borderWidth:1.5}]},options:{...baseOpts,plugins:{legend:{display:true,labels:{color:tc,font:{size:11},boxWidth:10}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>''+curSymG()+N(v)}}}}});
  }
}
