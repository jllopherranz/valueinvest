// ─────────────────────────────────────────────────────────────
// recalc() y refresco puntual del DOM + cambio de pestaña
// ─────────────────────────────────────────────────────────────
// ── RECALC ──
function recalc(){
  const hdrInp=document.getElementById('price-inp');
  const valInp=document.getElementById('val-price-inp');
  const active=document.activeElement;
  const _ref=_livePrice||_lastKnownPrice(coKeyOf(co))||co.price;
  if(active&&active.id==='val-price-inp'){price=+active.value||_ref;simMode=Math.abs(price-_ref)>0.5;}
  else if(active&&active.id==='price-inp'){price=+active.value||_ref;simMode=Math.abs(price-_ref)>0.5;}
  if(hdrInp&&active!==hdrInp) hdrInp.value=(+price).toFixed(2);   // punto decimal: válido para input type=number
  if(valInp&&active!==valInp){valInp.value=(+price).toFixed(2);}
  // Sim indicators
  const sb=document.getElementById('sim-banner');
  if(sb) sb.style.display=simMode?'block':'none';
  const simFlag=document.getElementById('hdr-sim-flag');
  if(simFlag) simFlag.style.display=simMode?'inline':'none';
  const simExit=document.getElementById('hdr-sim-exit');
  if(simExit) simExit.style.display=simMode?'inline-flex':'none';
  const vd=calcVerdict();
  const vv=document.getElementById('vval'),vm=document.getElementById('vms'),vb=document.getElementById('vbox');
  if(vv){vv.textContent=vd.verdict;vv.style.color=vd.verdictColor;}
  if(vm){vm.textContent=vd.msBase+'% MdS · '+vd.totalScore+'/100';vm.style.color=vd.verdictColor;}
  if(vb) vb.style.borderColor=vd.verdictColor;
  const mc=price*co.shares;
  const ev=mc+co.netDebt[9];
  const mcd=document.getElementById('mktcap-display'),mcs=document.getElementById('mktcap-sub');
  if(mcd) mcd.textContent=fmtMC(mc);
  if(mcs){mcs.textContent='EV: '+fmtMC(ev)+' · EV/FCF '+Math.round(ev/co.fcf[9])+'x';}
  // Junto al nombre: precio de la compañía (referencia) + market cap
  const qi=document.getElementById('co-quickinfo');
  if(qi){const cur=curSymOf(coKeyOf(co));qi.textContent=' · '+cur+N(_livePrice||_lastKnownPrice(coKeyOf(co))||co.price,0)+' · Cap '+fmtMC(mc);}
  _refreshValDOM(vd);
}

function _refreshValDOM(vd){
  const valInp=document.getElementById('val-price-inp');
  if(valInp) valInp.style.color=vd.verdictColor;
  const vbox=document.getElementById('val-verd-box');
  if(vbox){
    vbox.style.background=vd.verdictColor+'12';vbox.style.borderColor=vd.verdictColor+'40';
    const vt=vbox.querySelector('.val-verd-txt'),vs=vbox.querySelector('.val-verd-sub');
    if(vt){vt.textContent=vd.verdict;vt.style.color=vd.verdictColor;}
    if(vs){vs.textContent='Score '+vd.totalScore+'/100';vs.style.color=vd.verdictColor;}
  }
  const dcf=calcDCF(),ud=(dcf-price)/price*100;
  const dcfEl=document.getElementById('val-dcf-val');
  if(dcfEl){dcfEl.textContent='DCF: '+curSymG()+N(dcf)+' ('+(ud>=0?'+':'')+ud.toFixed(1)+'%)';dcfEl.style.color=ud>=0?'#16a34a':'#dc2626';}
  _refreshMultTiles();_refreshFwd2026();_refreshPriceTable();_refreshCagrRow();_refreshRetorno();
}
// Múltiplo 2026e (forward): respeta la fórmula de la hoja (proyección 2026e) y reacciona al precio en vivo
function _refreshFwd2026(){
  const m=calcISModel()[0]; if(!m) return;
  const ev=price*m.sh+m.nd;  // EV con acciones y deuda PROYECTADAS del año (como la hoja)
  const defs=[
    {k:'per', v:price/Math.max(m.eps,0.01)},
    {k:'evfcf', v:ev/Math.max(m.fcf,1)},
    {k:'eveb', v:ev/Math.max(m.eb,1)},
    {k:'evei', v:ev/Math.max(m.ebit,1)},
  ];
  defs.forEach(d=>{
    const el=document.getElementById('fwd-'+d.k); if(!el) return;
    const val=Math.round(d.v), med5=+(el.dataset.med5||0);
    el.textContent=val+'x';
    el.style.color=(med5&&d.v<=med5)?'#16a34a':'#dc2626';
  });
  // Actualiza el punto 2026e del gráfico de múltiplos para que también reaccione al precio (simulación/live)
  if(typeof _multChartInst!=='undefined' && _multChartInst){
    const fwdByLabel={'EV/FCF':ev/Math.max(m.fcf,1),'PER':price/Math.max(m.eps,0.01),'EV/EBITDA':ev/Math.max(m.eb,1),'EV/EBIT':ev/Math.max(m.ebit,1)};
    let touched=false;
    _multChartInst.data.datasets.forEach(ds=>{
      if(fwdByLabel[ds.label]!=null && Array.isArray(ds.data) && ds.data.length){
        ds.data[ds.data.length-1]=+fwdByLabel[ds.label].toFixed(1); touched=true;
      }
    });
    if(touched) _multChartInst.update('none');
  }
}
function _refreshMultTiles(){
  const me2=(co.medEvEbit||(Math.round(co.medEvEbitda*co.ebitdaM[9]/Math.max(co.ebitM[9],1))));
  const m=calcISModel()[0]; if(!m) return; const ev=price*m.sh+m.nd; // EV con acciones/deuda proyectadas (igual que la hoja y la tabla)
  const tiles=[
    {id:'mt-evfcf',raw:ev/Math.max(m.fcf,1),m:co.medEvFcf,c:'#b45309'},
    {id:'mt-per',raw:price/Math.max(m.eps,.01),m:co.medPER,c:'#7c3aed'},
    {id:'mt-eveb',raw:ev/Math.max(m.eb,1),m:co.medEvEbitda,c:'#2563eb'},
    {id:'mt-evei',raw:ev/Math.max(m.ebit,1),m:me2,c:'#16a34a'},
  ];
  tiles.forEach(t=>{
    const el=document.getElementById(t.id);if(!el) return;
    const v=Math.round(t.raw),pct=((t.raw-t.m)/t.m*100),ok=pct<=0;
    el.style.background=ok?'#f0fdf4':'#fef2f2';el.style.borderColor=ok?'#bbf7d0':'#fecaca';
    el.querySelector('.mt-val').textContent=v+'x';el.querySelector('.mt-val').style.color=t.c;
    el.querySelector('.mt-pct').textContent=(pct>=0?'+':'')+pct.toFixed(0)+'%';el.querySelector('.mt-pct').style.color=ok?'#16a34a':'#dc2626';
  });
}
// Colores únicos para la tabla de precios objetivo (render + refresco usan los MISMOS)
function potColor(p){return p>1.5?'#16a34a':p<-1.5?'#dc2626':'#6b7280';}       // potencial/MdS: + verde · − rojo · ~0 neutro
function cagrColor(v){return v>=15?'#16a34a':v>=8?'#d97706':v>=0?'#6b7280':'#dc2626';} // CAGR: alto verde · medio ámbar · bajo neutro · negativo rojo
function _refreshPriceTable(){
  const isM=calcISModel();
  const rows={'ptr-per':isM.map(m=>Math.round(m.eps*tPER)),'ptr-evf':evfTargetsFor(co),'ptr-eveb':isM.map(m=>Math.round((m.eb*tEVE-m.nd)/m.sh)),'ptr-evei':isM.map(m=>Math.round((m.ebit*tEVEI-m.nd)/m.sh))};
  rows['ptr-avg']=rows['ptr-evf'].map((_,i)=>Math.round((rows['ptr-per'][i]+rows['ptr-evf'][i]+rows['ptr-eveb'][i]+rows['ptr-evei'][i])/4));
  Object.entries(rows).forEach(([rowId,data])=>{
    data.forEach((v,i)=>{
      const cell=document.getElementById(rowId+'-'+i);if(!cell) return;
      const up=(v-price)/price*100;
      const ptv=cell.querySelector('.ptv');
      const ptp=cell.nextElementSibling?cell.nextElementSibling.querySelector('.ptp'):null; // el potencial está en la celda HERMANA
      if(ptv){ptv.textContent=''+curSymG()+N(v);ptv.style.color=potColor(up);}
      if(ptp){ptp.textContent=(up>=0?'+':'')+up.toFixed(0)+'%';ptp.style.color=potColor(up);}
    });
    if(rowId==='ptr-evf'){
      data.forEach((v,i)=>{
        const mds=document.getElementById('ptr-mds-'+i),pot=document.getElementById('ptr-pot-'+i);
        if(mds){const p=(v-price)/price*100;mds.textContent=(p>=0?'+':'')+p.toFixed(0)+'%';mds.style.color=potColor(p);}
        if(pot){const p=(v/price-1)*100;pot.textContent=(p>=0?'+':'')+p.toFixed(0)+'%';pot.style.color=potColor(p);}
      });
    }
  });
}
function _refreshCagrRow(){
  const isM=calcISModel();
  const evfT=evfTargetsFor(co); // EV/FCF: fuente única (tu hoja / proyecciones analista)
  const models={'cagr-per':isM.map((m,i)=>(Math.pow(Math.max(m.eps*tPER,1)/Math.max(price,1),1/(i+1))-1)*100),'cagr-evf':isM.map((m,i)=>(Math.pow(Math.max(evfT[i],1)/Math.max(price,1),1/(i+1))-1)*100),'cagr-eveb':isM.map((m,i)=>(Math.pow(Math.max((m.eb*tEVE-m.nd)/m.sh,1)/Math.max(price,1),1/(i+1))-1)*100),'cagr-evei':isM.map((m,i)=>(Math.pow(Math.max((m.ebit*tEVEI-m.nd)/m.sh,1)/Math.max(price,1),1/(i+1))-1)*100)};
  models['cagr-avg']=isM.map((m,i)=>{const p=(m.eps*tPER+evfT[i]+(m.eb*tEVE-m.nd)/m.sh+(m.ebit*tEVEI-m.nd)/m.sh)/4;return(Math.pow(Math.max(p,1)/Math.max(price,1),1/(i+1))-1)*100;});
  Object.entries(models).forEach(([id,data])=>{const v5=data[4];const el=document.getElementById(id+'-5y');if(el){el.textContent=(v5>=0?'+':'')+v5.toFixed(0)+'%';el.style.color=cagrColor(v5);}});
  const bigCagr=document.getElementById('cagr-big');if(bigCagr){const avg5=models['cagr-avg'][4];bigCagr.textContent=(avg5>=0?'+':'')+avg5.toFixed(0)+'%';bigCagr.style.color=cagrColor(avg5);}
}
function _refreshRetorno(){
  const idx=Math.min(hor,5)-1;
  const rowEVF=evfTargetsFor(co); // EV/FCF: tu hoja / modelo (misma fuente)
  const priceForRet=Math.round(rowEVF[idx]/Math.pow(1+ret/100,idx+1));
  const diff=((priceForRet-price)/price*100);
  const el=document.getElementById('ret-price'),el2=document.getElementById('ret-diff');
  if(el) el.textContent=''+curSymG()+N(priceForRet);
  if(el2){el2.textContent=(diff>=0?'+':'')+diff.toFixed(0)+'%';el2.style.color=cu(diff);}
}
// ═══════════════════════════════════════════════════════════════════
// TAB SYSTEM
// ═══════════════════════════════════════════════════════════════════
function showTab(tab){
  curTab=tab;
  document.querySelectorAll('.tab').forEach(t=>{
    const act=t.dataset.t===tab;
    t.classList.toggle('active',act);
    t.style.color=act?co.color:'';
    t.style.borderBottomColor=act?co.color:'transparent';
  });
  Object.values(charts).forEach(c=>{try{c.destroy();}catch(e){}});charts={};
  const el=document.getElementById('cnt');
  if(tab==='resumen') el.innerHTML=rResumen();
  else if(tab==='graficos') el.innerHTML=rGraficos();
  else if(tab==='valoracion') el.innerHTML=rValoracion();
  else if(tab==='proyecciones') el.innerHTML=rProyecciones();
  else if(tab==='moat') el.innerHTML=rMoat();
  else if(tab==='dcf') el.innerHTML=rDCF();
  else if(tab==='academia') el.innerHTML=rAcademia();
  else if(tab==='tesis') el.innerHTML=rTesis();
  else if(tab==='alertas') el.innerHTML=rAnalisis();
  injectTips();
  setTimeout(()=>buildCharts(tab),120);
}

function sld(id,lbl,val,min,max,step,unit,color,hint){
  return`<div class="slrow">
    <div class="sllbl"><span>${lbl}</span>
      <div style="display:flex;align-items:center;gap:5px;">
        <input type="number" value="${val}" class="numinp" style="color:${color};border-color:${color}40;" onchange="${id}=+this.value;document.getElementById('r${id}').value=+this.value;recalc()"/>
        <span style="font-size:11px;color:var(--muted)">${unit}</span>
      </div>
    </div>
    <input type="range" id="r${id}" min="${min}" max="${max}" step="${step}" value="${val}" style="accent-color:${color}" oninput="${id}=+this.value;this.previousElementSibling.querySelector('input').value=this.value;recalc()"/>
    ${hint?`<div class="sh">💡 ${hint}</div>`:''}
  </div>`;
}
