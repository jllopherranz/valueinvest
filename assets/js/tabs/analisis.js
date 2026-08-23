// ─────────────────────────────────────────────────────────────
// Pestaña Análisis (checklist y alertas)
// ─────────────────────────────────────────────────────────────
// ── ANÁLISIS por partidas (IS · FCF · ROIC · Valoración) con semáforo + explicación ──
function rAnalisis(){
  const vd=calcVerdict(), q=calcFCFQuality();
  const yr=co.years, N0=v=>N(Math.round(v));
  const cnt=(arr,f)=>arr.filter(f).length;
  const spark=(series,color)=>{const a=(series||[]).slice(-6);const vals=a.filter(v=>v!=null);if(!vals.length)return'';const mx=Math.max(...vals.map(v=>Math.abs(v)),1);return'<div style="display:flex;align-items:flex-end;gap:2px;height:24px;justify-content:flex-end;">'+a.map(v=>{const h=v!=null?Math.max(2,Math.round(Math.abs(v)/mx*24)):2;const c=v==null?'#e0ddd8':v<0?'#dc2626':color;return`<div style="width:6px;height:${h}px;background:${c};border-radius:1px;"></div>`;}).join('')+'</div>';};
  // métricas
  const salesG5=cagr(co.sales[9],co.sales[4],5), salesYoY=pct(co.sales[9],co.sales[8]);
  const ebMT=co.ebitdaM[9]-co.ebitdaM[4], ebitMT=co.ebitM[9]-co.ebitM[4];
  const lossEbit=cnt(co.ebit,v=>v!=null&&v<0);
  const epsG5=(co.eps[4]>0&&co.eps[9]>0)?cagr(co.eps[9],co.eps[4],5):null;
  const di=(co.isD&&co.isD.di)?co.isD.di[0]:null;
  const negFcf=cnt(co.fcf,v=>v!=null&&v<0), fcfMT=co.fcfM[9]-co.fcfM[4];
  const cx=(co.isD&&co.isD.cx)?co.isD.cx[0]:null;
  const spread=co.roic[9]-co.wacc, roicT=co.roic[9]-co.roic[4], roicBelow=cnt(co.roic,v=>v!=null&&v<co.wacc);
  const evfcfAct=Math.round((price*co.shares+co.netDebt[9])/co.fcf[9]);
  const med5evf=co.med5EvFcf||co.medEvFcf, multPrem=med5evf?Math.round((evfcfAct-med5evf)/med5evf*100):null;
  const dd=co.netDebt[9]/co.ebitda[9];
  const spinCaveat=co.spinoffNote?' ⚠ OJO: esos años son PRE spin-off (incluían el negocio escindido) — NO comparables al negocio actual.':'';
  const blocks=[
   {title:'📊 Cuenta de resultados (P&L)',sheet:'1.IS',items:[
     {icon:'📦',label:'Ventas',value:''+curSymG()+N0(co.sales[9])+'M · '+(salesG5>=0?'+':'')+salesG5.toFixed(0)+'%/año',series:co.sales,color:'#2563eb',status:salesG5>=12?'pos':salesG5>=5?'warn':'neg',why:'La facturación es el motor: sin crecimiento de ventas, lo demás cuesta sostenerlo.',watch:'Último año '+(salesYoY>=0?'+':'')+salesYoY.toFixed(0)+'% vs media 5Y '+salesG5.toFixed(0)+'%: si el último es muy inferior, hay desaceleración.',bench:'>10%/año'},
     {icon:'💼',label:'Margen EBITDA',value:P(co.ebitdaM[9])+' ('+(ebMT>=0?'+':'')+ebMT.toFixed(0)+'pp 5Y)',series:co.ebitdaM,color:'#b45309',status:(co.ebitdaM[9]>=25&&ebMT>=-1)?'pos':(ebMT<-3?'neg':'warn'),why:'Rentabilidad operativa bruta. Alto y estable = poder de fijar precios.',watch:'Márgenes en contracción = presión de costes/competencia. Mira la tendencia, no solo el nivel.',bench:'>25%'},
     {icon:'⚙️',label:'Margen EBIT',value:P(co.ebitM[9])+' ('+(ebitMT>=0?'+':'')+ebitMT.toFixed(0)+'pp 5Y)',series:co.ebitM,color:'#d97706',status:(co.ebitM[9]>=18&&ebitMT>=-1)?'pos':(ebitMT<-3?'neg':'warn'),why:'Margen operativo tras amortizaciones; más exigente que el EBITDA.',watch:'Si el EBIT cae más que el EBITDA, las amortizaciones/capex pesan mucho.',bench:'>15%'},
     {icon:'📈',label:'Beneficio / EPS',value:'EPS '+curSymG()+N(co.eps[9],2)+(epsG5!=null?' · '+(epsG5>=0?'+':'')+epsG5.toFixed(0)+'%/año':''),series:co.eps,color:'#7c3aed',status:lossEbit>0?'neg':(epsG5!=null&&epsG5>=10?'pos':'warn'),why:'Beneficio por acción. Valídalo siempre con el FCF (abajo).',watch:(lossEbit>0?('⚠ '+lossEbit+' año(s) con EBIT en pérdidas → negocio CÍCLICO.'):'Crecimiento sostenido sin años en pérdidas = estable.')+spinCaveat,bench:'sin años en pérdidas'},
     ...(di!=null?[{icon:'🧾',label:'Dilución de acciones',value:(di>0?'+':'')+di+'%/año',color:di<=0?'#16a34a':'#dc2626',status:di<=0?'pos':di<=1.5?'warn':'neg',why:'Emitir acciones reparte el pastel entre más socios; recomprar lo concentra.',watch:di<=0?'Recompra neta: suma valor por acción ✓':'Emite acciones: parte de tu rentabilidad se diluye.',bench:'≤0% (recompra)'}]:[])
   ]},
   {title:'💵 Flujo de caja (FCF)',sheet:'2.FCF',items:[
     {icon:'💧',label:'Free Cash Flow',value:''+curSymG()+N0(co.fcf[9])+'M',series:co.fcf,color:'#16a34a',status:negFcf>=2?'neg':(co.fcf[9]>0?'pos':'warn'),why:'La caja real tras operar e invertir. Es lo único que paga dividendos, recompras y deuda.',watch:(negFcf>0?('⚠ '+negFcf+' año(s) de FCF NEGATIVO → quema de caja en partes del ciclo (típico en cíclicas).'):'FCF positivo y creciente = generación sana.')+spinCaveat,bench:'positivo y creciente'},
     {icon:'💦',label:'Margen FCF',value:P(co.fcfM[9])+' ('+(fcfMT>=0?'+':'')+fcfMT.toFixed(0)+'pp 5Y)',series:co.fcfM,color:'#16a34a',status:co.fcfM[9]>=15?'pos':co.fcfM[9]>=8?'warn':'neg',why:'Qué % de cada euro de ventas acaba en caja libre. Más alto = más eficiente.',watch:'Compáralo con el margen EBITDA: mucha diferencia = el capex o el circulante se comen la caja.',bench:'>15%'},
     {icon:'💎',label:'Calidad del beneficio (FCF/Bº)',value:(q.ratio*100).toFixed(0)+'% · '+q.label,color:q.color,status:q.ratio>=0.85?'pos':q.ratio>=0.7?'warn':'neg',why:'Cuánto del beneficio contable se convierte en caja real. Si es bajo, el beneficio es "de papel".',watch:'<70% = beneficio inflado vs caja. Revisa amortizaciones, circulante y partidas no monetarias.',bench:'>85%'},
     ...(cx!=null?[{icon:'🔨',label:'CapEx / Ventas',value:cx+'%',color:'#b45309',status:cx<5?'pos':cx<12?'warn':'neg',why:'Cuánto reinvierte en activos para operar. Bajo = negocio "ligero" que retiene más caja.',watch:cx>=12?'Capital intensivo: el capex se come buena parte del flujo.':'Negocio ligero en activos ✓',bench:'<5%'}]:[])
   ]},
   {title:'🎯 Rentabilidad del capital (ROIC)',sheet:'3.ROIC',items:[
     {icon:'🎯',label:'ROIC vs WACC',value:P(co.roic[9])+' vs WACC '+co.wacc+'% ('+(spread>=0?'+':'')+spread.toFixed(0)+'pp)',series:co.roic,color:'#b45309',status:spread>=10?'pos':spread>=0?'warn':'neg',why:'Si el retorno sobre el capital (ROIC) supera su coste (WACC), crecer CREA valor; si no, lo destruye.',watch:spread<0?'⚠ ROIC < WACC: crecer destruye valor.':'Spread amplio = ventaja competitiva que genera caja.',bench:'ROIC > WACC+10pp'},
     {icon:'📉',label:'Tendencia y consistencia',value:(roicT>=0?'+':'')+roicT.toFixed(0)+'pp 5Y · '+roicBelow+' año(s) < WACC',series:co.roic,color:'#0891b2',status:(roicT>=0&&roicBelow===0)?'pos':(roicT<-5||roicBelow>=3?'neg':'warn'),why:'Un ROIC alto y sostenido indica foso; uno que cae o baja del WACC en crisis indica fragilidad.',watch:'Años por debajo del WACC = vulnerable en la parte baja del ciclo.',bench:'estable y > WACC'},
   ]},
   {title:'💰 Valoración y solvencia',sheet:'4.Valoracion',items:[
     {icon:'🏆',label:'EV/FCF actual vs mediana',value:evfcfAct+'x vs '+Math.round(med5evf)+'x'+(multPrem!=null?' ('+(multPrem>=0?'+':'')+multPrem+'%)':''),color:multPrem!=null&&multPrem<=0?'#16a34a':'#dc2626',status:multPrem==null?'warn':multPrem<=0?'pos':multPrem<=20?'warn':'neg',why:'Cómo de caro cotiza hoy frente a su propia media histórica.',watch:multPrem>20?'Prima alta sobre su media: el mercado descuenta mucho optimismo.':'En/por debajo de su media histórica.',bench:'≤ mediana'},
     {icon:'📈',label:'Retorno esperado 5Y',value:(vd.cagr5e>=0?'+':'')+vd.cagr5e+'%/año',color:cagrColor(vd.cagr5e),status:vd.cagr5e>=12?'pos':vd.cagr5e>=6?'warn':'neg',why:'Rentabilidad anualizada estimada hasta tu objetivo promedio 5Y. Es el componente principal del veredicto.',watch:'Combina crecimiento + valoración + entrada. Negativo = sobrevalorada a este precio.',bench:'>12%/año'},
     {icon:'🛡️',label:'Margen de seguridad (1Y)',value:(vd.msBase>=0?'+':'')+vd.msBase+'%',color:potColor(vd.msBase),status:vd.msBase>=15?'pos':vd.msBase>=-5?'warn':'neg',why:'Distancia entre el precio y tu precio justo del próximo año. Colchón ante errores.',watch:'Negativo = pagas por encima del valor a 1 año (puede valer si el retorno 5Y es alto).',bench:'>15%'},
     {icon:'🏦',label:'Deuda neta / EBITDA',value:(co.netDebt[9]<0?'Caja neta · ':'')+dd.toFixed(1)+'x',series:co.netDebt.map(v=>v!=null?-v:null),color:'#1e3a5f',status:dd<1?'pos':dd<2.5?'warn':'neg',why:'Solvencia. En cíclicas (como STX) la deuda alta es letal cuando el ciclo cae.',watch:dd>=2.5?'⚠ Apalancamiento elevado: riesgo si el ciclo se gira.':(co.netDebt[9]<0?'Posición de caja neta: fortaleza ✓':'Deuda manejable.'),bench:'<1x · caja neta ideal'},
   ]},
  ];
  const all=blocks.flatMap(b=>b.items);
  const pos=cnt(all,a=>a.status==='pos'),warn=cnt(all,a=>a.status==='warn'),neg=cnt(all,a=>a.status==='neg');
  const stM={pos:{c:'#16a34a',bg:'#f0fdf4',bd:'#bbf7d0',l:'✓ Fuerte'},warn:{c:'#d97706',bg:'#fffbeb',bd:'#fde68a',l:'→ Vigilar'},neg:{c:'#dc2626',bg:'#fef2f2',bd:'#fecaca',l:'⚠ Red flag'}};
  return`
   ${co.spinoffNote?`<div style="background:linear-gradient(90deg,#fef3c7,#fffbeb);border:1.5px solid #f59e0b;border-radius:12px;padding:11px 14px;margin-bottom:10px;display:flex;gap:10px;align-items:flex-start;"><span style="font-size:18px;flex-shrink:0;"></span><div><div style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:2px;">Cambio estructural — léelo antes de juzgar el histórico</div><div style="font-size:11px;color:#78350f;line-height:1.5;">${co.spinoffNote} Los años en pérdidas/FCF negativo y los múltiplos antiguos corresponden a la empresa COMBINADA, no al negocio actual: pondera más los últimos años y la mediana 5Y.</div></div></div>`:''}
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;">
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#16a34a;">Fortalezas</div><div style="font-size:32px;font-weight:600;color:#16a34a;">${pos}</div></div>
     <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#d97706;">A vigilar</div><div style="font-size:32px;font-weight:600;color:#d97706;">${warn}</div></div>
     <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px;text-align:center;"><div style="font-size:11px;font-weight:700;color:#dc2626;">Red flags</div><div style="font-size:32px;font-weight:600;color:#dc2626;">${neg}</div></div>
   </div>
   <div style="font-size:10px;color:var(--muted);margin-bottom:10px;line-height:1.5;">Análisis automático de las partidas de TU hoja (IS · FCF · ROIC · Valoración). Cada métrica: dato + tendencia (últimos 6 años, rojo = negativo) + semáforo + qué es y qué vigilar.</div>
   ${(()=>{const moat=vd.moat;const ds=[...moat.items].sort((a,b)=>b.s-a.s);const strong=ds.slice(0,3),weak=ds.slice(-3).reverse();const dc=s=>s>=75?'#16a34a':s>=55?'#d97706':'#dc2626';return`<div class="card" style="margin-bottom:10px;">
     <div class="ctitle" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">Foso competitivo (MOAT) <span data-tip="moat" style="cursor:pointer;font-size:9px;font-weight:600;color:#0891b2;border:1px solid #0891b255;border-radius:10px;padding:2px 8px;">¿qué es? ⓘ</span></div>
     <div style="display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;">
       <div style="text-align:center;background:${moat.color}10;border:1.5px solid ${moat.color}40;border-radius:12px;padding:10px 6px;">
         <div style="font-size:32px;font-weight:600;color:${moat.color};line-height:1;">${moat.overall}</div>
         <div style="font-size:8px;color:var(--muted);">/100</div>
         <div style="font-size:10px;font-weight:600;color:${moat.color};margin-top:4px;">${moat.label}</div>
       </div>
       <div style="min-width:0;">
         <div style="font-size:9px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Fortalezas del foso</div>
         ${strong.map(d=>`<div style="font-size:10px;color:var(--sub);line-height:1.5;margin-bottom:2px;">🟢 <b style="color:${_dm()?'#e2e8f0':'#1a1814'};">${d.n}</b> <span style="color:${dc(d.s)};font-weight:700;">${d.s}</span> — ${d.why}</div>`).join('')}
         <div style="font-size:9px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.04em;margin:7px 0 3px;">Puntos más débiles</div>
         ${weak.map(d=>`<div style="font-size:10px;color:var(--sub);line-height:1.5;margin-bottom:2px;">${d.s>=55?'🟡':'🔴'} <b style="color:${_dm()?'#e2e8f0':'#1a1814'};">${d.n}</b> <span style="color:${dc(d.s)};font-weight:700;">${d.s}</span> — ${d.why}</div>`).join('')}
       </div>
     </div>
   </div>`;})()}
   ${blocks.map(b=>`<div class="card" style="margin-bottom:10px;">
     <div class="ctitle" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">${b.title}<span style="font-size:9px;font-weight:600;color:var(--muted);background:#f0ede8;padding:2px 7px;border-radius:8px;white-space:nowrap;">hoja ${b.sheet}</span></div>
     ${b.items.map(it=>{const m=stM[it.status];const cu=/Margen|ROIC|Tendencia/.test(it.label)?'%':/EPS|Beneficio/.test(it.label)?'$':'M';const clk=it.series?`data-cs="${it.series.map(v=>v==null?'':v).join(',')}" data-cu="${cu}" data-cl="${it.label}" data-color="${it.color||m.c}" onclick="openMetricChart(this)" style="cursor:pointer;`:`style="`;return`<div ${clk}display:grid;grid-template-columns:auto 1fr auto;gap:10px;padding:9px 0;border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};align-items:start;">
       <span style="font-size:17px;">${it.icon}</span>
       <div style="min-width:0;">
         <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
           <span style="font-size:12px;font-weight:600;color:${_dm()?'#e2e8f0':'#1a1814'};">${it.label}</span>
           <span style="font-size:12px;font-weight:600;color:${it.color||m.c};">${it.value}</span>
           <span style="font-size:9px;font-weight:700;background:${m.bg};color:${m.c};border:1px solid ${m.bd};padding:1px 7px;border-radius:8px;">${m.l}</span>
         </div>
         <div style="font-size:10px;color:var(--sub);margin-top:3px;line-height:1.5;"><b style="color:${_dm()?'#e2e8f0':'#1a1814'};">Qué es:</b> ${it.why}</div>
         <div style="font-size:10px;color:var(--muted);margin-top:2px;line-height:1.5;">👁 <b>Vigilar:</b> ${it.watch}${it.bench?` · <span style="color:#16a34a;font-weight:600;">Ref: ${it.bench}</span>`:''}</div>
       </div>
       <div style="text-align:right;min-width:42px;">${it.series?spark(it.series,it.color||m.c):''}${it.series?`<div style="font-size:7px;color:var(--muted);margin-top:2px;">${yr[yr.length-1]} · 🔍</div>`:''}</div>
     </div>`;}).join('')}
   </div>`).join('')}
   <div class="card"><div class="ctitle">Histórico completo ${co.years[0]}–${co.years[9]}</div>
   <div style="overflow-x:auto;"><table class="htbl"><thead><tr><th style="text-align:left;min-width:90px;">Métrica</th>${co.years.map(y=>`<th style="text-align:right;">${y}</th>`).join('')}</tr></thead><tbody>${[{l:"Ventas ("+curSymG()+"M)",d:co.sales,c:"#2563eb",f:v=>curSymG()+N(v)},{l:"EBITDA ("+curSymG()+"M)",d:co.ebitda,c:"#b45309",f:v=>curSymG()+N(v)},{l:"EBIT ("+curSymG()+"M)",d:co.ebit,c:"#d97706",f:v=>curSymG()+N(v)},{l:"FCF ("+curSymG()+"M)",d:co.fcf,c:"#16a34a",f:v=>curSymG()+N(v)},{l:"EPS ("+curSymG()+")",d:co.eps,c:"#d97706",f:v=>curSymG()+N(v,2)},{l:"FCF/Acc ("+curSymG()+")",d:co.fcfps,c:"#16a34a",f:v=>curSymG()+N(v,2)},{l:"Mg. EBITDA",d:co.ebitdaM,c:"#b45309",f:v=>P(v)},{l:"Mg. FCF",d:co.fcfM,c:"#16a34a",f:v=>P(v)},{l:"ROIC (%)",d:co.roic,c:"#b45309",f:v=>P(v)},{l:"Deuda Neta",d:co.netDebt,c:"#dc2626",f:v=>curSymG()+N(v)}].map(row=>`<tr style="border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};"><td style="color:${row.c};font-weight:700;padding:5px 8px;">${row.l}</td>${row.d.map((v,i)=>`<td style="text-align:right;padding:5px 8px;color:${i===row.d.length-1?row.c:'var(--sub)'};font-weight:${i===row.d.length-1?'700':'400'}">${row.f(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}

function rAlertas(){
  const vd=calcVerdict(),quality=calcFCFQuality(),rev=calcReverseDCF();
  const ms=vd.ms,sg=cagr(co.sales[9],co.sales[0],9),dd=co.netDebt[9]/co.ebitda[9];
  const als=[
    {t:co.roic[9]>=20?"pos":co.roic[9]>=15?"warn":"neg",icon:"🎯",txt:`ROIC ${P(co.roic[9])} — ${co.roic[9]>=20?"Excepcional, muy por encima del coste de capital":co.roic[9]>=15?"Bueno pero tendencia bajista":"Por debajo del umbral aceptable."}`},
    {t:sg>=15?"pos":sg>=8?"warn":"neg",icon:"📦",txt:`Crecimiento ventas CAGR 10Y: ${P(sg)} — ${sg>=20?"Excepcional.":sg>=10?"Muy sólido.":"Moderado."}`},
    {t:co.fcfM[9]>=15?"pos":co.fcfM[9]>=8?"warn":"neg",icon:"💧",txt:`Margen FCF ${P(co.fcfM[9])} — ${co.fcfM[9]>=20?"Muy eficiente.":co.fcfM[9]>=10?"Razonable.":"Bajo."}`},
    {t:dd<1?"pos":dd<2.5?"warn":"neg",icon:"🏦",txt:`Deuda/EBITDA: ${dd.toFixed(1)}x — ${dd<0?"Posición neta de caja.":dd<1?"Balance muy sólido.":dd<2.5?"Manejable.":"Apalancamiento elevado."}`},
    {t:ms>20?"pos":ms>-5?"warn":"neg",icon:"💰",txt:`Margen de seguridad (multi-eje): ${ms}% · Score ${vd.totalScore}/100 — ${ms>20?"Precio atractivo.":ms>-5?"Precio justo.":"Precio aparentemente caro."}`},
    {t:quality.ratio>=0.85?"pos":quality.ratio>=0.70?"warn":"neg",icon:"💎",txt:`Calidad FCF/NI 5Y avg: ${(quality.ratio*100).toFixed(0)}% — ${quality.label}. ${quality.why.substring(0,80)}…`},
    {t:rev.diff<2?"pos":rev.diff<10?"warn":"neg",icon:"🔄",txt:`Reverse DCF: implícito ${rev.impliedG}% vs histórico ${rev.historicalFCFCagr}% (${rev.diff>=0?'+':''}${rev.diff}pp). ${rev.label.substring(0,80)}`},
    {t:co.isD.cx[0]<3?"pos":co.isD.cx[0]<8?"warn":"neg",icon:"🔨",txt:`CapEx/Ventas: ${co.isD.cx[0]}% — ${co.isD.cx[0]<3?"Negocio ligero en activos.":co.isD.cx[0]<8?"Moderado.":"Capital intensivo."}`},
    {t:co.roic[9]>=co.roic[0]-5?"pos":"warn",icon:"📉",txt:`Tendencia ROIC: ${co.roic[0]}% (2016) → ${co.roic[9]}% (2025). ${co.roic[9]>=co.roic[0]?"Estable ✓":co.roic[9]>=co.roic[0]-10?"Bajista moderado.":"Caída significativa."}`},
  ];
  const pos=als.filter(a=>a.t==="pos").length,warn=als.filter(a=>a.t==="warn").length,neg=als.filter(a=>a.t==="neg").length;
  return`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:12px;font-weight:700;color:#16a34a;margin-bottom:3px;">Señales OK</div><div style="font-size:36px;font-weight:600;color:#16a34a">${pos}</div></div>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:12px;font-weight:700;color:#d97706;margin-bottom:3px;">Vigilar</div><div style="font-size:36px;font-weight:600;color:#d97706">${warn}</div></div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:3px;">Alertas</div><div style="font-size:36px;font-weight:600;color:#dc2626">${neg}</div></div>
  </div>
  <div class="card"><div class="ctitle">Análisis detallado — 9 criterios (incluye Reverse DCF y Calidad FCF)</div>
  ${als.map(a=>{const c=a.t==="pos"?"#16a34a":a.t==="neg"?"#dc2626":"#d97706",bg2=a.t==="pos"?"#f0fdf4":a.t==="neg"?"#fef2f2":"#fffbeb",bd2=a.t==="pos"?"#bbf7d0":a.t==="neg"?"#fecaca":"#fde68a";return`<div class="alrow" style="background:${bg2};border:1px solid ${bd2};"><span style="font-size:16px;flex-shrink:0;">${a.icon}</span><span style="flex:1;color:var(--sub)">${a.txt}</span><span class="albadge" style="background:${c}18;color:${c};">${a.t==="pos"?"✓ OK":a.t==="neg"?"⚠ Alerta":"→ Vigilar"}</span></div>`;}).join('')}
  </div>
  <div class="card"><div class="ctitle">Histórico completo ${co.years[0]}–${co.years[9]}</div>
  <div style="overflow-x:auto;"><table class="htbl"><thead><tr><th style="text-align:left;min-width:90px;">Métrica</th>${co.years.map(y=>`<th style="text-align:right;">${y}</th>`).join('')}</tr></thead><tbody>${[{l:"Ventas ("+curSymG()+"M)",d:co.sales,c:"#2563eb",f:v=>curSymG()+N(v)},{l:"EBITDA ("+curSymG()+"M)",d:co.ebitda,c:"#b45309",f:v=>curSymG()+N(v)},{l:"EBIT ("+curSymG()+"M)",d:co.ebit,c:"#d97706",f:v=>curSymG()+N(v)},{l:"FCF ("+curSymG()+"M)",d:co.fcf,c:"#16a34a",f:v=>curSymG()+N(v)},{l:"EPS ("+curSymG()+")",d:co.eps,c:"#d97706",f:v=>curSymG()+N(v,2)},{l:"FCF/Acc ("+curSymG()+")",d:co.fcfps,c:"#16a34a",f:v=>curSymG()+N(v,2)},{l:"Mg. EBITDA",d:co.ebitdaM,c:"#b45309",f:v=>P(v)},{l:"Mg. FCF",d:co.fcfM,c:"#16a34a",f:v=>P(v)},{l:"ROIC (%)",d:co.roic,c:"#b45309",f:v=>P(v)},{l:"Deuda Neta",d:co.netDebt,c:"#dc2626",f:v=>curSymG()+N(v)}].map(row=>`<tr style="border-bottom:1px solid ${_dm()?'#2a3a52':'#f0ede8'};"><td style="color:${row.c};font-weight:700;padding:5px 8px;">${row.l}</td>${row.d.map((v,i)=>`<td style="text-align:right;padding:5px 8px;color:${i===row.d.length-1?row.c:'var(--sub)'};font-weight:${i===row.d.length-1?'700':'400'}">${row.f(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
