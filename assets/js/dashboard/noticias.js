// ─────────────────────────────────────────────────────────────
// Noticias Finnhub: relevancia, impacto, deduplicado y traducción
// ─────────────────────────────────────────────────────────────
// ── Noticias dashboard via Finnhub ──
let _dashAllNews=[];
// Alias por compañía: el titular debe mencionar a la empresa para considerarse "directo"
const NEWS_ALIASES={
  MSFT:['microsoft','azure','copilot','nadella','xbox','windows 11','windows'],
  CSU:['constellation software','mark leonard','topicus','lumine'],
  AMZN:['amazon','aws','bezos','andy jassy','prime video','amazon web services'],
  META:['meta platforms','meta','facebook','instagram','whatsapp','zuckerberg','reality labs','threads','oculus'],
  NVDA:['nvidia','jensen huang','geforce','blackwell','cuda'],
  ASML:['asml','euv lithography','lithography machine'],
  AAPL:['apple','iphone','ipad','macbook','tim cook','vision pro','app store','ios 18','ios 19'],
  GOOGL:['google','alphabet','gemini','youtube','waymo','sundar pichai','deepmind'],
  WDC:['western digital','sandisk','wdc'],
};
// Recopilatorios de mercado / listas → NO son noticia directa de la compañía
const NEWS_BLOCK=/(stocks? to (watch|buy|sell)|best stocks|top \d+ stocks|stocks? that|market wrap|premarket|pre-market|after hours|movers|trending tickers|dow jones|s&p 500|nasdaq (today|closes|futures)|futures (rise|fall|mixed|edge)|jim cramer|analyst (ratings|roundup)|things to know|here'?s what|magnificent seven|7 stocks|cup of joe|stock market today)/i;
function newsAliasesFor(co){
  if(NEWS_ALIASES[co.key]) return NEWS_ALIASES[co.key];
  // empresa importada sin alias fijo: usa palabras del nombre (>3 letras) + ticker
  const words=(co.name||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3&&!['corp','inc','company','group','plc','ltd','the'].includes(w));
  return [...new Set([...words,(co.ticker||co.key).toLowerCase()])];
}

// ══════════ INTELIGENCIA DE NOTICIAS (relevancia · impacto · dedup) ══════════
const _na=s=>' '+(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' '; // alias/texto normalizado

// Prioridad de fuentes (1 = mejor). Al deduplicar se conserva la de menor número.
function newsSourceRank(n){
  const s=((n.source||'')+' '+(n.url||'')).toLowerCase();
  if(/prnewswire|businesswire|business wire|globenewswire|globe ?newswire|press ?release|investor ?relations|\/ir\.|ir\.[a-z]/.test(s)) return 1; // comunicado oficial
  if(/\bsec\b|sec\.gov|edgar|\.gov\b|federal reserve|antitrust division/.test(s)) return 2;               // SEC / oficiales
  if(/reuters/.test(s)) return 3;
  if(/bloomberg/.test(s)) return 4;
  if(/cnbc/.test(s)) return 5;
  if(/wall street journal|wsj/.test(s)) return 6;
  if(/financial times|\bft\.com\b/.test(s)) return 7;
  if(/yahoo/.test(s)) return 8;
  if(/investing\.com|investing/.test(s)) return 9;
  return 15; // resto de medios
}

// Eventos de alto valor → suben la relevancia (peso en titular; la mitad si solo está en el resumen)
const NEWS_EVENTS=[
  {re:/\b(q[1-4]\b|quarter|quarterly|earnings|results|eps|revenue|beat|beats|misses?|topped|profit)\b/i,w:30},
  {re:/\b(guidance|forecast|outlook|raises?|lifts?|cuts? (its )?(guidance|forecast|outlook)|lowered)\b/i,w:28},
  {re:/\b(acqui|merger|takeover|to buy|buys|acquires?|deal to buy|stake in)\b/i,w:30},
  {re:/\b(dividend)\b/i,w:22},
  {re:/\b(buyback|repurchase|share ?repurchase)\b/i,w:22},
  {re:/\b(ceo|cfo|coo|chief executive|chairman|steps down|resigns?|resignation|appoints?|names? .{0,20}(ceo|cfo)|successor)\b/i,w:24},
  {re:/\b(contract|order worth|awarded|partnership|supply deal|multi-?year|billion.{0,12}(deal|contract|order))\b/i,w:20},
  {re:/\b(lawsuit|sues?|sued|litigation|antitrust|monopoly|fine|penalty|settlement|probe|investigat|subpoena)\b/i,w:22},
  {re:/\b(launch|unveil|unveils?|announces?|debut|new .{0,15}(chip|gpu|product|model|service|iphone|phone))\b/i,w:16},
  {re:/\b(regulat|approval|approved|ban|banned|sanction|tariff|export control|license)\b/i,w:18},
  {re:/\b(upgrade|downgrade|price target|initiat(es|ed) coverage|raised to|cut to|overweight|underweight)\b/i,w:14},
];
// Léxico de impacto sobre la EMPRESA (no predice la acción)
const NEWS_POS=/\b(beat|beats|beaten|surge|surges|soar|soars|jump|jumps|rally|rallies|record (revenue|profit|quarter|sales)|raises? (guidance|forecast|outlook|dividend)|hikes? dividend|dividend (increase|hike|boost)|upgrade|upgraded|outperform|overweight|strong (demand|results|growth|quarter)|wins?|won|awarded|secures?|expands?|expansion|approval|approved|buyback|repurchase|tops? (estimates|expectations)|better.than.expected|accelerat)\b/i;
const NEWS_NEG=/\b(miss|misses|missed|fall|falls|plunge|plunges|drop|drops|slump|slumps|tumble|tumbles|sink|sinks|cuts? (guidance|forecast|outlook|dividend)|slash|lawsuit|sued|sues?|probe|investigat|antitrust|monopoly|fine|penalty|recall|downgrade|downgraded|underperform|underweight|weak (demand|results|guidance)|layoffs?|job cuts|warns?|warning|delays?|halts?|ban|banned|sanction|loss|losses|bankrupt|slows?|slowdown|worse.than.expected|disappoint)\b/i;

function newsImpact(n){
  const t=(n.headline||'')+' . '+(n.summary||'');
  const pos=NEWS_POS.test(t),neg=NEWS_NEG.test(t);
  if(pos&&!neg) return 'pos';
  if(neg&&!pos) return 'neg';
  return 'neu'; // mixto, informativo o sin confianza → amarillo
}

// Puntúa la relevancia real de la noticia para ESTA empresa
function scoreNews(n,own,others){
  const head=n.headline||'',sum=n.summary||'';
  const H=_na(head),full=H+_na(sum);
  let score=0;
  const ownN=own.map(_na).map(s=>s.trim());
  const inTitle=ownN.some(a=>H.includes(' '+a+' '));
  if(inTitle) score+=40;                                   // en el título = máxima prioridad
  let mentions=0; ownN.forEach(a=>{if(a) mentions+=full.split(' '+a+' ').length-1;});
  if(mentions===0) return -999;                            // ni se nombra → descartar
  score+=Math.min(mentions,4)*6;
  if(!inTitle&&mentions<=2) score-=22;                     // solo citada de pasada
  const otherHits=others.map(_na).map(s=>s.trim()).filter(a=>a&&full.includes(' '+a+' ')).length;
  score-=otherHits*15;                                     // aparece dentro de una lista
  if(otherHits>mentions) return -999;                      // el tema principal es otra empresa
  if(NEWS_BLOCK.test(head)) score-=40;                     // recopilatorio / mercado general
  const rel=(n.related||'').split(',').filter(Boolean).length;
  if(rel>=4) score-=12;                                    // etiquetada con muchos tickers → lista
  NEWS_EVENTS.forEach(ev=>{ if(ev.re.test(head)) score+=ev.w; else if(ev.re.test(sum)) score+=ev.w*0.5; });
  // Bonus de frescura: buscamos lo DESTACADO de las últimas semanas, pero algo importante
  // de hoy o de ayer no puede quedarse fuera por competir con noticias ya asentadas.
  const hrs=n.datetime?(Date.now()-n.datetime*1000)/3600000:1e9;
  if(hrs<=24) score+=10; else if(hrs<=48) score+=5;
  return score;
}

// Firma de tokens para detectar el MISMO evento aunque cambie el título
const _NEWS_STOP=new Set(['the','a','an','to','of','in','on','for','and','or','as','is','are','its','it','with','at','by','from','that','this','will','has','have','be','was','were','after','over','amid','into','than','but','not']);
function newsTokens(n){
  const t=((n.headline||'')+' '+(n.summary||'')).toLowerCase().replace(/[^a-z0-9 ]/g,' ');
  return new Set(t.split(/\s+/).filter(w=>w.length>2&&!_NEWS_STOP.has(w)));
}
// Coeficiente de solapamiento (intersección / conjunto menor): detecta el mismo hecho aunque cambie la redacción
function newsSim(a,b){
  const m=Math.min(a.size,b.size); if(!m) return 0;
  let i=0; a.forEach(w=>{if(b.has(w))i++;});
  const ov=i/m;
  if(m<5) return ov>=0.8?ov:0;   // textos muy cortos: exige coincidencia casi total para no unir por azar
  return ov;
}
// Traduce titulares al español (Google gtx, por lotes, con caché en localStorage)
async function _translateNews(heads){
  let cache={}; try{cache=JSON.parse(localStorage.getItem('vi_news_es')||'{}');}catch(e){}
  const need=[...new Set(heads.filter(h=>h&&!cache[h]))];
  for(let i=0;i<need.length;i+=8){
    const chunk=need.slice(i,i+8);
    try{
      const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q='+encodeURIComponent(chunk.join('\n'));
      const r=await fetch(url,{signal:AbortSignal.timeout(9000)});
      if(r.ok){
        const j=await r.json();
        const parts=j[0].map(x=>x[0]).join('').split('\n').map(x=>x.trim()).filter(x=>x.length);
        if(parts.length===chunk.length) chunk.forEach((t,n)=>cache[t]=parts[n]);
      }
    }catch(e){}
  }
  try{localStorage.setItem('vi_news_es',JSON.stringify(cache));}catch(e){}
  const map={}; heads.forEach(h=>map[h]=cache[h]||h);
  return map;
}

const MIN_NEWS_SCORE=12;      // umbral: por debajo se considera ruido y se descarta
let _dashNewsTs=0;            // marca de tiempo de la última descarga (para refresco)
async function fetchDashNews(){
  const newsEl=document.getElementById('dash-news-list');
  if(!newsEl) return;
  newsEl.innerHTML='<div style="grid-column:1/-1;padding:16px;text-align:center;color:var(--muted);font-size:11px;">Analizando y filtrando noticias...</div>';
  const k=getFinnhubKey();
  let cos=getAllPortfolioCompanies();
  // Filtro «solo mis invertidas»: cuando tienes muchas empresas, el ruido se dispara
  if(newsSoloInvertidas()){
    const inv=cos.filter(c=>{const p=getPositionFor(c.key);return p&&p.buyPrice>0;});
    if(inv.length) cos=inv;
  }
  _paintNewsFilter();
  const to=new Date().toISOString().slice(0,10);
  const from=new Date(Date.now()-21*864e5).toISOString().slice(0,10); // ventana ~3 semanas: buscamos lo DESTACADO, no lo último
  const aliasByKey={}; cos.forEach(c=>aliasByKey[c.key]=newsAliasesFor(c));
  // 1) Descarga + puntuación de relevancia por empresa
  const results=await Promise.allSettled(cos.map(async co=>{
    const sym=fhInfoSymbolFor(co.key);
    const own=newsAliasesFor(co);
    const others=cos.filter(c=>c.key!==co.key).flatMap(c=>aliasByKey[c.key]);
    try{
      const r=await fetch('https://finnhub.io/api/v1/company-news?symbol='+encodeURIComponent(sym)+'&from='+from+'&to='+to+'&token='+k,{signal:AbortSignal.timeout(9000)});
      if(!r.ok) return null;
      const j=await r.json();
      if(!Array.isArray(j)||!j.length) return null;
      const scored=[];
      for(const n of j){
        if((n.headline||'').length<14) continue;
        const score=scoreNews(n,own,others);
        if(score<MIN_NEWS_SCORE) continue;               // solo lo que trata REALMENTE de la empresa
        scored.push({co,n,score,rank:newsSourceRank(n),impact:newsImpact(n),tok:newsTokens(n)});
      }
      return scored.length?scored:null;
    }catch(e){return null;}
  }));
  // 2) Deduplicado por CONTEXTO (mismo evento aunque cambie el título) → conserva la fuente de más valor
  const all=results.flatMap(r=>r.status==='fulfilled'&&r.value?r.value:[]);
  // orden: primero mejor fuente, luego más relevante, luego más reciente → el ganador de cada duplicado se ve primero
  all.sort((a,b)=>a.rank-b.rank||b.score-a.score||(b.n.datetime||0)-(a.n.datetime||0));
  const kept=[];
  for(const c of all){
    const dup=kept.find(x=>newsSim(x.tok,c.tok)>=0.5);
    if(dup){ dup.score=Math.max(dup.score,c.score); continue; }  // ya tenemos la mejor versión de este hecho
    kept.push(c);
  }
  // 3) Agrupar por empresa · ordenar por RELEVANCIA y luego fecha · máx. 6
  const byKey={};
  kept.forEach(c=>{ (byKey[c.co.key]=byKey[c.co.key]||{co:c.co,items:[]}).items.push(c); });
  const FRESH_H=36;                                        // "reciente" = últimas 36 horas
  const _hrs=c=>c.n.datetime?(Date.now()-c.n.datetime*1000)/3600000:1e9;
  let groups=Object.values(byKey).map(g=>{
    g.items.sort((a,b)=>b.score-a.score||(b.n.datetime||0)-(a.n.datetime||0));
    const top=g.items.slice(0,6);
    // Garantiza que la mejor noticia RECIENTE aparezca aunque no entre por puntuación:
    // así no se pierde nada importante de última hora dentro de la ventana de 3 semanas.
    const fresh=g.items.filter(c=>_hrs(c)<=FRESH_H);
    if(fresh.length&&!top.includes(fresh[0])){ if(top.length>=6) top.pop(); top.unshift(fresh[0]); }
    top.forEach(c=>{c.fresh=_hrs(c)<=FRESH_H;});
    g.fresh=top.filter(c=>c.fresh).length;
    g.items=top;
    return g;
  });
  // Empresas ordenadas ALFABÉTICAMENTE (siempre en el mismo sitio, fácil de encontrar)
  groups.sort((a,b)=>(a.co.name||a.co.key).localeCompare(b.co.name||b.co.key,'es'));
  if(!groups.length){
    newsEl.innerHTML='<div style="grid-column:1/-1;font-size:11px;color:var(--muted);text-align:center;padding:14px;">No hay noticias relevantes ahora (revisa tu API key Finnhub) - pulsa Actualizar.</div>';
    return;
  }
  _dashNewsTs=Date.now();
  const allHeads=[]; groups.forEach(g=>g.items.forEach(c=>allHeads.push(c.n.headline)));
  const tr=await _translateNews(allHeads);
  const DOT={pos:'news-dot-pos',neu:'news-dot-neu',neg:'news-dot-neg'};
  const DOTTIP={pos:'Impacto esperado: positivo para la empresa',neu:'Impacto esperado: neutro / incierto',neg:'Impacto esperado: negativo para la empresa'};
  newsEl.innerHTML=groups.map(g=>{
    const logo=logoUrlFor(g.co.key);
    const open=newsCoAbierta(g.co.key);
    return '<div class="news-co'+(open?'':' collapsed')+'" id="newsco-'+g.co.key+'">'
      +'<div class="news-co-head" onclick="toggleNewsCo(\''+g.co.key+'\')" title="Pulsa para ver u ocultar sus titulares">'
      +'<span class="news-co-caret">'+(open?'▾':'▸')+'</span>'
      +(logo?'<img src="'+logo+'" class="news-co-logo" loading="lazy" onerror="this.style.display=\'none\'"/>':'')
      +'<span class="news-co-name">'+g.co.name+'</span>'
      +(g.fresh?'<span class="news-fresh" title="'+g.fresh+' titular(es) de las últimas 36 h">NUEVO</span>':'')
      +'<span class="news-co-tk">'+g.co.ticker+'</span>'
      +'<span class="news-co-count">'+g.items.length+'</span>'
      +'</div>'
      +'<div class="news-co-items">'
      +g.items.map(c=>{const n=c.n;return '<a href="'+(n.url||'#')+'" target="_blank" rel="noopener" class="news-co-item">'
        +'<span class="news-co-title"><span class="news-dot '+DOT[c.impact]+'" title="'+DOTTIP[c.impact]+'"></span>'+(tr[n.headline]||n.headline)+'</span>'
        +'<span class="news-co-meta">'+(c.fresh?'<b style="color:var(--red);">● </b>':'')+_newsAge(new Date((n.datetime||0)*1000))+' · '+(n.source||'')+'</span></a>';}).join('')
      +'</div>'
      +'</div>';
  }).join('');
}

// ── Filtro de noticias: todas las empresas o solo las que tengo en cartera ──
function newsSoloInvertidas(){try{return localStorage.getItem('vi_news_inv')==='1';}catch(e){return false;}}
function toggleNewsInvertidas(){
  try{localStorage.setItem('vi_news_inv',newsSoloInvertidas()?'0':'1');}catch(e){}
  fetchDashNews();
}
function _paintNewsFilter(){
  const el=document.getElementById('news-filter'); if(!el) return;
  const on=newsSoloInvertidas();
  el.innerHTML=`<button class="cart-chip${on?' on':''}" onclick="toggleNewsInvertidas()" title="Muestra solo las noticias de las empresas en las que tienes posición">Solo mis invertidas</button>`;
}

// ── Plegado de noticias por empresa (recuerda tu elección) ──
// Por defecto TODAS plegadas: ves la lista de empresas y abres solo las que te interesan.
function newsCoAbierta(key){
  try{return (JSON.parse(localStorage.getItem('vi_news_open')||'[]')).includes(key);}catch(e){return false;}
}
function toggleNewsCo(key){
  let open=[]; try{open=JSON.parse(localStorage.getItem('vi_news_open')||'[]');}catch(e){}
  const i=open.indexOf(key);
  if(i>=0) open.splice(i,1); else open.push(key);
  try{localStorage.setItem('vi_news_open',JSON.stringify(open));}catch(e){}
  const el=document.getElementById('newsco-'+key);
  if(el){
    const now=i<0;
    el.classList.toggle('collapsed',!now);
    const c=el.querySelector('.news-co-caret'); if(c) c.textContent=now?'▾':'▸';
  }
}

function _newsAge(date){
  const s=Math.floor((new Date()-date)/1000);
  if(s<60) return 'hace '+s+'s';
  if(s<3600) return 'hace '+Math.floor(s/60)+'min';
  if(s<86400) return 'hace '+Math.floor(s/3600)+'h';
  return 'hace '+Math.floor(s/86400)+'d';
}
