// ─────────────────────────────────────────────────────────────
// MOAT, DCF inverso, DCF estresado, calidad del FCF y veredicto final
// ─────────────────────────────────────────────────────────────
function calcMoat(){
  const r9=co.roic[9],rt=co.roic[9]-co.roic[0],sg=cagr(co.sales[9],co.sales[0],9);
  const fm=co.fcfM[9],dd=co.netDebt[9]/co.ebitda[9],cx=co.isD.cx[0];
  const t=co.ticker;
  const switchScore=t==='ASML.AS'?98:t==='CSU.TO'?95:t==='MSFT'?88:t==='AAPL'?85:t==='NVDA'?80:t==='GOOGL'?82:t==='META'?65:t==='AMZN'?70:60;
  const switchWhy=t==='ASML.AS'?'Único fabricante EUV del mundo. Sin sustituto posible.':t==='CSU.TO'?'VMS crítico. Cambiar = meses de riesgo operativo.':t==='MSFT'?'Azure + M365 + Teams integrados. Costes de cambio altísimos.':t==='AAPL'?'Ecosistema cerrado: iPhone+Mac+Watch+AirPods. Lock-in extremo.':t==='NVDA'?'CUDA + arquitectura dominante. Sin alternativa equivalente en IA.':t==='GOOGL'?'Hábito de uso + red de publicidad. 90%+ cuota en Search.':t==='META'?'Efecto red 3.3B usuarios. Instagram+WhatsApp+Facebook.':'AWS + Prime + Marketplace. Costes de cambio moderados.';
  const capAlloc=t==='CSU.TO'?90:t==='MSFT'?82:t==='AAPL'?88:t==='ASML.AS'?78:t==='NVDA'?75:t==='GOOGL'?72:t==='META'?70:65;
  const capWhy=t==='CSU.TO'?'81% FCF en adquisiciones a 3-7x EBITDA desde 1995.':t==='MSFT'?'Recompras masivas + dividendos crecientes 15 años.':t==='AAPL'?'$90B+ anuales en recompras. El mayor programa de buyback de la historia.':t==='ASML.AS'?'Dividendos crecientes + recompras selectivas.':t==='NVDA'?'Inversión en I+D + recompras crecientes.':t==='GOOGL'?'Buybacks masivos + inversión en IA/Cloud.':t==='META'?'Recompras agresivas + inversión en IA (Llama).':'Reinversión en AWS + logística + IA.';
  const items=[
    {n:"Switching costs / monopolio tecnológico",w:15,s:switchScore,why:switchWhy},
    {n:"CapEx / Ventas (ligereza de activos)",w:10,s:Math.min(100,Math.max(0,Math.round((1-cx/10)*100))),why:`CapEx/Ventas ${cx}%.`},
    {n:"Working Capital negativo",w:10,s:co.isD.wc[0]<-15?90:co.isD.wc[0]<-5?70:co.isD.wc[0]<0?50:35,why:`WC/Ventas ${co.isD.wc[0]}%.`},
    {n:"ROIC vs coste de capital",w:15,s:r9>=50?100:r9>=30?92:r9>=20?82:r9>=15?68:r9>=10?50:25,why:`ROIC ${P(r9)} vs WACC ~${co.wacc}%. Spread ${(r9-co.wacc).toFixed(0)}pp.`},
    {n:"Tendencia ROIC 10 años",w:8,s:rt>=0?85:rt>=-10?55:rt>=-20?30:15,why:`De ${co.roic[0]}% (2016) a ${r9}% (2025).`},
    {n:"Margen FCF consistente",w:12,s:fm>=35?95:fm>=25?85:fm>=20?75:fm>=15?60:fm>=10?42:25,why:`Margen FCF ${P(fm)}.`},
    {n:"CAGR Ventas 10 años",w:12,s:sg>=40?98:sg>=25?90:sg>=20?82:sg>=15?70:sg>=10?55:35,why:`CAGR ${P(sg)}.`},
    {n:"Capital allocation / reinversión FCF",w:10,s:capAlloc,why:capWhy},
    {n:"Sin dilución accionarial",w:8,s:Math.max(0,100-Math.abs(co.isD.di[0])*15),why:`Dilución anual: ${co.isD.di[0]}%.`},
    {n:"Solidez balance (Deuda/EBITDA)",w:10,s:dd<0?100:dd<1?88:dd<2?68:dd<3?42:12,why:`Deuda/EBITDA ${dd.toFixed(1)}x.`},
  ];
  let tot=0,w=0;items.forEach(it=>{tot+=it.s*it.w;w+=it.w;});
  const ov=Math.round(tot/w);
  return{items,overall:ov,label:ov>=85?"MOAT EXCEPCIONAL":ov>=70?"MOAT SÓLIDO":ov>=55?"MOAT MODERADO":"MOAT DÉBIL",color:ov>=85?"#16a34a":ov>=70?"#0891b2":ov>=55?"#d97706":"#dc2626"};
}

// ── NUEVA MEJORA 1: REVERSE DCF ──
// Busca por búsqueda binaria qué tasa de crecimiento del FCF descuenta el precio actual
function calcReverseDCF(){
  const targetEV=price*co.shares+co.netDebt[9];
  let lo=-10,hi=80,mid=0;
  for(let iter=0;iter<60;iter++){
    mid=(lo+hi)/2;
    let pv=0;
    for(let i=1;i<=10;i++) pv+=(co.fcf[9]*Math.pow(1+mid/100,i))/Math.pow(1+dr/100,i);
    const tv=(co.fcf[9]*Math.pow(1+mid/100,10)*(1+tg/100))/(dr/100-tg/100);
    const ev=pv+tv/Math.pow(1+dr/100,10);
    if(Math.abs(ev-targetEV)/Math.max(targetEV,1)<0.0001) break;
    if(ev<targetEV) lo=mid; else hi=mid;
  }
  const impliedG=mid;
  const historicalFCFCagr=cagr(co.fcf[9],co.fcf[0],9);
  const diff=impliedG-historicalFCFCagr;
  const label=impliedG>historicalFCFCagr+10?'El mercado exige mucho más que el histórico 🔴':
               impliedG>historicalFCFCagr+2?'El mercado descuenta crecimiento optimista 🟡':
               impliedG>historicalFCFCagr-5?'El mercado descuenta crecimiento histórico ✓ 🟢':
               'El mercado descuenta MENOS que el histórico — posible oportunidad 🟢';
  return{impliedG:+impliedG.toFixed(1),historicalFCFCagr:+historicalFCFCagr.toFixed(1),diff:+diff.toFixed(1),label};
}

// ── NUEVA MEJORA 2: STRESS TEST RECESIÓN ──
// Simula un escenario de recesión: -20% ventas año1, -5% año2, recovery año3
function calcStressDCF(){
  const baseFCF=co.fcf[9];
  const baseMargin=co.fcfM[9]/100;
  const baseSales=co.sales[9];
  // Año 1: -20% ventas, -5pp margen FCF
  const s1=baseSales*0.80;const m1=Math.max(0,baseMargin-0.05);const fcf1=s1*m1;
  // Año 2: -5% adicional, -3pp margen FCF
  const s2=s1*0.95;const m2=Math.max(0,m1-0.03);const fcf2=s2*m2;
  // Año 3: recovery +12% ventas, márgenes parcialmente recuperados
  const s3=s2*1.12;const m3=m2+0.02;const fcf3=s3*m3;
  // Años 4-10: crecimiento normal al gr configurado
  let pv=0;
  const fcfsByYear=[fcf1,fcf2,fcf3];
  for(let i=1;i<=10;i++){
    const fcfI=i<=3?fcfsByYear[i-1]:fcf3*Math.pow(1+gr/100,i-3);
    pv+=fcfI/Math.pow(1+dr/100,i);
  }
  const fcf10=fcf3*Math.pow(1+gr/100,7);
  const tv=(fcf10*(1+tg/100))/(dr/100-tg/100);
  const stressedDCF=(pv+tv/Math.pow(1+dr/100,10)-co.netDebt[9])/co.shares;
  const baseDCF=calcDCF();
  const impact=((stressedDCF-baseDCF)/Math.abs(baseDCF)*100);
  const upsideStress=(stressedDCF-price)/price*100;
  const minFCF=Math.min(fcf1,fcf2,fcf3);
  const fcfDrop=(minFCF-baseFCF)/baseFCF*100;
  return{stressedDCF:+stressedDCF.toFixed(0),baseDCF:+baseDCF.toFixed(0),impact:+impact.toFixed(1),
    upsideStress:+upsideStress.toFixed(1),minFCF:+minFCF.toFixed(0),fcfDrop:+fcfDrop.toFixed(1),
    fcf1:+fcf1.toFixed(0),fcf2:+fcf2.toFixed(0),fcf3:+fcf3.toFixed(0)};
}

// ── NUEVA MEJORA 3: FCF QUALITY (FCF/Net Income ratio) ──
function calcFCFQuality(){
  // Promedio 5Y para suavizar volatilidad
  const years5=[5,6,7,8,9]; // índices 2021-2025
  let totalFCF=0,totalNI=0;
  years5.forEach(i=>{
    totalFCF+=co.fcf[i];
    // NetIncome approx: usamos netIncome si existe, si no estimamos EPS×shares
    const ni=co.netIncome?co.netIncome[i]:(co.eps[i]*co.shares);
    totalNI+=ni;
  });
  const ratio=totalNI>0?(totalFCF/totalNI):0;
  // Año actual
  const niCurrent=co.netIncome?co.netIncome[9]:(co.eps[9]*co.shares);
  const ratioCurrent=niCurrent>0?(co.fcf[9]/niCurrent):0;
  const label=ratio>=1.0?'EXCELENTE':ratio>=0.85?'BUENA':ratio>=0.70?'ACEPTABLE':ratio>=0.50?'DUDOSA':'ALERTA ROJA';
  const color=ratio>=0.85?'#16a34a':ratio>=0.70?'#d97706':ratio>=0.50?'#ea580c':'#dc2626';
  const bg=ratio>=0.85?'#f0fdf4':ratio>=0.70?'#fffbeb':ratio>=0.50?'#fff7ed':'#fef2f2';
  const why=ratio>=1.0?'FCF > Beneficio. La empresa convierte más del 100% del beneficio contable en caja real — señal de altísima calidad.':
             ratio>=0.85?'FCF ≈ Beneficio. Alta conversión — los beneficios contables se corresponden bien con la caja generada.':
             ratio>=0.70?'Conversión razonable, pero hay diferencia entre beneficio contable y caja real. Vigilar CapEx y variaciones de WC.':
             ratio>=0.50?'Conversión baja. El beneficio contable está significativamente inflado respecto al FCF real. Revisar calidad del accrual.':
             'Conversión muy baja o negativa. Señal de alerta: los beneficios contables están muy divorciados del cash real.';
  return{ratio:+ratio.toFixed(2),ratioCurrent:+ratioCurrent.toFixed(2),label,color,bg,why,
    totalFCF:Math.round(totalFCF/5),totalNI:Math.round(totalNI/5)};
}

// ── NUEVA MEJORA 4: VEREDICTO MULTI-EJE ──
// Sistema scoring: MdS (40pts) + MOAT (35pts) + ROIC trend (25pts)
function calcVerdict(){
  const dcf=calcDCF(),mult=calcMult();
  const ud=(dcf-price)/price*100,um=(mult.avg-price)/price*100;
  const ms=Math.min(ud,um);

  // Valor justo = PRECIO OBJETIVO EV/FCF del próximo año (2026e), MISMA fuente que la pestaña
  // Valoración y tu plantilla (tu múltiplo objetivo · año siguiente). Solo EV/FCF.
  const med5_evf=co.med5EvFcf||co.medEvFcf;
  const med5_per=co.med5PER||co.medPER;
  const _gm=getCompanyMults(coKeyOf(co));
  const baseEVF=_gm.evf;
  const basePER=_gm.per;
  const _evfT=evfTargetsFor(co);
  const fairBase=(_evfT[0]!=null?_evfT[0]:(co.fcf[9]*_gm.evf-co.netDebt[9])/co.shares);
  const msBase=((fairBase-price)/price*100);

  const moat=calcMoat();

  // ─── PESO REBALANCEADO v2: Retorno 5Y 35 · MOAT 30 · ROIC 20 · MdS próx.año 15 ───
  // El componente principal pasa a ser el RETORNO ESPERADO ANUALIZADO a 5 años (CAGR hasta
  // tu objetivo PROMEDIO 5Y — el mismo número del dashboard). Antes el MdS de PRÓXIMO año
  // pesaba 50 y hundía a compounders de crecimiento (caros a 1 año pero con gran CAGR 5Y,
  // ej. NVIDIA). El MdS a 1 año sigue contando (15) como control de no sobrepagar a corto.
  const _avgT5=avgTargetsFor(co);
  const fair5=(_avgT5&&_avgT5[4]!=null)?_avgT5[4]:(_evfT&&_evfT[4]!=null?_evfT[4]:fairBase);
  const cagr5e=(fair5&&price>0)?(Math.pow(Math.max(fair5,1)/Math.max(price,1),0.2)-1)*100:0;
  const retScore=Math.round(
    cagr5e>=20 ? 35 :
    cagr5e>=12 ? 22+(cagr5e-12)/8*13 :   // 12%→22 ... 20%→35
    cagr5e>=0  ? cagr5e/12*22 :           // 0%→0 ... 12%→22
    0
  );
  // MdS próximo año (curva continua, escalada a 0-15)
  const _mdsRaw=( msBase>=30?50: msBase>=15?42+(msBase-15)/15*8 : msBase>=0?30+msBase/15*12 : msBase>=-20?30+msBase/20*30 : 0 );
  const mdsScore=Math.round(_mdsRaw*15/50);
  const moatScore=Math.round(moat.overall*30/100);

  // ─── ROIC: tendencia 5Y + nivel absoluto + momentum ───
  const roicTrend10=co.roic[9]-co.roic[0];
  const roicTrend5=co.roic[9]-co.roic[4];
  const roicTrend=roicTrend5;
  const roicAbs=co.roic[9];
  // Regresión lineal sobre los 5 últimos años
  const roicLast5=co.roic.slice(5);
  const n5=roicLast5.length,sumX=n5*(n5-1)/2,sumY=roicLast5.reduce((a,b)=>a+b,0);
  const sumXY=roicLast5.reduce((a,v,i)=>a+i*v,0),sumX2=roicLast5.reduce((a,_,i)=>a+i*i,0);
  const roicSlope=(n5*sumXY-sumX*sumY)/(n5*sumX2-sumX*sumX);
  const roicMomentum=roicSlope>1.5?'acelerando ↑↑':roicSlope>0.3?'estable o creciendo →':roicSlope>-1.5?'ralentizando ↓':'cayendo ↓↓';
  let roicScore=0;
  if(roicAbs>=40) roicScore=18;
  else if(roicAbs>=25) roicScore=15;
  else if(roicAbs>=18) roicScore=11;
  else if(roicAbs>=12) roicScore=6;
  else roicScore=2;
  if(roicTrend5<-15) roicScore=Math.max(0,roicScore-7);
  else if(roicTrend5<-7) roicScore=Math.max(0,roicScore-3);
  else if(roicTrend5>=5) roicScore=Math.min(20,roicScore+2);

  let totalScore=retScore+mdsScore+moatScore+roicScore;

  // ─── PENALIZACIÓN POR EUFORIA: precio por encima del múltiplo más alto razonable ───
  const evfcfActual=Math.round((price*co.shares+co.netDebt[9])/co.fcf[9]);
  const perActual=+(price/co.eps[9]).toFixed(1);
  const euforiaEVF=evfcfActual>med5_evf*1.10; // >10% sobre mediana 5Y
  const euforiaPER=perActual>med5_per*1.10;
  let euforiaPenalty=0;
  if(euforiaEVF&&euforiaPER){euforiaPenalty=10;totalScore=Math.max(0,totalScore-10);}
  else if(euforiaEVF||euforiaPER){euforiaPenalty=5;totalScore=Math.max(0,totalScore-5);}

  // ─── DECISIÓN alineada a la PUNTUACIÓN total (retorno+MOAT+ROIC+MdS ya están dentro) ───
  let verdict,verdictColor,verdictBg;
  const dark=_dm();
  if(totalScore>=65){
    verdict='COMPRAR';verdictColor=dark?'#3fb950':'#16a34a';verdictBg=dark?'#0d2117':'#f0fdf4';
  }else if(totalScore>=45){
    verdict='MANTENER';verdictColor=dark?'#e3b341':'#d97706';verdictBg=dark?'#1a1200':'#fffbeb';
  }else{
    verdict='EVITAR';verdictColor=dark?'#f78166':'#dc2626';verdictBg=dark?'#200a0a':'#fef2f2';
  }

  const reasoning=`Score ${totalScore}/100 — Retorno 5Y(${retScore}/35) + MOAT(${moatScore}/30) + ROIC(${roicScore}/20) + MdS(${mdsScore}/15)${euforiaPenalty>0?` − Euforia(-${euforiaPenalty})`:''}. Retorno esperado ~${cagr5e>=0?'+':''}${cagr5e.toFixed(0)}%/año · Precio justo 1Y ${curSymG()}${N(Math.round(fairBase))} (MdS ${msBase>=0?'+':''}${msBase.toFixed(0)}%)`;

  return{verdict,verdictColor,verdictBg,totalScore,retScore,cagr5e:+cagr5e.toFixed(1),mdsScore,moatScore,roicScore,
    ms:+ms.toFixed(1),msBase:+msBase.toFixed(1),fairBase:Math.round(fairBase),
    roicTrend,roicTrend5,roicTrend10,roicSlope:+roicSlope.toFixed(1),roicMomentum,
    euforiaEVF,euforiaPER,euforiaPenalty,
    evfcfActual,perActual,med5_evf,med5_per,
    reasoning,moat};
}
