// ─────────────────────────────────────────────────────────────
// Cuentas anuales SEC vía Finnhub y construcción automática de una empresa
// ─────────────────────────────────────────────────────────────
// ── Fase 2b: PROMOVER del seguimiento al análisis profundo (cuentas anuales Finnhub/SEC) ──
const _GAAP={
  revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet','RevenueFromContractWithCustomer'],
  ebit:['OperatingIncomeLoss'],
  netIncome:['NetIncomeLoss','ProfitLoss'],
  epsD:['EarningsPerShareDiluted'],
  epsB:['EarningsPerShareBasic','EarningsPerShareBasicAndDiluted'],
  da:['DepreciationDepletionAndAmortization','DepreciationAmortizationAndAccretionNet','DepreciationAndAmortization'],
  cfo:['NetCashProvidedByUsedInOperatingActivities','NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
  capex:['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets','PaymentsForCapitalImprovements'],
  ltDebt:['LongTermDebtNoncurrent','LongTermDebt'],
  curDebt:['LongTermDebtCurrent','DebtCurrent','ShortTermBorrowings'],
  cash:['CashAndCashEquivalentsAtCarryingValue','CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
  shares:['CommonStockSharesOutstanding','WeightedAverageNumberOfDilutedSharesOutstanding','WeightedAverageNumberOfSharesOutstandingBasic'],
  equity:['StockholdersEquity','StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest']
};
function _conceptVal(section,aliases){
  if(!Array.isArray(section)) return null;
  for(const al of aliases){
    const hit=section.find(c=>c.concept&&c.concept.replace(/^us-gaap_/,'')===al);
    if(hit&&hit.value!=null&&!isNaN(hit.value)) return +hit.value;
  }
  for(const al of aliases){
    const hit=section.find(c=>c.concept&&c.concept.toLowerCase().includes(al.toLowerCase()));
    if(hit&&hit.value!=null&&!isNaN(hit.value)) return +hit.value;
  }
  return null;
}
async function fetchAnnualFinancials(ticker){
  const key=getFinnhubKey(); if(!key) return null;
  try{
    const r=await fetch(`https://finnhub.io/api/v1/stock/financials-reported?symbol=${encodeURIComponent(ticker)}&freq=annual&token=${key}`,{signal:AbortSignal.timeout(12000)});
    const d=await r.json();
    return (d&&Array.isArray(d.data))?d.data:null;
  }catch(e){return null;}
}
function buildImportFromFinancials(rows,e){
  const annual=rows.filter(x=>/10-K|20-F|40-F/.test(x.form||'')).slice(0,10).reverse();
  if(annual.length<3) return null;
  const M=1e6, last=a=>a[a.length-1];
  const years=[],sales=[],ebit=[],ebitda=[],netIncome=[],fcf=[],eps=[],fcfps=[],roic=[],ebitdaM=[],ebitM=[],fcfM=[],netDebt=[],sharesArr=[];
  for(const yr of annual){
    const ic=yr.report&&yr.report.ic, bs=yr.report&&yr.report.bs, cf=yr.report&&yr.report.cf;
    const rev=_conceptVal(ic,_GAAP.revenue); if(rev==null) continue;
    const op=_conceptVal(ic,_GAAP.ebit), ni=_conceptVal(ic,_GAAP.netIncome);
    const da=_conceptVal(cf,_GAAP.da)||0, cfo=_conceptVal(cf,_GAAP.cfo), capex=_conceptVal(cf,_GAAP.capex)||0;
    const ltd=_conceptVal(bs,_GAAP.ltDebt)||0, cud=_conceptVal(bs,_GAAP.curDebt)||0, cash=_conceptVal(bs,_GAAP.cash)||0, eq=_conceptVal(bs,_GAAP.equity)||0;
    const epsv=_conceptVal(ic,_GAAP.epsD)??_conceptVal(ic,_GAAP.epsB);
    let sh=_conceptVal(bs,_GAAP.shares)||_conceptVal(ic,_GAAP.shares);
    if((!sh||sh<1e6)&&ni&&epsv) sh=ni/epsv;
    const e_op=op!=null?op:(ni!=null?ni:0), e_ebitda=e_op+da, e_fcf=(cfo!=null?cfo:0)-Math.abs(capex), nd=(ltd+cud)-cash;
    const shM=sh?+(sh/M).toFixed(1):null;
    years.push(yr.year);
    sales.push(+(rev/M).toFixed(0)); ebit.push(+(e_op/M).toFixed(0)); ebitda.push(+(e_ebitda/M).toFixed(0));
    netIncome.push(ni!=null?+(ni/M).toFixed(0):null); fcf.push(+(e_fcf/M).toFixed(0)); netDebt.push(+(nd/M).toFixed(0));
    sharesArr.push(shM);
    eps.push(epsv!=null?+(+epsv).toFixed(2):(ni&&shM?+((ni/M)/shM).toFixed(2):null));
    fcfps.push(shM?+((e_fcf/M)/shM).toFixed(2):null);
    ebitdaM.push(rev?+((e_ebitda/rev)*100).toFixed(1):null);
    ebitM.push(rev?+((e_op/rev)*100).toFixed(1):null);
    fcfM.push(rev?+((e_fcf/rev)*100).toFixed(1):null);
    const inv=eq+ltd+cud; let ro=(inv>0)?(e_op*0.79)/inv*100:null;
    if(ro!=null&&(ro>120||ro<-60)) ro=null; roic.push(ro!=null?+ro.toFixed(1):null);
  }
  if(sales.length<3) return null;
  const n=sales.length;
  let g=(sales[0]>0)?(Math.pow(last(sales)/sales[0],1/Math.max(1,n-1))-1)*100:10; g=Math.max(3,Math.min(25,g));
  const pY=[],pS=[]; let base=last(sales);
  for(let i=0;i<5;i++){base=base*(1+g/100);pY.push((last(years)||2025)+i+1);pS.push(Math.round(base));}
  const m=(e&&e.metrics)?e.metrics:{};
  const clamp=(v,lo,hi,def)=>(v==null||isNaN(v)||v<=0)?def:Math.max(lo,Math.min(hi,v));
  // El motor de análisis asume 10 años (lee índice [9]); rellenar por delante sin nulos
  const pad10=(arr,fill)=>{const a=arr.map(v=>(v==null||isNaN(v))?fill:v);if(a.length>=10)return a.slice(a.length-10);return Array(10-a.length).fill(a.length?a[0]:fill).concat(a);};
  const padY=ys=>{if(ys.length>=10)return ys.slice(ys.length-10);const f=ys[0]||2025;const h=[];for(let i=10-ys.length;i>0;i--)h.push(f-i);return h.concat(ys);};
  const r0=a=>(a.find(v=>v!=null&&!isNaN(v))||0);
  const _cat=catalogFor(e.id);
  return {
    ticker:e.id, name:e.name||(e.profile&&e.profile.name)||e.id,
    sector:e.sector||(_cat&&_cat.sector)||(e.profile&&e.profile.finnhubIndustry)||'', color:(_cat&&_cat.color)||'#1e3a5f',
    ...(((_cat&&_cat.domain)||_hostOf(e.profile&&e.profile.weburl))?{domain:(_cat&&_cat.domain)||_hostOf(e.profile.weburl)}:{}),...(tvSymbolFor(e.id,e.id)?{tvSymbol:tvSymbolFor(e.id,e.id)}:{}),
    shares:last(sharesArr)||1, price:(_priceCache[e.id]&&_priceCache[e.id].live)||0,
    driveUrl:'', desc:(e.name||e.id)+' — datos automáticos (Finnhub/SEC). Refina importando tu hoja TIKR.',
    importDate:Date.now(), autoSource:'finnhub', estimated:true, yearsAvailable:n,
    years:padY(years),sales:pad10(sales,0),ebit:pad10(ebit,0),ebitda:pad10(ebitda,0),netIncome:pad10(netIncome,0),
    fcf:pad10(fcf,0),eps:pad10(eps,0),fcfps:pad10(fcfps,0),roic:pad10(roic,r0(roic)),
    ebitdaM:pad10(ebitdaM,r0(ebitdaM)),ebitM:pad10(ebitM,r0(ebitM)),fcfM:pad10(fcfM,r0(fcfM)),netDebt:pad10(netDebt,0),
    pY,pS,pEB:[],pF:[],pEPS:[],pND:[],
    medPER:clamp(m.peTTM,5,50,20), medEvEbitda:clamp(m.evEbitdaTTM,5,40,15),
    medEvFcf:clamp(m.evEbitdaTTM?m.evEbitdaTTM*1.2:null,5,55,22), medEvEbit:clamp(m.evEbitdaTTM?m.evEbitdaTTM*1.1:null,5,45,18),
    hEvF:[],hPER:[],hEvEbitda:[],hEvEbit:[]
  };
}
