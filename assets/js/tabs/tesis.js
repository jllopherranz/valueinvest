// ─────────────────────────────────────────────────────────────
// Pestaña Tesis IA: prompt, llamada al modelo y formato de la respuesta
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// TESIS
// ═══════════════════════════════════════════════════════════════════
function rTesis(){
  const vd=calcVerdict(),rev=calcReverseDCF(),quality=calcFCFQuality(),stress=calcStressDCF();
  return`<div class="card"><div class="ctitle">Tesis de Inversión — Generada por IA (Claude)</div>
  <p style="font-size:12px;color:var(--sub);margin-bottom:11px;line-height:1.65;">Claude analiza todos los datos financieros incluyendo Reverse DCF, Calidad FCF y Stress Test para generar una tesis estructurada.</p>
  <div class="params-row">${[{l:"Empresa",v:co.name},{l:"Precio",v:curSymG()+N(price)},{l:"Veredicto",v:vd.verdict+" ("+vd.totalScore+"/100)"},{l:"MOAT",v:vd.moat.overall+"/100"},{l:"Implícito",v:rev.impliedG+"% vs hist "+rev.historicalFCFCagr+"%"},{l:"FCF Quality",v:quality.label},{l:"Stress DCF",v:curSymG()+N(stress.stressedDCF)+" ("+stress.impact+"%impact)"}].map(p=>`<span class="ptag">${p.l}: <strong style="color:${_dm()?'#e2e8f0':'#1a1814'}">${p.v}</strong></span>`).join('')}</div>
  <button class="aibtn" id="t-btn" onclick="genTesis()">✍️ Generar Tesis de Inversión</button>
  <div id="t-out" class="aiout" style="display:none;"></div>
  <div style="margin-top:9px;padding:9px 13px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e;">Esta tesis es generada por IA con carácter exclusivamente informativo. No constituye asesoramiento financiero.</div></div>`;
}

// ═══════════════════════════════════════════════════════════════════
// AI — TESIS GENERATION (includes all new features in prompt)
// ═══════════════════════════════════════════════════════════════════
function fmtAI(t){
  return t.split('\n').map(l=>{
    if(l.startsWith('## ')) return`<h3>${l.replace('## ','')}</h3>`;
    if(l.startsWith('# ')) return`<h3 style="font-size:14px;">${l.replace('# ','')}</h3>`;
    if(l.startsWith('- ')||l.startsWith('• ')){
      const txt=l.replace(/^[-•] /,'');
      const bg2=txt.includes('🟢')?'#f0fdf4':txt.includes('🔴')?'#fef2f2':txt.includes('🟡')?'#fffbeb':'transparent';
      const bd2=txt.includes('🟢')?'1px solid #bbf7d0':txt.includes('🔴')?'1px solid #fecaca':txt.includes('🟡')?'1px solid #fde68a':'none';
      return`<div style="padding:${bg2!=='transparent'?'7px 11px':'2px 4px'};margin:3px 0;background:${bg2};border:${bd2};border-radius:6px;">${txt.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</div>`;
    }
    if(l.trim()==='') return'<div style="height:5px"></div>';
    return`<p style="margin:3px 0;">${l.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</p>`;
  }).join('');
}
async function genTesis(){
  const btn=document.getElementById('t-btn'),out=document.getElementById('t-out');
  btn.disabled=true;btn.innerHTML='⏳ Generando análisis…';out.style.display='none';
  const vd=calcVerdict(),rev=calcReverseDCF(),quality=calcFCFQuality(),stress=calcStressDCF();
  const dcf=calcDCF();
  const evfcfAct=Math.round((price*co.shares+co.netDebt[9])/co.fcf[9]);
  const prompt=`Eres un analista value de primer nivel analizando ${co.name} (${co.ticker}) en mayo 2026. Tu rol es CRÍTICO: busca lo que los optimistas ignoran. Estructura tu análisis en español así:

## 1. Tesis en 3 Frases
¿Por qué alguien COMPRARÍA? ¿Por qué alguien VENDERÍA?

## 2. El Negocio — Ventaja Competitiva REAL
¿Es el MOAT duradero o en erosión? ¿Tiene pricing power demostrado? ¿Puede mantener márgenes en recesión?

## 3. Semáforo Financiero
Analiza críticamente cada dato — si algo está mal, dilo sin rodeos:
- 🟢/🟡/🔴 Crecimiento ventas: tendencia real, no maquillada
- 🟢/🟡/🔴 Calidad FCF (ratio ${(quality.ratio*100).toFixed(0)}%): ¿es cash real o contabilidad creativa?
- 🟢/🟡/🔴 ROIC ${co.roic[9]}% vs WACC ${co.wacc}%: ¿mejorando o destruyendo valor?
- 🟢/🟡/🔴 Valoración: EV/FCF ${evfcfAct}x vs mediana ${co.medEvFcf}x — ¿caro, justo, barato?
- 🟢/🟡/🔴 Balance: ND/EBITDA ${(co.netDebt[9]/co.ebitda[9]).toFixed(1)}x — ¿resistiría una crisis 2008?

## 4. Puntos de Fuga — Lo que puede salir MAL
Identifica 3-5 riesgos específicos NO obvios. No pongas genéricos ("la competencia"). Busca:
- Amenazas estructurales al modelo de negocio
- Señales contables o financieras preocupantes
- Dependencias peligrosas (clientes, reguladores, tecnología)
- El Reverse DCF dice que el mercado descuenta ${rev.impliedG}% de crecimiento FCF — ¿es alcanzable?

## 5. Puntos de Crecimiento — Lo que puede salir BIEN (con números)
3-4 catalizadores específicos con impacto cuantificable.

## 6. Precio Objetivo y Veredicto
- DCF: ${curSymG()}${N(dcf,0)} | Stress DCF: ${curSymG()}${N(stress.stressedDCF)} (−${Math.abs(stress.impact)}%)
- Precio actual ${curSymG()}${N(price)} implica premium/descuento de ${((price-dcf)/dcf*100).toFixed(0)}% vs DCF
- Veredicto claro: COMPRAR / MANTENER / EVITAR con precio de entrada objetivo

DATOS COMPLETOS:
${co.name} | ${curSymG()}${N(price)} | Score ${vd.totalScore}/100 | ${vd.verdict}
Ventas: ${curSymG()}${N(co.sales[9])}M CAGR10Y ${P(cagr(co.sales[9],co.sales[0],9))} | FCF: ${curSymG()}${N(co.fcf[9])}M Mg ${P(co.fcfM[9])}
EBITDA Mg: ${P(co.ebitdaM[9])} | ROIC: ${co.roic[9]}% (2016: ${co.roic[0]}%) | ND/EBITDA: ${(co.netDebt[9]/co.ebitda[9]).toFixed(1)}x
EV/FCF: ${evfcfAct}x vs med ${co.medEvFcf}x | Calidad FCF: ${quality.label} | MOAT: ${vd.moat.overall}/100 ${vd.moat.label}
Rev DCF implícito: ${rev.impliedG}% vs histórico ${rev.historicalFCFCagr}% (${rev.diff>=0?'+':''}${rev.diff}pp)

MÁX 800 PALABRAS. Sé directo y específico. No uses frases vacías. Usa 🚨 para alertas críticas.`;
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1400,messages:[{role:"user",content:prompt}]})});
    const d=await r.json();
    out.innerHTML=fmtAI(d.content?.find(b=>b.type==="text")?.text||"Sin respuesta");
    out.style.display='block';
  }catch(e){out.innerHTML='<p style="color:#dc2626;">Error al conectar con la IA. Comprueba conexión.</p>';out.style.display='block';}
  btn.disabled=false;btn.innerHTML='✍️ Generar Tesis de Inversión';
}
