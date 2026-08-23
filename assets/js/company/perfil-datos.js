// ─────────────────────────────────────────────────────────────
// Perfil de empresa (Finnhub): sector, industria, dominio y logo
// ─────────────────────────────────────────────────────────────
// Cotización de REFERENCIA de cada empresa (símbolo de Yahoo). Determina el precio Y la divisa.
// REGLA: debe cotizar en la MISMA moneda en la que están sus cuentas, porque el valor intrínseco
// se calcula con las cuentas y se compara con el precio; mezclarlas falsea el margen de seguridad.
//   · ASML lleva sus cuentas en euros (guidance €30-35B) → ASML.AS, Ámsterdam, EUR.
//   · Constellation Software publica en DÓLARES (ventas ~$11,6B) aunque cotice en Toronto en CAD
//     → CNSWF, su línea estadounidense en USD. Con CSU.TO el precio saldría un ~35% desviado
//     respecto a unos objetivos calculados en dólares.
// Se puede cambiar por empresa desde la cartera (pulsando su divisa) → 'vi_yf_<KEY>'.
const YF_TICKER={CSU:'CNSWF',ASML:'ASML.AS',AMZN:'AMZN',MSFT:'MSFT',AAPL:'AAPL',GOOGL:'GOOGL',META:'META',NVDA:'NVDA',WDC:'WDC'};

// ══════════════════════════════════════════════════════════════════
// PERFIL PÚBLICO DE LA EMPRESA (Finnhub) — logo, web, sector, bolsa, país
// ══════════════════════════════════════════════════════════════════
// El catálogo interno solo cubre unas pocas empresas; cualquier otra que añadas
// (Dell, por ejemplo) se quedaba sin logo, sin sector y sin contexto. Esto lo
// resuelve de forma general: se pide la ficha pública a Finnhub y se guarda.
function companyProfile(key){
  try{const p=JSON.parse(localStorage.getItem('vi_profile_'+key)||'null');return (p&&p.name)?p:null;}catch(e){return null;}
}
function _hostOf(url){
  try{return new URL(String(url)).hostname.replace(/^www\./,'').toLowerCase();}catch(e){return null;}
}
// Finnhub devuelve la industria en inglés: se muestra en español
const _IND_ES={'Technology':'Tecnología','Semiconductors':'Semiconductores','Software':'Software',
 'Communications':'Comunicaciones','Media':'Medios','Retail':'Distribución / Retail','Consumer products':'Consumo',
 'Health Care':'Salud','Biotechnology':'Biotecnología','Pharmaceuticals':'Farmacéuticas','Financial Services':'Servicios financieros',
 'Banking':'Banca','Insurance':'Seguros','Real Estate':'Inmobiliario','Energy':'Energía','Utilities':'Utilities',
 'Industrial Conglomerates':'Conglomerado industrial','Machinery':'Maquinaria','Transportation':'Transporte',
 'Aerospace & Defense':'Aeroespacial y defensa','Automobiles':'Automoción','Telecommunication':'Telecomunicaciones',
 'Food, Beverages & Tobacco':'Alimentación y bebidas','Hotels, Restaurants & Leisure':'Hostelería y ocio',
 'Textiles, Apparel & Luxury Goods':'Textil y lujo','Chemicals':'Química','Metals & Mining':'Metales y minería',
 'Building':'Construcción','Logistics & Transportation':'Logística y transporte','Electrical Equipment':'Equipos eléctricos'};
function industriaES(v){return v?(_IND_ES[v]||v):'';}
// Sector de una empresa: el suyo, el de su ficha pública o el del catálogo
function sectorOf(key){
  const d=DB[key]||{}, pr=companyProfile(key), cat=(typeof catalogFor==='function')?catalogFor(key):null;
  return d.sector||industriaES(pr&&pr.industry)||(cat&&cat.sector)||'';
}
function saveCompanyProfile(key,p){try{localStorage.setItem('vi_profile_'+key,JSON.stringify(p));}catch(e){}}
const _profileInFlight={};
async function fetchCompanyProfile(key,force){
  if(!force){ const c=companyProfile(key); if(c&&Date.now()-(c.ts||0)<30*864e5) return c; }
  if(_profileInFlight[key]) return _profileInFlight[key];
  const k=(typeof getFinnhubKey==='function')?getFinnhubKey():null;
  if(!k) return companyProfile(key);
  const sym=(typeof fhInfoSymbolFor==='function')?fhInfoSymbolFor(key):key;
  _profileInFlight[key]=(async()=>{
    try{
      const r=await fetch('https://finnhub.io/api/v1/stock/profile2?symbol='+encodeURIComponent(sym)+'&token='+k,{signal:AbortSignal.timeout(9000)});
      if(!r.ok) return companyProfile(key);
      const j=await r.json();
      if(!j||!j.name) return companyProfile(key);
      const prof={name:j.name,logo:j.logo||null,web:j.weburl||null,domain:_hostOf(j.weburl),
        industry:j.finnhubIndustry||null,country:j.country||null,exchange:j.exchange||null,
        ipo:j.ipo||null,cur:j.currency||null,mcap:j.marketCapitalization||null,
        shares:j.shareOutstanding||null,ts:Date.now()};
      saveCompanyProfile(key,prof);
      return prof;
    }catch(e){ return companyProfile(key); }
    finally{ delete _profileInFlight[key]; }
  })();
  return _profileInFlight[key];
}
// Trae las fichas que falten de toda la cartera (una vez; quedan en caché)
async function ensureProfiles(){
  const cos=(typeof getAllPortfolioCompanies==='function')?getAllPortfolioCompanies():[];
  const faltan=cos.filter(c=>!companyProfile(c.key));
  if(!faltan.length) return false;
  for(const c of faltan){ await fetchCompanyProfile(c.key); await new Promise(r=>setTimeout(r,220)); }
  return true;
}
// Dominio del logo: lo que hayas puesto a mano > ficha de Finnhub > catálogo interno
function domainOverride(key){try{return localStorage.getItem('vi_domain_'+key)||null;}catch(e){return null;}}
function setDomainFor(key,dom){
  try{ if(dom) localStorage.setItem('vi_domain_'+key,dom); else localStorage.removeItem('vi_domain_'+key); }catch(e){}
}
