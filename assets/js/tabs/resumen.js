// ─────────────────────────────────────────────────────────────
// Pestaña Resumen: banner, KPIs, veredicto, checklist, target 5Y, cotización
// ─────────────────────────────────────────────────────────────
function rResumen(){
  const vd=calcVerdict();
  const quality=calcFCFQuality();
  const isM=calcISModel();
  const moat=vd.moat;
  const tvSymbol=(()=>{
    if(co.tvSymbol) return co.tvSymbol;
    const _ck=Object.keys(DB).find(k=>DB[k]===co)||'MSFT';
    const _tv=tvSymbolFor(_ck,co.ticker);
    if(_tv) return _tv;                               // símbolo TradingView (bolsa local o catálogo)
    const _f=FICHA[_ck];
    if(_f&&_f.exchange&&co.ticker) return `${_f.exchange}:${co.ticker}`;
    return (co.ticker||_ck).split('.')[0];            // ticker limpio (sin sufijo de bolsa) para que TradingView lo resuelva
  })();
  const tvLink=(()=>{const _ck=Object.keys(DB).find(k=>DB[k]===co)||'';return tvLinkFor(_ck,co.ticker);})();
  const _b=0.82;
  const medEvFcf=co.med5EvFcf||co.medEvFcf;
  const medEvFcf10=co.medEvFcf;
  const me_res=co.medEvEbit||Math.round(co.medEvEbitda*co.ebitdaM[9]/Math.max(co.ebitM[9],1));

  // Precios objetivo con los múltiplos EFECTIVOS de la empresa (tu hoja / tus últimos editados) — misma fuente que Valoración y Cartera
  const _gm=getCompanyMults(coKeyOf(co));
  const rowPER=isM.map(m=>Math.round(m.eps*_gm.per));
  const rowEVF=evfTargetsFor(co); // EV/FCF: tu hoja si está importada, o el modelo con tu múltiplo
  const rowEVEB=isM.map(m=>Math.round((m.eb*_gm.eveb-m.nd)/m.sh));
  const rowEVEI=isM.map(m=>Math.round((m.ebit*_gm.evei-m.nd)/m.sh));
  const rowAvg=rowEVF.map((_,i)=>Math.round((rowEVF[i]+rowPER[i]+rowEVEB[i]+rowEVEI[i])/4));
  const fv5=rowAvg[4];
  const cagr5=((Math.pow(Math.max(fv5,1)/Math.max(price,1),0.2)-1)*100);

  // Zonas de precio derivadas del MISMO valor justo del veredicto (vd.fairBase) → coherentes con el MdS.
  //  COMPRAR: MdS ≥ +20% (precio ≤ justo/1,20) · JUSTO: 0–20% · VIGILAR: −15–0% · CARO: < −15%
  const evfcfCurrent=Math.round((price*co.shares+co.netDebt[9])/co.fcf[9]);
  const fairPrice   =vd.fairBase;
  const attractPrice=Math.round(vd.fairBase/1.20);
  const expPrice    =Math.round(vd.fairBase*1.176);
  const zone=price<=attractPrice?'BUY':price<=fairPrice?'FAIR':price<=expPrice?'WATCH':'AVOID';
  // Tu múltiplo EV/FCF objetivo y su diferencia % vs mediana 5Y y vs el múltiplo actual
  const gmEvf=_gm.evf;
  const multVsMed = medEvFcf? Math.round((gmEvf-medEvFcf)/medEvFcf*100):null;   // tu múltiplo vs mediana 5Y
  const multVsCur = evfcfCurrent? Math.round((gmEvf-evfcfCurrent)/evfcfCurrent*100):null; // tu múltiplo vs el actual
  const impMult=p=>Math.round((p*co.shares+co.netDebt[9])/co.fcf[9]); // múltiplo EV/FCF implícito en un precio
  const zd={
    BUY: {c:'#16a34a',bg:'#f0fdf4',bd:'#bbf7d0',label:'COMPRAR',emoji:'🟢'},
    FAIR:{c:'#2563eb',bg:'#eff6ff',bd:'#bfdbfe',label:'PRECIO JUSTO',emoji:'🔵'},
    WATCH:{c:'#d97706',bg:'#fffbeb',bd:'#fde68a',label:'VIGILAR',emoji:'🟡'},
    AVOID:{c:'#dc2626',bg:'#fef2f2',bd:'#fecaca',label:'CARO',emoji:'🔴'},
  }[zone];

  // Checklist
  const chkItems=[
    {pos:true,title:'Crecimiento ventas',why:`CAGR 10Y ${P(cagr(co.sales[9],co.sales[0],9))} · Último año ${P(pct(co.sales[9],co.sales[8]))}`},
    {pos:co.roic[9]>=co.wacc,title:co.roic[9]>=co.wacc?'ROIC > WACC':'ROIC < WACC',why:`${P(co.roic[9])} vs WACC ${co.wacc}%. Spread ${(co.roic[9]-co.wacc)>=0?'+':''}${(co.roic[9]-co.wacc).toFixed(0)}pp`},
    {pos:co.fcfM[9]>=10,title:'Margen FCF',why:`${P(co.fcfM[9])} · sector ~${P(co.sectorAvgFcfM)}`},
    {pos:moat.overall>=70,title:`MOAT ${moat.label}`,why:`${moat.overall}/100 · ${moat.dimensions?Object.entries(moat.dimensions).filter(([,v])=>v>=15).map(([k])=>k).join(', '):''}`},
    {pos:co.netDebt[9]/co.ebitda[9]<2,title:co.netDebt[9]<0?'Caja neta':'Deuda controlada',why:`ND/EBITDA ${(co.netDebt[9]/co.ebitda[9]).toFixed(1)}x`},
    {pos:quality.ratio>=0.80,title:`Calidad beneficio: ${quality.label}`,why:`FCF/NI 5Y ${(quality.ratio*100).toFixed(0)}%`},
    {pos:vd.msBase>0,title:vd.msBase>15?'Precio atractivo':'Precio ajustado',why:`MdS ${vd.msBase>=0?'+':''}${vd.msBase}% vs fair ${curSymG()}${N(vd.fairBase)}`},
    {pos:vd.roicTrend5>=-5,title:vd.roicTrend5>=0?'ROIC mejorando (5Y)':'ROIC erosionando (5Y)',why:`${co.roic[4]}%→${co.roic[9]}% (${vd.roicTrend5>=0?'+':''}${vd.roicTrend5}pp) · ${vd.roicMomentum}`},
  ];

  // KPIs — datos actualizados y visuales
  const kpiRows=[
    {key:'sales',icon:'📦',lbl:'Ventas',
     main:()=>''+curSymG()+N(co.sales[9])+'M',
     pct_val:()=>pct(co.sales[9],co.sales[8]),
     pct_lbl:'YoY',
     sub:()=>P(cagr(co.sales[9],co.sales[0],9))+' CAGR 10Y',
     c:'#2563eb',
     hist:()=>co.sales.slice(5),
     hist_fmt:v=>''+curSymG()+N(Math.round(v/1000))+'B',
     est:()=>co.pS.slice(0,3),
     detail:()=>`Ventas FY25: ${curSymG()}${N(co.sales[9])}M. CAGR 10Y ${P(cagr(co.sales[9],co.sales[0],9))}. Último año: ${P(pct(co.sales[9],co.sales[8]))}. Estimaciones: ${co.pS.slice(0,3).map((v,i)=>`${co.pY[i]}E ${curSymG()}${N(Math.round(v/1000))}B`).join(' · ')}.`},
    {key:'fcf',icon:'💵',lbl:'Free Cash Flow',
     main:()=>''+curSymG()+N(co.fcf[9])+'M',
     pct_val:()=>co.fcfM[9],
     pct_lbl:'Margen',
     sub:()=>P(cagr(co.fcf[9],co.fcf[0],9))+' CAGR 10Y',
     c:'#16a34a',
     hist:()=>co.fcf.slice(5),
     hist_fmt:v=>v<0?'−'+curSymG()+N(Math.round(Math.abs(v)/1000))+'B':''+curSymG()+N(Math.round(v/1000))+'B',
     est:()=>co.pF.slice(0,3),
     detail:()=>`FCF FY25: ${curSymG()}${N(co.fcf[9])}M. Margen FCF ${P(co.fcfM[9])} (sector ~${P(co.sectorAvgFcfM)}). FCF/acción ${curSymG()}${N(co.fcfps[9],2)}. Est: ${co.pF.slice(0,3).map((v,i)=>`${co.pY[i]}E ${curSymG()}${N(Math.round(v/1000))}B`).join(' · ')}.`},
    {key:'ebitda',icon:'🏭',lbl:'EBITDA',
     main:()=>''+curSymG()+N(co.ebitda[9])+'M',
     pct_val:()=>co.ebitdaM[9],
     pct_lbl:'Margen',
     sub:()=>'Sector ~'+P(co.sectorAvgEbitdaM),
     c:'#b45309',
     hist:()=>co.ebitda.slice(5),
     hist_fmt:v=>''+curSymG()+N(Math.round(v/1000))+'B',
     est:()=>co.pEB.slice(0,3),
     detail:()=>`EBITDA FY25: ${curSymG()}${N(co.ebitda[9])}M. Margen EBITDA ${P(co.ebitdaM[9])} vs sector ~${P(co.sectorAvgEbitdaM)}. Est: ${co.pEB.slice(0,3).map((v,i)=>`${co.pY[i]}E ${curSymG()}${N(Math.round(v/1000))}B`).join(' · ')}.`},
    {key:'eps',icon:'📈',lbl:'EPS',
     main:()=>''+curSymG()+N(co.eps[9],2),
     pct_val:()=>pct(co.eps[9],co.eps[8]),
     pct_lbl:'YoY',
     sub:()=>'CAGR 10Y '+P(cagr(co.eps[9],co.eps[0],9)),
     c:'#7c3aed',
     hist:()=>co.eps.slice(5),
     hist_fmt:v=>''+curSymG()+N(v,2),
     est:()=>co.pEPS.slice(0,3),
     detail:()=>`EPS FY25: ${curSymG()}${N(co.eps[9],2)}. Crecimiento YoY ${P(pct(co.eps[9],co.eps[8]))}. CAGR 10Y ${P(cagr(co.eps[9],co.eps[0],9))}. Est: ${co.pEPS.slice(0,3).map((v,i)=>`${co.pY[i]}E ${curSymG()}${N(v,2)}`).join(' · ')}.`},
    {key:'roic',icon:'🎯',lbl:'ROIC',
     main:()=>P(co.roic[9]),
     pct_val:()=>co.roic[9]-co.wacc,
     pct_lbl:'vs WACC',
     sub:()=>vd.roicMomentum,
     c:co.roic[9]>=co.wacc+10?'#16a34a':co.roic[9]>=co.wacc?'#d97706':'#dc2626',
     hist:()=>co.roic.slice(5),
     hist_fmt:v=>v+'%',
     est:null,
     detail:()=>`ROIC ${P(co.roic[9])} vs WACC ${co.wacc}%. Spread ${(co.roic[9]-co.wacc)>=0?'+':''}${(co.roic[9]-co.wacc).toFixed(0)}pp. Trend 5Y: ${vd.roicTrend5>=0?'+':''}${vd.roicTrend5}pp (${vd.roicMomentum}). Historial: ${co.roic.slice(5).map((v,i)=>co.years[5+i]+' '+v+'%').join(' · ')}.`},
    {key:'evfcf',icon:'💎',lbl:'EV/FCF',
     main:()=>evfcfCurrent+'x',
     pct_val:()=>((evfcfCurrent-medEvFcf)/medEvFcf*100),
     pct_lbl:'vs med5Y',
     sub:()=>'Med 5Y: '+Math.round(medEvFcf)+'x · 10Y: '+Math.round(medEvFcf10)+'x',
     c:'#7c3aed',
     hist:()=>co.hEvF.slice(5),
     hist_fmt:v=>v!=null?v+'x':'—',
     est:null,
     detail:()=>`EV/FCF actual ${evfcfCurrent}x. Mediana 5Y ${Math.round(medEvFcf)}x, 10Y ${Math.round(medEvFcf10)}x. ${evfcfCurrent>medEvFcf?`Prima del ${((evfcfCurrent-medEvFcf)/medEvFcf*100).toFixed(0)}% sobre la media — el mercado exige crecimiento.`:'Descuento del '+Math.abs(((evfcfCurrent-medEvFcf)/medEvFcf*100).toFixed(0))+'% bajo la media — posible oportunidad.'}`},
  ];

  const kpiHtml=kpiRows.map(k=>{
    const mainVal=k.main();
    const pctV=k.pct_val();
    const pctOk=k.key==='evfcf'?pctV<=0:pctV>=0;
    const pctColor=pctOk?'#16a34a':'#dc2626';
    const histData=k.hist();
    const estData=k.est?k.est():null;
    // Mini sparkline bars
    const validHist=histData.filter(v=>v!=null&&v!==undefined);
    const maxV=Math.max(...validHist.map(Math.abs),1);
    const sparkBars=histData.map((v,i)=>{
      const isLast=i===histData.length-1;
      const h=v!=null?Math.max(10,Math.round(Math.abs(v)/maxV*36)):10;
      const c=isLast?k.c:v>=0?k.c+'99':'#dc262699';
      const yr=String(co.years[5+i]).slice(2);
      return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="font-size:7px;color:${isLast?k.c:'var(--muted)'};font-weight:${isLast?'700':'400'};">${v!=null?k.hist_fmt(v):'—'}</div>
        <div style="width:100%;height:${h}px;background:${c};border-radius:2px 2px 0 0;"></div>
        <div style="font-size:7px;color:var(--muted);">${yr}</div>
      </div>`;
    }).join('');

    // JSON-safe serialization for onclick
    const kData={key:k.key,icon:k.icon,lbl:k.lbl,c:k.c,
      val:mainVal,sub:k.sub(),detail:k.detail(),
      hist:histData.map(v=>v!=null?k.hist_fmt(v):'—'),
      est:estData?estData.map((v,i)=>co.pY[i]+'E: '+k.hist_fmt(v)):null
    };
    const kJson=JSON.stringify(kData).replace(/'/g,"\\'").replace(/"/g,'&quot;');

    return`<div class="kpi2" id="kpi2-${k.key}" style="border-left-color:${k.c};cursor:pointer;"
      onclick="regKpi2('${k.key}',${JSON.stringify(kData).replace(/"/g,"'")});kpiEdu('${k.key}',event)">
      <div style="display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;">
        <span style="font-size:18px;margin-top:1px;">${k.icon}</span>
        <div>
          <div class="kpi2-lbl">${k.lbl}</div>
          <div style="font-size:18px;font-weight:600;color:${k.c};line-height:1.1;">${mainVal}</div>
          <div style="font-size:10px;font-weight:700;color:${pctColor};margin-top:2px;">${pctV>=0?'+':''}${pctV.toFixed(1)}% ${k.pct_lbl}</div>
          <div style="font-size:9px;color:var(--muted);margin-top:1px;">${k.sub()}</div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:2px;height:48px;min-width:70px;">${sparkBars}</div>
      </div>
    </div>`;
  }).join('');

  // ROIC mini-bar chart para el análisis de calidad
  const roicBars=co.roic.slice(5).map((v,i)=>{
    const yr=co.years[5+i];
    const maxR=Math.max(...co.roic.filter(x=>x>0),1);
    const h=v>0?Math.max(8,Math.round(v/maxR*50)):8;
    const c=v>=co.wacc+10?'#16a34a':v>=co.wacc?'#d97706':'#dc2626';
    return`<div style="flex:1;text-align:center;">
      <div style="font-size:8px;font-weight:700;color:${c};margin-bottom:2px;">${v}%</div>
      <div style="height:${h}px;background:${c}35;border-top:2.5px solid ${c};border-radius:2px 2px 0 0;"></div>
      <div style="font-size:7px;color:var(--muted);margin-top:2px;">${String(yr).slice(2)}</div>
    </div>`;
  }).join('');

  // ── Puntos críticos a vigilar (sector-específicos)
  const criticalPoints = [
    co.roic[9] < co.wacc ? {icon:'🚨', txt:`ROIC ${P(co.roic[9])} < WACC ${co.wacc}% — destruye valor para el accionista`} : null,
    vd.euforiaPenalty >= 15 ? {icon:'🚨', txt:`EV/FCF ${evfcfCurrent}x vs med5Y ${medEvFcf}x (+${Math.round((evfcfCurrent-medEvFcf)/medEvFcf*100)}%) — valoración exigente`} : null,
    vd.roicTrend5 <= -5 ? {icon:'⚠️', txt:`ROIC cayendo ${vd.roicTrend5}pp en 5 años — erosión del negocio`} : null,
    quality.ratio < 0.70 ? {icon:'⚠️', txt:`Calidad FCF baja (${(quality.ratio*100).toFixed(0)}%) — beneficio contable ≠ caja real`} : null,
    co.netDebt[9]/co.ebitda[9] > 3 ? {icon:'⚠️', txt:`Deuda elevada: ND/EBITDA ${(co.netDebt[9]/co.ebitda[9]).toFixed(1)}x — sensible a subidas de tipos`} : null,
    cagr(co.sales[9],co.sales[7],2) < cagr(co.sales[7],co.sales[4],3)*0.6 ? {icon:'⚠️', txt:'Desaceleración significativa en crecimiento de ventas últimos 2 años'} : null,
  ].filter(Boolean);

  // ── Benchmarks de sector para el checklist ──
  const sectorRef = {
    cagr:    co.sectorAvgGrowth  || 12,
    fcfMg:   co.sectorAvgFcfM    || 15,
    ebitdaMg:co.sectorAvgEbitdaM || 22,
    roicRef: co.sectorAvgRoic    || 15,
    pervRef: co.sectorAvgPER     || 25,
    evfRef:  co.sectorAvgEvFcf   || 25,
  };

  // ── Ficha empresa (de FICHA) ──
  const coKey=Object.keys(DB).find(k=>DB[k]===co)||'MSFT';
  const fichaData = FICHA[coKey] || {};
  const _prof=companyProfile(coKey);
  const logosSrc={src:logoUrlFor(coKey)||(LOGOS[coKey]&&LOGOS[coKey].src)||'',
                  fb:logoFallback(coKey)||(LOGOS[coKey]&&LOGOS[coKey].fb)||''};

    return`
  <div><!-- resumen layout -->
    ${estimatedBanner()}

    <!-- ══ BANNER EMPRESA (sobrio, acento en color corporativo) ══ -->
    <div class="card" style="margin-bottom:10px;border-left:3px solid ${co.color};display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;">
      <div style="width:44px;height:44px;border-radius:var(--radius-sm);background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <img src="${logosSrc.src||logosSrc.fb||''}" onerror="this.onerror=null;if('${logosSrc.fb}'&&this.src!=='${logosSrc.fb}'){this.src='${logosSrc.fb}';}else{this.style.display='none';this.parentElement.textContent='${co.ticker.substring(0,2)}';this.parentElement.style.color=this.parentElement.style.color||'${co.color}';this.parentElement.style.fontWeight='700';}" style="width:30px;height:30px;object-fit:contain;" alt="${co.ticker}"/>
      </div>
      <div style="flex:1;min-width:160px;">
        <div style="font-size:17px;font-weight:700;color:var(--text);line-height:1.15;">${co.name}</div>
        <div style="font-size:10.5px;color:var(--muted);margin-top:3px;font-weight:600;">${co.ticker} · ${co.sector||sectorOf(coKey)||'—'}${(fichaData.exchange||(_prof&&_prof.exchange))?` · <span style="text-transform:uppercase;letter-spacing:.05em;color:var(--sub);">${fichaData.exchange||_prof.exchange}</span>`:''}</div>
        ${(()=>{const e=_earningsInfo();return`<div id="resumen-earnings" style="display:${e.show?'inline-flex':'none'};align-items:center;margin-top:5px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:2px 9px;font-size:9px;font-weight:700;color:var(--amber);">${e.text}</div>`;})()}
      </div>
      ${fichaData.lastQ?`<div style="display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0;">
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;min-width:118px;">
          <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Último: ${fichaData.lastQ.label}</div>
          <div class="num" style="font-size:12px;font-weight:700;color:var(--text);">${fichaData.lastQ.salesVal}</div>
          <div class="num" style="font-size:10px;font-weight:700;color:${fichaData.lastQ.salesYoY>=0?'var(--green)':'var(--red)'};margin-top:1px;">${fichaData.lastQ.salesYoY>=0?'+':''}${fichaData.lastQ.salesYoY}% v · ${fichaData.lastQ.epsYoY>=0?'+':''}${fichaData.lastQ.epsYoY}% EPS</div>
        </div>
        ${fichaData.nextQ?`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;min-width:118px;">
          <div style="font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Próx: ${fichaData.nextQ.label}</div>
          <div class="num" style="font-size:11px;font-weight:700;color:var(--sub);">${fichaData.nextQ.salesEst}</div>
          <div class="num" style="font-size:10px;color:var(--muted);">EPS est. ${fichaData.nextQ.epsEst}</div>
        </div>`:''}
      </div>`:''}
    </div>

    ${co.spinoffNote?`<div class="card" style="margin-bottom:10px;border-left:3px solid var(--amber);padding:10px 14px;"><div style="font-size:9px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Cambio estructural reciente</div><div style="font-size:11px;color:var(--sub);line-height:1.5;">${co.spinoffNote}</div></div>`:''}

    <!-- ══ BLOQUE 1: CONTEXTO DE EMPRESA ══ -->
    ${(!fichaData.descRich&&!fichaData.businessLines)?rPerfilAuto(coKey,_prof):''}
    ${fichaData.descRich||fichaData.businessLines?`
    <div class="card" style="margin-bottom:10px;">
      <div class="ctitle">Descripción · Posición competitiva · Tesis</div>
      <!-- Descripción negocio rica -->
      ${fichaData.descRich?`<div class="ficha-desc-card" style="margin-bottom:10px;">${fichaData.descRich}</div>`:''}
      <!-- Segmentos de negocio -->
      ${fichaData.businessLines&&fichaData.businessLines.length?`
      <div style="margin-bottom:12px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:6px;">Segmentos de negocio</div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          ${fichaData.businessLines.map(b=>`
          <div style="display:grid;grid-template-columns:36px 1fr 80px;align-items:center;gap:8px;">
            <div style="font-size:10px;font-weight:600;color:${co.color};text-align:right;">${b.pct}%</div>
            <div><div style="font-size:10px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${b.name}</div><div style="font-size:9px;color:var(--muted);line-height:1.35;">${b.desc}</div></div>
            <div style="height:5px;background:#eee;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${b.pct}%;background:${co.color};border-radius:3px;"></div></div>
          </div>`).join('')}
        </div>
      </div>`:''}
      <!-- Rival principal -->
      ${fichaData.rival?`
      <div style="background:#1e2a3a;border-radius:10px;padding:10px 14px;margin-bottom:10px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.4);margin-bottom:5px;">⚔️ Rival principal</div>
        <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:3px;">${fichaData.rival.name} <span style="font-size:10px;font-weight:400;color:rgba(255,255,255,.4);">${fichaData.rival.ticker}</span></div>
        ${fichaData.rival.why.map(w=>`<div style="font-size:10px;color:rgba(255,255,255,.6);margin-bottom:2px;line-height:1.4;">› ${w}</div>`).join('')}
      </div>`:''}
      <!-- Catalizadores y riesgos -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:${criticalPoints.length?'12px':'0'};">
        ${fichaData.catalysts&&fichaData.catalysts.length?`
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#16a34a;margin-bottom:6px;">Catalizadores</div>
          ${fichaData.catalysts.map(c=>`
          <div style="display:flex;gap:7px;margin-bottom:7px;">
            <span style="font-size:16px;flex-shrink:0;">${c.icon}</span>
            <div><div style="font-size:10px;font-weight:700;color:${c.color};margin-bottom:1px;">${c.title}</div><div style="font-size:9px;color:var(--muted);line-height:1.4;">${c.text}</div></div>
          </div>`).join('')}
        </div>`:''}
        ${fichaData.risks?`
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#dc2626;margin-bottom:6px;">Riesgos</div>
          <div style="background:#1e2a3a;border-radius:8px;padding:9px 12px;font-size:10px;color:rgba(255,255,255,.65);line-height:1.6;">${fichaData.risks}</div>
        </div>`:''}
      </div>
      <!-- Puntos críticos a vigilar -->
      ${criticalPoints.length?`
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#dc2626;margin-bottom:6px;">Puntos críticos a vigilar</div>
        ${criticalPoints.map(p=>`<div style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;"><span style="flex-shrink:0;">${p.icon}</span><span style="font-size:10px;color:#7f1d1d;line-height:1.5;">${p.txt}</span></div>`).join('')}
      </div>`:''}
    </div>`:''}
    <!-- Puntos críticos standalone (cuando no hay ficha) -->
    ${!fichaData.descRich&&criticalPoints.length?`
    <div class="card" style="margin-bottom:10px;background:#fef2f2;border:1px solid #fecaca;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#dc2626;margin-bottom:6px;">Puntos críticos a vigilar</div>
      ${criticalPoints.map(p=>`<div style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;"><span style="flex-shrink:0;">${p.icon}</span><span style="font-size:10px;color:#7f1d1d;line-height:1.5;">${p.txt}</span></div>`).join('')}
    </div>`:''}


    <!-- ══ BLOQUE 2: MÉTRICAS CLAVE ══ -->
    <div class="card" style="margin-bottom:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
        <div class="ctitle" style="margin-bottom:0;">Métricas clave <span style="font-size:9px;font-weight:400;color:var(--muted);">— clic en cada métrica: qué es + su contexto en esta empresa</span></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          ${[{l:'CAGR V.',v:P(cagr(co.sales[9],co.sales[0],9)),c:'#2563eb',ref:`>${sectorRef.cagr}% bueno`},
             {l:'FCF Mg',v:P(co.fcfM[9]),c:'#16a34a',ref:`>${sectorRef.fcfMg}% sector`},
             {l:'ROIC',v:P(co.roic[9]),c:co.roic[9]>=co.wacc?'#16a34a':'#dc2626',ref:`>${sectorRef.roicRef}% sector`},
             {l:'ND/EBITDA',v:(co.netDebt[9]/co.ebitda[9]).toFixed(1)+'x',c:co.netDebt[9]<0?'#16a34a':co.netDebt[9]/co.ebitda[9]<2?'#d97706':'#dc2626',ref:'<2x sano'}
          ].map(t=>`<span title="Referencia: ${t.ref}" style="background:${t.c}15;color:${t.c};border:1px solid ${t.c}30;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:700;cursor:help;">${t.l}: ${t.v}</span>`).join('')}
        </div>
      </div>
      <div class="kpi-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
        ${kpiHtml}
      </div>
      <!-- Benchmarks de sector (colapsable) -->
      <div style="margin-top:8px;padding:8px 10px;background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:8px;">
        <div style="font-size:9px;font-weight:700;color:var(--muted);margin-bottom:4px;">📏 Referencias del sector (${co.sector})</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${[['CAGR ventas','>'+sectorRef.cagr+'%'],['FCF margen','>'+sectorRef.fcfMg+'%'],
             ['EBITDA margen','>'+sectorRef.ebitdaMg+'%'],['ROIC','>'+sectorRef.roicRef+'%'],
             ['PER ref.','~'+sectorRef.pervRef+'x'],['EV/FCF ref.','~'+sectorRef.evfRef+'x']
          ].map(([k,v])=>`<span style="font-size:9px;color:var(--sub);"><b style="color:${_dm()?'#e2e8f0':'#1a1814'};">${k}:</b> ${v}</span>`).join(' · ')}
        </div>
      </div>
    </div>

    <!-- ══ BLOQUE 2b: ESTILO DE INVERSIÓN (Growth / Value / Calidad) ══ -->
    ${(()=>{const st=classifyStyle();const bar=(lbl,v,c,hint)=>`<div style="margin-bottom:5px;"><div style="display:flex;justify-content:space-between;font-size:8px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px;"><span>${lbl}</span><span style="color:${c};">${v}/100</span></div><div style="height:6px;background:${_dm()?'#2a3a52':'#ececec'};border-radius:10px;overflow:hidden;"><div style="height:100%;width:${v}%;background:${c};border-radius:10px;"></div></div><div style="font-size:8px;color:var(--muted);margin-top:1px;">${hint}</div></div>`;
      return`<div class="card" style="margin-bottom:10px;border-left:4px solid ${st.color};">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div class="ctitle" style="margin-bottom:0;">Estilo de inversión <span data-tip="estilo" style="cursor:pointer;color:${st.color};font-weight:700;border:1px solid ${st.color}55;border-radius:50%;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;">i</span></div>
        <span style="background:${st.color}15;color:${st.color};border:1.5px solid ${st.color}40;padding:3px 12px;border-radius:20px;font-size:13px;font-weight:600;">${st.icon} ${st.style}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:center;">
        <div>
          ${bar('Crecimiento',st.growthScore,'#16a34a','Ventas/EPS hist. + proyectado')}
          ${bar('Calidad',st.qualityScore,'#7c3aed','ROIC + margen FCF')}
          ${bar('Valoración',st.valueScore,'#b45309','Barato↔caro vs su propia media')}
        </div>
        <div style="font-size:10px;color:var(--sub);line-height:1.5;">${st.desc}</div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;">
        ${st.badges.map(b=>`<span style="background:${_dm()?'#1c2333':'#f7f6f3'};border:1px solid var(--border);padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${b}</span>`).join('')}
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;border-top:1px dashed var(--border);padding-top:7px;">
        <span style="font-size:8px;color:var(--muted);font-weight:700;text-transform:uppercase;align-self:center;">Indicadores</span>
        ${[
          {tip:'peg',l:'PEG',v:st.peg!=null?st.peg.toFixed(2):'—',c:st.peg==null?'#6b7280':st.peg<1?'#16a34a':st.peg<2?'#d97706':'#dc2626'},
          {tip:'ruleof40',l:'Rule of 40',v:st.ruleOf40+'%',c:st.ruleOf40>=40?'#16a34a':st.ruleOf40>=30?'#d97706':'#dc2626'},
          {tip:'fcfyield',l:'FCF yield',v:st.fcfYield+'%',c:st.fcfYield>=5?'#16a34a':st.fcfYield>=3?'#d97706':'#dc2626'},
          {tip:'reinversion',l:'Dilución',v:st.dilution!=null?((st.dilution>0?'+':'')+st.dilution+'%'):'—',c:st.dilution==null?'#6b7280':st.dilution<=0?'#16a34a':st.dilution<=1?'#d97706':'#dc2626'},
        ].map(x=>`<span data-tip="${x.tip}" style="cursor:pointer;background:${x.c}12;color:${x.c};border:1px solid ${x.c}40;padding:2px 9px;border-radius:10px;font-size:9px;font-weight:700;">${x.l}: ${x.v} <span style="opacity:.7;">ⓘ</span></span>`).join('')}
      </div>
    </div>`;})()}

    <!-- ══ BLOQUE 3: VEREDICTO + BARRA PRECIO ══ -->
    <div class="card" style="margin-bottom:10px;background:${vd.verdictBg};border-color:${vd.verdictColor}60;border-width:2px;position:relative;">
      ${!_priceLive?`<div style="position:absolute;inset:0;background:rgba(255,255,255,.9);z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:inherit;text-align:center;padding:10px;"><div style="font-size:24px;">⏳</div><div style="font-size:13px;font-weight:600;color:#1e3a5f;margin-top:6px;">Calculando veredicto…</div><div style="font-size:10px;color:var(--muted);margin-top:3px;">Esperando el precio en vivo para no valorar con datos desactualizados</div></div>`:''}
      <div class="verdict-grid" style="display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:start;">
        <div style="text-align:center;padding:6px 0;">
          <div style="font-size:9px;font-weight:700;color:${vd.verdictColor};text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px;">Veredicto</div>
          <div style="font-size:26px;line-height:1;">${vd.verdictColor==='#16a34a'?'🟢':vd.verdictColor==='#2563eb'?'🔵':vd.verdictColor==='#d97706'?'🟡':'🔴'}</div>
          <div style="font-size:13px;font-weight:600;color:${vd.verdictColor};margin:4px 0 8px;">${vd.verdict}</div>
          <div style="background:rgba(255,255,255,.8);border-radius:8px;padding:6px 8px;">
            <div style="font-size:20px;font-weight:700;color:${vd.verdictColor};line-height:1;">${vd.totalScore}<span style="font-size:10px;font-weight:600;">/100</span></div>
            <div style="margin-top:4px;display:grid;gap:3px;">
              ${[['Ret.5Y',vd.retScore,35,vd.retScore>=22?'#16a34a':vd.retScore>=12?'#d97706':'#dc2626','retorno'],['MOAT',vd.moatScore,30,moat.color,'moat'],['ROIC',vd.roicScore,20,co.roic[9]>=co.wacc?'#16a34a':'#dc2626','roic'],['MdS',vd.mdsScore,15,vd.verdictColor,'mds']].map(([l,s,mx,c,tip])=>`
              <div style="display:flex;align-items:center;gap:4px;">
                <div data-tip="${tip}" title="Clic: qué es" style="font-size:7px;color:var(--muted);width:28px;text-align:right;cursor:pointer;text-decoration:underline dotted;">${l}</div>
                <div style="flex:1;height:5px;background:#e5e5e5;border-radius:10px;overflow:hidden;">
                  <div style="height:100%;width:${Math.round(s/mx*100)}%;background:${c};border-radius:10px;"></div>
                </div>
                <div style="font-size:7px;font-weight:700;color:${c};width:22px;">${s}/${mx}</div>
              </div>`).join('')}
              ${vd.euforiaPenalty>0?`<div style="font-size:8px;font-weight:700;color:#dc2626;margin-top:2px;">−${vd.euforiaPenalty} euforia</div>`:''}
            </div>
          </div>
        </div>
        <div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            <div class="verdict-price" style="font-size:26px;font-weight:700;color:${_dm()?'#e2e8f0':'#1a1814'};">${curSymG()}${N(price,2)}</div>
            <div style="font-size:11px;font-weight:700;color:${vd.msBase>=0?'#16a34a':'#dc2626'}">${vd.msBase>=0?'+':''}${vd.msBase}% MdS</div>
            <div style="font-size:10px;color:var(--muted);">vs objetivo EV/FCF próx. año ${curSymG()}${N(vd.fairBase)}</div>
          </div>
          <!-- NOTA: valoración solo por EV/FCF con tu múltiplo + diferencia % -->
          <div style="font-size:10px;color:var(--sub);background:rgba(255,255,255,.7);border:1px solid ${vd.verdictColor}25;border-radius:7px;padding:6px 9px;margin-bottom:8px;line-height:1.6;">
            📐 Valoración <strong>solo por EV/FCF</strong> con tu múltiplo objetivo
            <strong style="color:#b45309;">${gmEvf}x</strong>.
            ${multVsMed!=null?`Es <strong style="color:${multVsMed<0?'#16a34a':'#dc2626'};">${multVsMed>=0?'+':''}${multVsMed}%</strong> vs mediana 5Y (${Math.round(medEvFcf)}x)`:''}${multVsCur!=null?` · <strong style="color:${multVsCur<0?'#16a34a':'#dc2626'};">${multVsCur>=0?'+':''}${multVsCur}%</strong> vs múltiplo actual (${evfcfCurrent}x)`:''}.
          </div>
          <div style="position:relative;height:26px;border-radius:8px;overflow:hidden;margin-bottom:6px;background:linear-gradient(90deg,#16a34a 0%,#22c55e 25%,#3b82f6 35%,#93c5fd 50%,#fde68a 65%,#f97316 80%,#ef4444 100%);">
            ${(()=>{
              const lo=attractPrice*0.8,hi=expPrice*1.3;
              const pp=Math.max(2,Math.min(96,(price-lo)/(hi-lo)*100));
              const pa=Math.max(0,Math.min(100,(attractPrice-lo)/(hi-lo)*100));
              const pf=Math.max(0,Math.min(100,(fairPrice-lo)/(hi-lo)*100));
              const pe=Math.max(0,Math.min(100,(expPrice-lo)/(hi-lo)*100));
              return`<div style="position:absolute;top:0;bottom:0;left:${pa}%;width:1px;background:rgba(255,255,255,.5);"></div>
              <div style="position:absolute;top:0;bottom:0;left:${pf}%;width:1px;background:rgba(255,255,255,.5);"></div>
              <div style="position:absolute;top:0;bottom:0;left:${pe}%;width:1px;background:rgba(255,255,255,.5);"></div>
              <div style="position:absolute;top:50%;left:${pp}%;transform:translate(-50%,-50%);width:13px;height:13px;background:#fff;border-radius:50%;border:2.5px solid ${vd.verdictColor};box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`;
            })()}
          </div>
          <div data-tip="zonas" style="cursor:pointer;font-size:8px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Zonas de precio + euforia <span style="opacity:.6;">ⓘ</span></div>
          <div class="price-bar-zones" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:10px;">
            ${[['🟢','ATRACTIVO',attractPrice,'+20% MdS'],['🔵','JUSTO',fairPrice,'tu múltiplo'],['🔴','CARO',expPrice,'−15% MdS']].map(([e,l,p,m])=>`
            <div style="text-align:center;padding:5px 4px;background:rgba(255,255,255,.7);border-radius:7px;">
              <div style="font-size:9px;font-weight:700;color:var(--muted);">${l}</div>
              <div style="font-size:13px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};">${curSymG()}${N(p)}</div>
              <div style="font-size:8px;color:var(--muted);">${impMult(p)}x · ${m}</div>
            </div>`).join('')}
          </div>
          <!-- ROIC mini -->
          <div style="background:rgba(255,255,255,.6);border-radius:8px;padding:8px 10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;flex-wrap:wrap;gap:4px;">
              <span style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">MOAT ${moat.overall}/100 · ROIC ${P(co.roic[9])}</span>
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                ${[{l:'Spread',v:(co.roic[9]-co.wacc)>=0?'+'+Math.abs(co.roic[9]-co.wacc):'−'+Math.abs(co.roic[9]-co.wacc)+'pp',ok:co.roic[9]>=co.wacc},
                   {l:'5Y',v:(vd.roicTrend5>=0?'+':'')+vd.roicTrend5+'pp',ok:vd.roicTrend5>=0},
                   {l:'Mom',v:vd.roicMomentum,ok:vd.roicSlope>=0}
                ].map(t=>`<span style="font-size:8px;font-weight:700;padding:2px 5px;border-radius:8px;background:${t.ok?'#f0fdf4':'#fef2f2'};color:${t.ok?'#16a34a':'#dc2626'};">${t.l}: ${t.v}</span>`).join('')}
              </div>
            </div>
            <div style="display:flex;gap:3px;align-items:flex-end;height:36px;">${roicBars}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ BLOQUE 4: CHECKLIST con benchmarks ══ -->
    <div class="card" style="margin-bottom:10px;">
      <div class="ctitle">Checklist rápido</div>
      <div class="chk2-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
        ${chkItems.map(it=>{
          const c=it.pos?'#16a34a':'#dc2626';
          const bg=it.pos?'#f0fdf4':'#fef2f2';
          const bd=it.pos?'#bbf7d0':'#fecaca';
          return`<div class="chk2" style="background:${bg};border:1px solid ${bd};">
            <span class="chk2-icon">${it.pos?'✅':'❌'}</span>
            <div class="chk2-text">
              <div style="font-size:11px;font-weight:700;color:${c};">${it.title}</div>
              <div style="font-size:10px;color:var(--sub);">${it.why}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- ══ BLOQUE 5: TARGET A 5 AÑOS (compacto) ══ -->
    <div class="card" style="margin-bottom:10px;">
      <div style="display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;">
        <div style="text-align:center;background:#1e3a5f;border-radius:10px;padding:10px 14px;min-width:100px;">
          <div style="font-size:8px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;">Target 2030</div>
          <div style="font-size:26px;font-weight:700;color:#fff;line-height:1;">${curSymG()}${N(fv5)}</div>
          <div style="font-size:11px;font-weight:700;color:${cagr5>15?'#4ade80':cagr5>10?'#fbbf24':'#f87171'};margin-top:3px;">${cagr5>=0?'+':''}${cagr5.toFixed(1)}%/año</div>
        </div>
        <div>
          <div class="target5y-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;">
            ${co.pY.map((y,i)=>{const v=rowAvg[i];const up=(v-price)/price*100;const c=up>25?'#16a34a':up>10?'#2563eb':up>0?'#60a5fa':up>-15?'#d97706':'#dc2626';return`<div style="background:${_dm()?'#1c2333':'#f7f6f3'};border-radius:8px;padding:7px 3px;text-align:center;border-top:3px solid ${c};"><div style="font-size:8px;color:var(--muted);">${y}</div><div style="font-size:12px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};margin:2px 0;">${curSymG()}${N(v)}</div><div style="font-size:9px;font-weight:600;color:${c};">${up>=0?'+':''}${up.toFixed(0)}%</div></div>`;}).join('')}
          </div>
          <div style="font-size:9px;color:var(--muted);margin-top:5px;">EV/FCF ${Math.round(medEvFcf*0.82)}x · PER ${Math.round((co.med5PER||co.medPER)*0.82)}x · <a href="#" onclick="showTab('valoracion');return false;" style="color:${co.color};font-weight:700;text-decoration:none;">Ver escenarios →</a></div>
        </div>
      </div>
    </div>

    <!-- ══ BLOQUE 6: GRÁFICO COTIZACIÓN ══ -->
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:10px;">
      <div style="padding:7px 14px;background:${_dm()?'#161b27':'#f9f8f6'};border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">${co.name} · Semanal · TradingView${tvLink?` · <span style="text-transform:none;color:var(--muted);font-weight:600;">ADR ${tvSymbol} (USD)</span>`:''}</span>
        ${tvLink?`<a href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvLink)}" target="_blank" rel="noopener" style="font-size:9px;font-weight:700;color:#2563eb;text-decoration:none;border:1px solid #2563eb55;border-radius:9px;padding:2px 8px;white-space:nowrap;">Ver ${tvLink} (bolsa local) ↗</a>`:''}
      </div>
      <div class="tv-wrap"><iframe
        src="https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=W&theme=light&style=1&locale=es&toolbarbg=F1F3F6&hideideas=1&range=24M&hidetoptoolbar=0&hidesidetoolbar=1&saveimage=0&studies=%5B%5D&hide_legend=0"
        style="width:100%;height:360px;border:none;display:block;" allowtransparency="true" scrolling="no" allowfullscreen>
      </iframe></div>
    </div>

    <!-- ══ ANÁLISIS TÉCNICO — niveles de referencia ══ -->
    <div class="card" id="tech-card" style="margin-bottom:10px;">
      <div class="ctitle">Análisis técnico — niveles de referencia</div>
      <div id="tech-box" style="font-size:11px;color:var(--muted);padding:6px 0;">Cargando indicadores técnicos…</div>
      <div style="font-size:9px;color:var(--muted);margin-top:6px;line-height:1.5;">El análisis técnico refleja la <b>tendencia y el momento del precio</b> (corto plazo) — complementa, no sustituye, a la valoración fundamental.</div>
    </div>

    <!-- ══ BLOQUE 7: MI POSICIÓN ══ -->
    ${rMiPosicion(vd,fv5)}

  </div><!-- /resumen layout -->`;
}
