// ─────────────────────────────────────────────────────────────
// Motor de valoración: DCF, múltiplos y modelo de proyección a 5 años
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════════
function calcDCF(){
  if(dr<=tg) return 0;
  let pv=0;
  for(let i=1;i<=10;i++) pv+=(co.fcf[9]*Math.pow(1+gr/100,i))/Math.pow(1+dr/100,i);
  const tv=(co.fcf[9]*Math.pow(1+gr/100,10)*(1+tg/100))/(dr/100-tg/100);
  return (pv+tv/Math.pow(1+dr/100,10)-co.netDebt[9])/co.shares;
}

function calcMult(){
  const nd=co.netDebt[9],sh=co.shares;
  const f=(co.fcf[9]*tEVF-nd)/sh;
  const p=co.eps[9]*tPER;
  const e=(co.ebitda[9]*tEVE-nd)/sh;
  const ei=(co.ebit[9]*tEVEI-nd)/sh;
  return{f,p,e,ei,avg:(f+p+e+ei)/4};
}

function calcISModel(){
  // ── FUENTE ÚNICA = LA HOJA ──
  // Si hay proyecciones importadas/de la hoja y NO se ha editado el modelo, se usan TAL CUAL
  // (ventas, EBITDA, FCF, EPS, deuda neta). Así Valoración, target y múltiplo 2026e cuadran
  // con la hoja y con la pestaña Proyecciones. El modo % editable es solo simulación.
  if(_projSource==='auto'){ const w=_webProj[coKeyOf(co)]; if(w&&w.rows&&w.rows.length) return w.rows; }
  if(!_isEdited && co.pS&&co.pF&&co.pEB&&co.pEPS && co.pS.length>=5){
    const ebRatio=co.ebitda[9]>0?(co.ebit[9]/co.ebitda[9]):0.85;
    return co.pS.slice(0,5).map((s,i)=>{
      const eb=co.pEB[i], ebit=eb*ebRatio, fcf=co.pF[i], eps=co.pEPS[i];
      const nd=(co.pND&&co.pND[i]!=null)?co.pND[i]:co.netDebt[9];
      const tr=(co.isD&&co.isD.tr&&co.isD.tr[i]!=null)?co.isD.tr[i]/100:0.18;
      // acciones proyectadas: de la hoja si existen; si no, derivadas de EPS y beneficio (nopat/eps)
      const sh=(co.pShares&&co.pShares[i]>0)?co.pShares[i]:(eps>0?(ebit*(1-tr))/eps:co.shares);
      return {yr:co.pY[i],s,eb,ebit,fcf,eps,sh,nd,em:s>0?ebit/s*100:0,ebm:s>0?eb/s*100:0,fm:s>0?fcf/s*100:0};
    });
  }
  // ── Modo simulación (porcentajes editables) ──
  const rows=[];let ps=co.sales[9],psh=co.shares;
  const ebitdaEbitRatio=(co.ebitdaM[9]/Math.max(co.ebitM[9],1));
  for(let i=0;i<5;i++){
    const s=ps*(1+isSG[i]/100);
    const ebit=s*isEM[i]/100;
    const eb=ebit*ebitdaEbitRatio;
    const nopat=ebit*(1-isTR[i]/100);
    const cx=s*isCX[i]/100;
    const dwc=(s-ps)*Math.abs(isWC[i])/100*(isWC[i]<0?1:-1);
    const fcf=nopat+(eb-ebit)-cx+dwc;
    const sh=psh*(1+isDI[i]/100);
    const nd=Math.max(0,(rows[i-1]?.nd??co.netDebt[9])-fcf*0.3);
    rows.push({yr:co.pY[i],s,eb,ebit,fcf,eps:nopat/sh,sh,nd,em:isEM[i],ebm:eb/s*100,fm:fcf/s*100});
    ps=s;psh=sh;
  }return rows;
}
