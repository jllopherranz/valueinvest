// ─────────────────────────────────────────────────────────────
// Clasificación Growth / Value / Quality
// ─────────────────────────────────────────────────────────────
// ── CLASIFICACIÓN DE ESTILO: Growth / Value / GARP / Quality ──
// Parametrizable por empresa (c, px) para reutilizar en el comparador del Dashboard.
function computeStyleFor(c,px){
  const clamp=(v)=>Math.max(0,Math.min(100,v));
  const gSales5=cagr(c.sales[9],c.sales[4],5);
  const gFwdSales=(c.pS&&c.pS[4]&&c.sales[9]>0)?(Math.pow(Math.max(c.pS[4],1)/c.sales[9],1/5)-1)*100:gSales5;
  const gEps5=(c.eps[4]>0&&c.eps[9]>0)?cagr(c.eps[9],c.eps[4],5):gSales5;
  const growth=(gSales5+gFwdSales+gEps5)/3;            // crecimiento representativo (hist + fwd)
  const roic=c.roic[9], fcfM=c.fcfM[9];
  // FCF del año EN CURSO: proyección del Excel (pF[0]) si existe; si no, último histórico
  const fcfCur=(c.pF&&c.pF[0]>0)?c.pF[0]:c.fcf[9];
  const evfcfCur=(px*c.shares+c.netDebt[9])/fcfCur;
  const med=c.med5EvFcf||c.medEvFcf;
  const cheapPct=med?(med-evfcfCur)/med*100:0;          // + = barato vs su propia historia
  const growthScore=clamp(growth/25*100);               // 25%+ → tope
  const qualityScore=clamp(roic/40*60 + fcfM/40*40);
  const valueScore=clamp(50+cheapPct*1.5);              // en mediana=50
  const quality=roic>=20&&fcfM>=18;
  // ── Indicadores adicionales ──
  const per=c.eps[9]>0?px/c.eps[9]:null;
  const peg=(per&&growth>0)?per/growth:null;            // PEG (Lynch): <1 barato, >2 caro
  const ruleOf40=growth+fcfM;                            // crecimiento% + margen FCF%
  const fcfYield=fcfCur/(px*c.shares)*100;               // rentabilidad de caja al precio actual (FCF año en curso)
  const dilution=(c.isD&&c.isD.di&&c.isD.di.length)?c.isD.di[0]:null; // <0 = recompra neta
  const reinvest=(c.isD&&c.isD.cx&&c.isD.cx.length)?c.isD.cx[0]:null;  // CapEx/Ventas %
  let style,icon,color,desc;
  if(growth>=18&&quality){
    style='Quality Growth';icon='🚀';color='#7c3aed';
    desc='Compounder de alto crecimiento con rentabilidad excepcional (ROIC alto, márgenes fuertes). El mercado paga prima — la clave es el ritmo de composición, no el descuento.';
  }else if(growth>=12&&quality){
    style=cheapPct>=-5?'GARP · Calidad':'Quality Growth';icon='💎';color='#2563eb';
    desc='Negocio de calidad creciendo a doble dígito. Estilo Buffett/Munger: gran empresa a precio razonable, donde el motor es el crecimiento del valor intrínseco.';
  }else if(growth>=12){
    style=cheapPct>=-5?'GARP':'Growth';icon=cheapPct>=-5?'⚖️':'📈';color='#16a34a';
    desc=cheapPct>=-5?'Crecimiento a precio razonable (GARP, estilo Lynch): doble dígito de crecimiento sin pagar múltiplos de burbuja.':'Empresa de crecimiento que cotiza con prima sobre su historia — el retorno depende de que el crecimiento se mantenga.';
  }else if(growth>=6){
    style=quality?'Calidad / Compounder':'Mixta';icon=quality?'🏰':'🔀';color=quality?'#0891b2':'#d97706';
    desc=quality?'Crecimiento moderado pero rentabilidad y foso elevados: compounder estable que crea valor reinvirtiendo a altos retornos.':'Perfil mixto: ni crecimiento alto ni descuento claro. Exige más margen de seguridad.';
  }else{
    style=cheapPct>=10?'Value':'Madura / Cíclica';icon=cheapPct>=10?'🪙':'🌿';color=cheapPct>=10?'#b45309':'#6b7280';
    desc=cheapPct>=10?'Bajo crecimiento pero cotiza con descuento sobre su historia (estilo value/Graham): la tesis es la reversión del múltiplo y/o el reparto de caja.':'Crecimiento bajo y sin descuento evidente. Vigilar ciclo y asignación de capital.';
  }
  const badges=[
    `Crec. ${growth>=0?'+':''}${growth.toFixed(0)}%/año`,
    `ROIC ${roic.toFixed(0)}%`,
    `Mg. FCF ${fcfM.toFixed(0)}%`,
    `EV/FCF ${evfcfCur.toFixed(0)}x (${cheapPct>=0?'−':'+'}${Math.abs(cheapPct).toFixed(0)}% vs media)`,
  ];
  return{style,icon,color,desc,growth:+growth.toFixed(1),roic,fcfM,evfcfCur:+evfcfCur.toFixed(1),cheapPct:+cheapPct.toFixed(1),
    growthScore:Math.round(growthScore),qualityScore:Math.round(qualityScore),valueScore:Math.round(valueScore),badges,
    per:per!=null?+per.toFixed(1):null,peg:peg!=null?+peg.toFixed(2):null,ruleOf40:+ruleOf40.toFixed(0),
    fcfYield:+fcfYield.toFixed(1),dilution,reinvest};
}
function classifyStyle(){return computeStyleFor(co,price);}
