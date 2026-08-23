// ─────────────────────────────────────────────────────────────
// Importar Excel del usuario, sincronizar con Drive y alta/baja de empresas
// ─────────────────────────────────────────────────────────────
// ── Drive URL ──
function promptDriveUrl(key){
  const imp=getImportedData(key);
  const cur=imp?.driveUrl||DASH_COMPANIES.find(c=>c.key===key)?.drive||localStorage.getItem('vi_drive_'+key)||'';
  const url=prompt('Link de Google Drive para '+key+'\n(puedes encontrarlo en "Compartir → Copiar enlace"):',cur);
  if(url===null) return;
  if(imp){imp.driveUrl=url.trim();localStorage.setItem('vi_import_'+key,JSON.stringify(imp));}
  else{localStorage.setItem('vi_drive_'+key,url.trim());}
  renderCartera();
}

// ── Import modal ──
function openImportModal(ticker){
  const modal=document.getElementById('import-modal');
  if(!modal) return;
  modal.classList.add('open');
  document.getElementById('import-progress').style.display='none';
  document.getElementById('import-error').style.display='none';
  document.getElementById('import-file-name').style.display='none';
  document.getElementById('import-do-btn').disabled=true;
  document.getElementById('import-do-btn').style.opacity='.5';
  _importedFile=null;
  if(ticker){
    document.getElementById('import-ticker-sel').value=ticker;
    const imp=getImportedData(ticker);
    const dc=DASH_COMPANIES.find(c=>c.key===ticker);
    document.getElementById('import-drive-url').value=imp?.driveUrl||dc?.drive||localStorage.getItem('vi_drive_'+ticker)||'';
  }
  toggleNuevaFields();
  const dz=document.getElementById('import-drop-zone');
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('dragover');};
  dz.ondragleave=()=>dz.classList.remove('dragover');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('dragover');handleImportFile(e.dataTransfer.files[0]);};
}

function closeImportModal(){
  const m=document.getElementById('import-modal');
  if(m) m.classList.remove('open');
}

function toggleNuevaFields(){
  const sel=document.getElementById('import-ticker-sel');
  const fields=document.getElementById('import-nueva-fields');
  if(sel&&fields) fields.style.display=sel.value==='NUEVA'?'block':'none';
}
// Rellena el desplegable de empresas desde el catálogo (ordenado por nombre) — así aparecen
// por nombre (Broadcom, etc.) y no hay que escribirlas a mano.
function populateImportCatalog(){
  const sel=document.getElementById('import-ticker-sel'); if(!sel) return;
  const cur=sel.value;
  const entries=Object.entries(CATALOG).sort((a,b)=>a[1].name.localeCompare(b[1].name,'es'));
  sel.innerHTML='<option value="">— Selecciona empresa —</option>'+
    entries.map(([t,c])=>`<option value="${t}">${t} · ${c.name}</option>`).join('')+
    '<option value="NUEVA">＋ Nueva empresa (no listada)…</option>';
  if(cur) sel.value=cur;
}
document.getElementById('import-ticker-sel')?.addEventListener('change',toggleNuevaFields);

function handleImportFile(file){
  if(!file||!file.name.match(/\.xlsx?$/i)){
    showImportError('Formato no válido. Usa un archivo .xlsx');return;
  }
  _importedFile=file;
  const n=document.getElementById('import-file-name');
  n.textContent='📄 '+file.name;n.style.display='block';
  document.getElementById('import-error').style.display='none';
  document.getElementById('import-do-btn').disabled=false;
  document.getElementById('import-do-btn').style.opacity='1';
}

function showImportError(msg){
  document.getElementById('import-error-msg').textContent=msg;
  document.getElementById('import-error').style.display='block';
  document.getElementById('import-progress').style.display='none';
}

function showImportProgress(msg){
  document.getElementById('import-progress-msg').textContent=msg;
  document.getElementById('import-progress').style.display='block';
  document.getElementById('import-error').style.display='none';
}

async function doImport(){
  if(!_importedFile) return showImportError('Selecciona un archivo .xlsx primero.');
  let ticker=document.getElementById('import-ticker-sel').value;
  if(!ticker) return showImportError('Selecciona la empresa.');
  let name,sector,color,domain;
  if(ticker==='NUEVA'){
    ticker=(document.getElementById('import-nueva-ticker').value||'').trim().toUpperCase();
    name=document.getElementById('import-nueva-name').value.trim();
    sector=document.getElementById('import-nueva-sector').value.trim();
    color=document.getElementById('import-nueva-color').value.trim();
    if(!ticker||!name) return showImportError('Introduce el ticker y nombre de la empresa.');
    const dm=(document.getElementById('import-nueva-domain')?.value||'').trim().toLowerCase()
      .replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
    if(dm) setDomainFor(ticker,dm);
    domain=dm||(CATALOG[ticker]&&CATALOG[ticker].domain)||(companyProfile(ticker)&&companyProfile(ticker).domain)||'';
    if(!domain) fetchCompanyProfile(ticker,true);   // sin web: se busca la ficha pública
  } else {
    const d=DB[ticker], cat=CATALOG[ticker];
    name=d?.name||cat?.name||ticker; sector=d?.sector||cat?.sector||''; color=d?.color||cat?.color||'#1e3a5f';
    domain=(cat&&cat.domain)||LOGO_DOMAINS[ticker]||'';
  }
  const driveUrl=document.getElementById('import-drive-url').value.trim();
  showImportProgress('Leyendo archivo Excel…');
  try{
    await ensureXLSX();
    const buf=await _importedFile.arrayBuffer();
    const result=parseExcelData(buf,ticker,name,sector,color,driveUrl);
    if(!result) return showImportError('No se pudo leer la plantilla. Verifica que es la Plantilla Valoración IDC.');
    if(domain) result.domain=domain;  // para el logo
    localStorage.setItem('vi_import_'+ticker,JSON.stringify(result));
    localStorage.removeItem('vi_mults_'+ticker); // una importación nueva manda sobre ediciones previas
    if(DB[ticker]){
      const d=DB[ticker];
      if(result.years) d.years=result.years;
      if(result.pY) d.pY=result.pY;
      if(result.pS) d.pS=result.pS;
      if(result.pEB) d.pEB=result.pEB;
      if(result.pF) d.pF=result.pF;
      if(result.pEPS) d.pEPS=result.pEPS;
      if(result.pND) d.pND=result.pND;
      if(result.shares) d.shares=result.shares;
      if(result.price) d.price=result.price;
      if(result.sales?.length) d.sales=result.sales;
      if(result.ebitda?.length) d.ebitda=result.ebitda;
      if(result.ebitdaM?.length) d.ebitdaM=result.ebitdaM;
      if(result.ebit?.length) d.ebit=result.ebit;
      if(result.netIncome?.length) d.netIncome=result.netIncome;
      if(result.eps?.length) d.eps=result.eps;
      if(result.fcf?.length) d.fcf=result.fcf;
      if(result.fcfM?.length) d.fcfM=result.fcfM;
      if(result.fcfps?.length) d.fcfps=result.fcfps;
      if(result.roic?.length) d.roic=result.roic;
      if(result.netDebt?.length) d.netDebt=result.netDebt;
      if(result.medEvFcf) d.medEvFcf=result.medEvFcf;
      if(result.medPER) d.medPER=result.medPER;
      if(result.medEvEbitda) d.medEvEbitda=result.medEvEbitda;
      if(result.medEvEbit) d.medEvEbit=result.medEvEbit;
      if(result.hEvF?.some(v=>v!=null)) d.hEvF=result.hEvF;
      if(result.hPER?.some(v=>v!=null)) d.hPER=result.hPER;
      if(result.hEvEbitda?.some(v=>v!=null)) d.hEvEbitda=result.hEvEbitda;
      if(result.hEvEbit?.some(v=>v!=null)) d.hEvEbit=result.hEvEbit;
      // NO recalculamos: usamos las medianas de TU hoja (columna Q) leídas por parseExcelData
    } else {
      // Empresa NUEVA: crear entrada DB completa con las medianas de tu hoja
      DB[ticker]=buildDbEntryFromImport(result);
      rebuildCoButtons();
    }
    showImportProgress('✅ '+name+' importado. Proyecciones '+result.pY.join(', ')+'.');
    setTimeout(()=>{closeImportModal();renderCartera();},1800);
  }catch(e){
    console.error(e);
    showImportError('Error al procesar: '+e.message);
  }
}

// ── Core Excel parser (Plantilla IDC) ──
function parseExcelData(arrayBuffer,ticker,name,sector,color,driveUrl){
  if(typeof XLSX==='undefined') throw new Error('SheetJS no cargado.');
  const wb=XLSX.read(new Uint8Array(arrayBuffer),{type:'array'});
  const gs=n=>wb.Sheets[n]?XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null,raw:true}):null;
  const is=gs('1.IS'),fcfS=gs('2.FCF'),roicS=gs('3.ROIC'),valS=gs('4.Valoracion');
  if(!is||!valS) throw new Error('Hojas "1.IS" y "4.Valoracion" no encontradas.');

  const findRow=(data,label,from=0)=>{
    if(!data) return null;
    const lc=label.toLowerCase();
    for(let i=from;i<data.length;i++){
      const c=data[i]?.[0];
      if(c&&String(c).trim().toLowerCase().includes(lc)) return data[i];
    }
    return null;
  };
  const nums=(row,start,n)=>row?Array.from({length:n},(_,i)=>{const v=row[start+i];return typeof v==='number'?v:null;}):Array(n).fill(null);
  const pct=arr=>arr.map(v=>v!=null?+(v*100).toFixed(2):null);

  // Años REALES leídos de la cabecera de 1.IS (cada empresa puede ir desfasada: NVIDIA reporta
  // hasta 2026 y proyecta 2027e-2031e; el resto hasta 2025 + 2026e-2030e). Antes estaban hardcodeados.
  const _parseYr=v=>{const m=String(v==null?'':v).match(/(\d{4})/);return m?+m[1]:null;};
  const _yrHdr=(is.find(r=>r&&Number(r[1])>=2000&&Number(r[1])<2100))||[];
  let _years=_yrHdr.slice(1,11).map(_parseYr);
  let _pY=_yrHdr.slice(11,16).map(_parseYr);
  if(_years.length<10||_years.some(y=>!y)) _years=[2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];
  if(_pY.length<5||_pY.some(y=>!y)) _pY=[2026,2027,2028,2029,2030];

  // 1.IS
  const salesRow=findRow(is,'Sales');
  const ebitdaRow=findRow(is,'EBITDA');
  const ebitdaMRow=findRow(is,'EBITDA margin');
  let ebitRow=null;
  for(let i=0;i<is.length;i++){const c=is[i]?.[0];if(c&&/^EBIT\s*$/i.test(String(c).trim())){ebitRow=is[i];break;}}
  if(!ebitRow) ebitRow=findRow(is,'EBIT ');
  const ebitMRow=findRow(is,'EBIT margin');
  const niRow=findRow(is,'Net Income');
  // OJO: la cabecera "(millones, excepto EPS)" también contiene "EPS"; buscamos la fila que EMPIEZA por EPS
  let epsRow=null;
  for(let i=0;i<is.length;i++){const c=is[i]?.[0];if(c&&/^EPS\b/i.test(String(c).trim())){epsRow=is[i];break;}}
  if(!epsRow) epsRow=findRow(is,'EPS',2);
  const sharesRow=findRow(is,'Fully diluted shares');

  const sales=nums(salesRow,1,10), pS=nums(salesRow,11,5);
  const ebitda=nums(ebitdaRow,1,10), pEB=nums(ebitdaRow,11,5);
  const ebitdaM=pct(nums(ebitdaMRow,1,10));
  const ebit=nums(ebitRow,1,10);
  const ebitM=pct(nums(ebitMRow,1,10));
  const netIncome=nums(niRow,1,10);
  const eps=nums(epsRow,1,10), pEPS=nums(epsRow,11,5);
  const sharesArr=nums(sharesRow,1,10);
  const shares=sharesArr.filter(v=>v!=null).pop()||null;
  const pShares=nums(sharesRow,11,5); // acciones diluidas proyectadas (2026e-2030e), como en la hoja

  // 2.FCF
  const fcfRow=findRow(fcfS,'Free Cash Flow');
  const fcfMRow=findRow(fcfS,'FCF Margin');
  const fcfpsRow=findRow(fcfS,'Free Cash Flow per share');
  const fcf=nums(fcfRow,1,10), pF=nums(fcfRow,11,5);
  const fcfM=pct(nums(fcfMRow,1,10));
  const fcfps=nums(fcfpsRow,1,10);

  // 3.ROIC
  const roicRow=findRow(roicS,'ROIC');
  const roic=pct(nums(roicRow,1,10));

  // 4.Valoracion
  const ndRow=findRow(valS,'Deuda Neta')||findRow(valS,'Net Debt');
  const netDebt=nums(ndRow,1,10), pND=nums(ndRow,11,5);

  const priceRow=findRow(valS,'Precio por acción actual')||findRow(valS,'Precio actual');
  const price=typeof priceRow?.[1]==='number'?priceRow[1]:null;

  // Median multiples (col index 16 = column Q)
  const medFrom=(row,col=16)=>typeof row?.[col]==='number'?+row[col].toFixed(2):null;
  // OJO: "EV / EBITDA" CONTIENE "EV / EBIT" → findRow normal confunde EV/EBIT con EV/EBITDA.
  // Buscador específico de EV/EBIT (contiene ebit pero NO ebitda).
  const findEvEbit=(data,from=0)=>{ if(!data) return null; for(let i=from;i<data.length;i++){ const c=data[i]?.[0]; if(c){const t=String(c).toLowerCase(); if(t.includes('ebit')&&!t.includes('ebitda')&&t.includes('ev')) return data[i];}} return null; };
  const hPerRow=findRow(valS,'PER');
  const hEvfRow=findRow(valS,'EV / FCF');
  const hEveRow=findRow(valS,'EV / EBITDA');
  const hEveiRow=findEvEbit(valS);
  const medPER=medFrom(hPerRow);
  const medEvFcf=medFrom(hEvfRow);
  const medEvEbitda=medFrom(hEveRow);
  const medEvEbit=medFrom(hEveiRow);
  // Series históricas de múltiplos (cols 1-10) → para gráficos y medianas reales (como la hoja)
  const hPER=nums(hPerRow,1,10), hEvF=nums(hEvfRow,1,10), hEvEbitda=nums(hEveRow,1,10), hEvEbit=nums(hEveiRow,1,10);

  // Target multiples (section after "Objetivo" label)
  let tSecIdx=-1;
  for(let i=0;i<valS.length;i++){
    if(valS[i]?.[1]==='Objetivo'){tSecIdx=i;break;}
    if(valS[i]?.[0]&&String(valS[i][0]).includes('Objetivo')){tSecIdx=i;break;}
  }
  let tPER=null,tEVF=null,tEVEB=null,tEVEI=null;
  if(tSecIdx>=0){
    const r1=findRow(valS,'PER',tSecIdx+1);
    const r2=findRow(valS,'EV / FCF',tSecIdx+1);
    const r3=findRow(valS,'EV / EBITDA',tSecIdx+1);
    const r4=findEvEbit(valS,tSecIdx+1);
    tPER=typeof r1?.[1]==='number'?r1[1]:null;
    tEVF=typeof r2?.[1]==='number'?r2[1]:null;
    tEVEB=typeof r3?.[1]==='number'?r3[1]:null;
    tEVEI=typeof r4?.[1]==='number'?r4[1]:null;
  }

  // Target prices & MoS (section after "Precio objetivo")
  let pSecIdx=-1;
  for(let i=0;i<valS.length;i++){
    if(valS[i]?.[0]&&String(valS[i][0]).toLowerCase().includes('precio objetivo')){pSecIdx=i;break;}
  }
  let tPricesPER=[],tPricesEVF=[],tPricesEVEB=[],tPricesEVEI=[],tPricesAvg=[],moS=[],upside=[];
  if(pSecIdx>=0){
    const rPER=findRow(valS,'PER ex Cash',pSecIdx);
    const rEVF=findRow(valS,'EV / FCF ',pSecIdx)||findRow(valS,'EV / FCF',pSecIdx+2);
    const rEVEB=findRow(valS,'EV / EBITDA',pSecIdx+1);
    const rEVEI=findEvEbit(valS,pSecIdx+1);
    const rAvg=findRow(valS,'Promedio',pSecIdx);
    const rMoS=findRow(valS,'Margen de seguridad');
    const rUp=findRow(valS,'Potencial de revalorización');
    tPricesPER=nums(rPER,1,5);
    tPricesEVF=nums(rEVF,1,5);
    tPricesEVEB=nums(rEVEB,1,5);
    tPricesEVEI=nums(rEVEI,1,5);
    tPricesAvg=nums(rAvg,1,5);
    moS=pct(nums(rMoS,1,5));
    upside=pct(nums(rUp,1,5));
  }

  return{
    ticker,name,sector:sector||'',color:color||'#1e3a5f',driveUrl:driveUrl||'',
    importDate:new Date().toISOString(),
    price,shares,
    years:_years,
    sales,ebitda,ebitdaM,ebit,ebitM,netIncome,eps,fcf,fcfM,fcfps,roic,netDebt,
    pY:_pY,pS,pEB,pF,pEPS,pND,pShares,
    medPER,medEvFcf,medEvEbitda,medEvEbit,
    hPER,hEvF,hEvEbitda,hEvEbit,
    targetMultiples:{per:tPER,evf:tEVF,eveb:tEVEB,evei:tEVEI},
    targetPrices:{per:tPricesPER,evf:tPricesEVF,eveb:tPricesEVEB,evei:tPricesEVEI,avg:tPricesAvg},
    mos:moS,upside
  };
}

function deleteImport(ticker){
  if(!confirm('¿Eliminar datos importados de '+ticker+'? Se usarán los datos de la DB.')){return;}
  localStorage.removeItem('vi_import_'+ticker);
  renderCartera();
}

// ═══════════════════════════════════════════════════════════════════
// AÑADIR / ELIMINAR EMPRESAS (persistente en el navegador)
// ═══════════════════════════════════════════════════════════════════
// Construye una entrada DB completa a partir del resultado de parseExcelData.
function buildDbEntryFromImport(r){
  const last=a=>{const v=(a||[]).filter(x=>x!=null);return v.length?v[v.length-1]:null;};
  const pS=r.pS||[]; let prev=last(r.sales)||pS[0]||0;
  const sg=[]; for(let i=0;i<5;i++){const s=pS[i];sg.push((prev&&s!=null)?+(((s/prev)-1)*100).toFixed(1):10);if(s!=null)prev=s;}
  const ebitM9=last(r.ebitM)??20, ebitdaM9=last(r.ebitdaM)??(ebitM9*1.2);
  const isD={sg,em:Array(5).fill(+(+ebitM9).toFixed(1)),tr:Array(5).fill(21),di:Array(5).fill(0),cx:Array(5).fill(3),wc:Array(5).fill(0)};
  // Enriquecer con el catálogo (color corporativo, dominio del logo, símbolo TradingView) por ticker/alias
  const _cat=catalogFor(r.ticker);
  const _color=(r.color&&r.color!=='#1e3a5f')?r.color:((_cat&&_cat.color)||r.color||'#1e3a5f');
  const _tv=r.tvSymbol||tvSymbolFor(r.ticker,r.ticker);
  const entry={
    name:r.name||r.ticker,ticker:r.ticker,finnhubTicker:r.ticker,sector:r.sector||(_cat&&_cat.sector)||'',
    ...(( _cat&&_cat.domain)?{domain:_cat.domain}:{}),...( _tv?{tvSymbol:_tv}:{}),
    shares:r.shares||1,price:r.price||0,equity:0,color:_color,
    wacc:10,sectorAvgEbitdaM:Math.round(ebitdaM9)||25,sectorAvgFcfM:Math.round(last(r.fcfM)||20),sectorAvgROIC:Math.round(last(r.roic)||15),
    earningsDate:'',earningsLabel:'Resultados',driveUrl:r.driveUrl||'',
    desc:r.desc||((r.name||r.ticker)+' — empresa importada desde tu Plantilla de Valoración.'),
    years:r.years||[2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],
    sales:r.sales||[],ebitda:r.ebitda||[],ebit:r.ebit||[],netIncome:r.netIncome||[],
    fcf:r.fcf||[],eps:r.eps||[],fcfps:r.fcfps||[],roic:r.roic||[],
    ebitdaM:r.ebitdaM||[],ebitM:r.ebitM||[],fcfM:r.fcfM||[],netDebt:r.netDebt||[],
    pY:r.pY||[2026,2027,2028,2029,2030],pS:r.pS||[],pEB:r.pEB||[],pF:r.pF||[],pEPS:r.pEPS||[],pND:r.pND||[],
    medEvFcf:r.medEvFcf||20,medPER:r.medPER||20,medEvEbitda:r.medEvEbitda||15,medEvEbit:r.medEvEbit||18,
    hEvF:r.hEvF||[],hPER:r.hPER||[],hEvEbitda:r.hEvEbitda||[],hEvEbit:r.hEvEbit||[],
    estimated:!!(r.estimated||r.autoSource==='finnhub'),
    isD
  };
  _estimateProjections(entry);   // rellena proyecciones a 5 años por márgenes si faltan (empresas auto, sin Excel)
  return entry;
}
// Estima proyecciones a 5 años manteniendo los márgenes actuales (para empresas añadidas SIN Excel).
// No sustituye datos de tu hoja: solo rellena lo que está vacío. Marca la empresa como 'estimated'.
function _estimateProjections(c){
  if(!c||!c.pS||!c.pS.length) return;
  const need=!(c.pF&&c.pF.length)||!(c.pEB&&c.pEB.length)||!(c.pEPS&&c.pEPS.length);
  if(!need) return;
  const lm=a=>{const v=(a||[]).filter(x=>x!=null&&!isNaN(x));return v.length?v[v.length-1]:null;};
  const ebM=lm(c.ebitdaM)??20, fM=lm(c.fcfM)??12, salesCur=lm(c.sales)||c.pS[0];
  let epsBase=lm(c.eps);
  if(epsBase==null){const ni=lm(c.netIncome),sh=c.shares||1;if(ni!=null&&sh>0)epsBase=ni/sh;}
  const nd=lm(c.netDebt)??0;
  if(!(c.pEB&&c.pEB.length))  c.pEB =c.pS.map(s=>Math.round(s*ebM/100));
  if(!(c.pF&&c.pF.length))    c.pF  =c.pS.map(s=>Math.round(s*fM/100));
  if(!(c.pEPS&&c.pEPS.length))c.pEPS=c.pS.map(s=>(epsBase!=null&&salesCur>0)?+((epsBase*s/salesCur).toFixed(2)):null);
  if(!(c.pND&&c.pND.length))  c.pND =c.pS.map(()=>nd);
  c.estimated=true;
}

// Recupera empresas añadidas por el usuario (guardadas en localStorage) y las mete en DB al cargar.
function hydrateImportedIntoDB(){
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!k.startsWith('vi_import_')) continue;
    const ticker=k.replace('vi_import_','');
    if(DB[ticker]) continue; // de fábrica o ya presente
    const data=getImportedData(ticker);
    if(!data||!data.ticker) continue;
    try{ DB[ticker]=buildDbEntryFromImport(data); }catch(e){ console.warn('No se pudo recuperar',ticker,e); }
  }
}

// Reconstruye los botones de empresa de la vista de análisis.
function rebuildCoButtons(){
  const btns=document.getElementById('co-btns');
  if(!btns) return;
  btns.innerHTML='';
  Object.keys(DB).forEach(k=>{
    const b=document.createElement('button');
    b.className='co-btn';b.dataset.k=k;b.textContent=k;
    b.onclick=()=>switchCo(k);
    if(co&&DB[k]===co){b.classList.add('active');b.style.background=co.color;b.style.borderColor=co.color;b.style.color='#fff';}
    btns.appendChild(b);
  });
}

function saveHidden(){try{localStorage.setItem('vi_hidden',JSON.stringify([...HIDDEN]));}catch(e){}}
function _refreshRestoreBtn(){const b=document.getElementById('btn-restore-hidden');if(b)b.style.display=HIDDEN.size?'inline-block':'none';}

// Elimina una empresa de la cartera. De fábrica → se oculta (restaurable). Añadida por el usuario → se borra.
function deleteCompanyFull(key){
  const nm=(DB[key]&&DB[key].name)||key;
  const builtin=BUILTIN_KEYS.has(key);
  const msg=builtin
    ? '¿Ocultar "'+nm+'" de tu cartera?\n\nPodrás restaurarla con el botón «Restaurar ocultas».'
    : '¿Eliminar "'+nm+'" de tu cartera?\n\nSe borrarán sus datos de este navegador (tu Google Sheet no se toca).';
  if(!confirm(msg)) return;
  const wasActive=co&&DB[key]===co;
  localStorage.removeItem('vi_import_'+key);
  localStorage.removeItem('vi_drive_'+key);
  localStorage.removeItem('vi_mults_'+key);
  localStorage.removeItem('vi_yf_'+key);      // bolsa de referencia elegida
  localStorage.removeItem('vi_cur_'+key);     // divisa detectada
  localStorage.removeItem('vi_profile_'+key); // ficha pública (logo, sector, web)
  localStorage.removeItem('vi_domain_'+key);  // web del logo puesta a mano
  delete DB[key];
  if(builtin){HIDDEN.add(key);saveHidden();}
  rebuildCoButtons();renderCartera();_refreshRestoreBtn();
  if(wasActive){const first=Object.keys(DB)[0];if(first)switchCo(first);}
}

// Restaura todas las empresas de fábrica ocultadas.
function restoreHidden(){
  if(!HIDDEN.size) return;
  HIDDEN.forEach(k=>{ if(!DB[k]&&_BUILTIN_DB[k]) DB[k]=_BUILTIN_DB[k]; });
  HIDDEN.clear();saveHidden();
  Object.values(DB).forEach(computeMediansFor);
  rebuildCoButtons();renderCartera();_refreshRestoreBtn();
}

// Importa una empresa directamente desde el enlace de Google Sheets (descarga el .xlsx y lo procesa).
async function importFromLink(){
  const url=(document.getElementById('import-drive-url').value||'').trim();
  const m=url.match(/\/spreadsheets\/d\/([^/]+)/);
  if(!m) return showImportError('Pega un enlace válido de Google Sheets (…/spreadsheets/d/ID/…).');
  const exportUrl='https://docs.google.com/spreadsheets/d/'+m[1]+'/export?format=xlsx';
  showImportProgress('Descargando la hoja desde Google Sheets…');
  let buf=null;
  try{
    const r=await fetch(exportUrl,{signal:AbortSignal.timeout(15000)});
    if(!r.ok) throw new Error('HTTP '+r.status);
    buf=await r.arrayBuffer();
  }catch(e){
    try{
      showImportProgress('Reintentando vía proxy…');
      const r2=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(exportUrl),{signal:AbortSignal.timeout(20000)});
      if(!r2.ok) throw new Error('HTTP '+r2.status);
      buf=await r2.arrayBuffer();
    }catch(e2){
      return showImportError('No se pudo descargar la hoja. Asegúrate de que está compartida como «Cualquiera con el enlace» o descarga el .xlsx y súbelo abajo.');
    }
  }
  _importedFile=new Blob([buf]); // Blob soporta .arrayBuffer()
  const btn=document.getElementById('import-do-btn');
  if(btn){btn.disabled=false;btn.style.opacity='1';}
  const n=document.getElementById('import-file-name');
  if(n){n.textContent='🔗 Hoja descargada desde el enlace';n.style.display='block';}
  showImportProgress('✅ Hoja descargada. Pulsa «Importar datos» para procesarla.');
}

// Aplica un resultado de parseExcelData a DB (patch financiero si existe, o entrada nueva)
function _applyImportToDB(key,res){
  if(DB[key]){
    const d=DB[key];
    ['years','pY','pS','pEB','pF','pEPS','pND','pShares','shares','price','sales','ebitda','ebitdaM','ebit','ebitM','netIncome','eps','fcf','fcfM','fcfps','roic','netDebt','medEvFcf','medPER','medEvEbitda','medEvEbit','hEvF','hPER','hEvEbitda','hEvEbit'].forEach(f=>{
      const v=res[f];
      if(v==null) return;
      if(Array.isArray(v)&&!v.some(x=>x!=null)) return;
      d[f]=v;
    });
  } else {
    DB[key]=buildDbEntryFromImport(res);
  }
}

// Resuelve el enlace de hoja de una empresa (importada, builtin con Drive guardado, o de fábrica)
function _sheetUrlFor(key){
  const imp=getImportedData(key);
  return (imp&&imp.driveUrl)||localStorage.getItem('vi_drive_'+key)||DASH_COMPANIES.find(c=>c.key===key)?.drive||'';
}
async function _fetchSheetBuf(id){
  try{const r=await fetch('https://docs.google.com/spreadsheets/d/'+id+'/export?format=xlsx',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw 0;return await r.arrayBuffer();}
  catch(e){const r2=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent('https://docs.google.com/spreadsheets/d/'+id+'/export?format=xlsx'),{signal:AbortSignal.timeout(22000)});return await r2.arrayBuffer();}
}
// Sincroniza TODAS las empresas con enlace de hoja (importadas o de fábrica): re-descarga, re-parsea
// y actualiza TODOS los datos — históricos, proyecciones, estimaciones, medianas y múltiplos objetivo.
async function refreshAllImports(){
  const seen=new Set(), keys=[];
  getAllPortfolioCompanies().forEach(c=>{ if(!seen.has(c.key)&&/\/d\//.test(_sheetUrlFor(c.key))){seen.add(c.key);keys.push(c.key);} });
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('vi_import_')){const key=k.replace('vi_import_','');if(!seen.has(key)){seen.add(key);keys.push(key);}}}
  if(!keys.length){alert('No hay empresas con enlace de hoja. Añade el enlace de Google Sheets con ＋📊 o importa con 📂.');return;}
  const btn=document.getElementById('btn-refresh-imports');
  const origTxt=btn?btn.textContent:'';
  if(btn) btn.disabled=true;
  const activeKey=coKeyOf(co);
  let ok=0; const fail=[];
  for(const key of keys){
    const url=_sheetUrlFor(key);
    const id=(url.match(/\/d\/([^/]+)/)||[])[1];
    if(!id){fail.push(key+' (sin enlace)');continue;}
    if(btn) btn.textContent='🔄 '+key+'…';
    try{
      const imp=getImportedData(key);
      await ensureXLSX();
      const buf=await _fetchSheetBuf(id);
      const res=parseExcelData(buf,key,imp?.name||DB[key]?.name||key,imp?.sector||DB[key]?.sector||'',imp?.color||DB[key]?.color||'#1e3a5f',url);
      if(!res) throw new Error('plantilla no válida');
      localStorage.setItem('vi_import_'+key,JSON.stringify(res)); // datos + proyecciones + múltiplos/precios objetivo
      localStorage.removeItem('vi_mults_'+key);                    // la hoja manda sobre ediciones previas
      _applyImportToDB(key,res);
      ok++;
    }catch(e){fail.push(key);}
    await new Promise(r=>setTimeout(r,300));
  }
  // Refrescar la empresa abierta con sus datos nuevos
  if(activeKey){ _isEdited=false; applyCompanyMults(co); resetIS(); }
  rebuildCoButtons(); renderCartera();
  if(typeof curTab!=='undefined' && document.getElementById('cnt')) showTab(curTab);
  if(btn){ btn.textContent=origTxt; btn.disabled=false; }
  alert('✅ Sincronizadas '+ok+' empresa(s) con su hoja (datos, proyecciones, estimaciones y múltiplos objetivo).'+(fail.length?'\n⚠ No se pudieron actualizar: '+fail.join(', ')+'\n(revisa que tengan enlace y sean públicas)':''));
}
