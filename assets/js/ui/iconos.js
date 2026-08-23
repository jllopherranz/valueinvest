// ─────────────────────────────────────────────────────────────
// Iconos SVG en línea y logos de empresa
// ─────────────────────────────────────────────────────────────
// ── LOGOS ──
const LOGOS={
  CSU: {src:'https://logo.clearbit.com/csisoftware.com',   fb:'https://www.google.com/s2/favicons?domain=csisoftware.com&sz=64'},
  ASML:{src:'https://logo.clearbit.com/asml.com',          fb:'https://www.google.com/s2/favicons?domain=asml.com&sz=64'},
  AMZN:{src:'https://logo.clearbit.com/amazon.com',        fb:'https://www.google.com/s2/favicons?domain=amazon.com&sz=64'},
  MSFT:{src:'https://logo.clearbit.com/microsoft.com',     fb:'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64'},
  AAPL:{src:'https://logo.clearbit.com/apple.com',         fb:'https://www.google.com/s2/favicons?domain=apple.com&sz=64'},
  GOOGL:{src:'https://logo.clearbit.com/google.com',       fb:'https://www.google.com/s2/favicons?domain=google.com&sz=64'},
  META:{src:'https://logo.clearbit.com/meta.com',          fb:'https://www.google.com/s2/favicons?domain=meta.com&sz=64'},
  NVDA:{src:'https://logo.clearbit.com/nvidia.com',        fb:'https://www.google.com/s2/favicons?domain=nvidia.com&sz=64'},
  WDC: {src:'https://logo.clearbit.com/westerndigital.com', fb:'https://www.google.com/s2/favicons?domain=westerndigital.com&sz=64'},
};
// ── Iconos de línea SVG (estilo Lucide) — sustituyen a los emojis ──
const _ICONS={
  briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.7 3.7M6.6 6.6A17.5 17.5 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4.5-1.1"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  barchart:'<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="7"/><rect x="12" y="7" width="3" height="11"/><rect x="17" y="4" width="3" height="14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  dollar:'<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  cpu:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  folder:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4M12 2v13"/>',
  pin:'<path d="M12 17v5M9 10.8V4h6v6.8l2 3.2H7l2-3.2Z"/>',
  alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
};
function svgIcon(name,cls){return `<svg class="ic${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true">${_ICONS[name]||''}</svg>`;}
function getLogoKey(c){return Object.keys(DB).find(k=>DB[k]===c)||'';}
function setLogo(co){
  const el=document.getElementById('co-logo'),wrap=document.getElementById('co-logo-wrap');
  if(!el) return;
  const k=getLogoKey(co);
  const src=(typeof logoUrlFor==='function'?logoUrlFor(k):null)||(LOGOS[k]&&LOGOS[k].src);
  const fb=(typeof logoFallback==='function'?logoFallback(k):'')||(LOGOS[k]&&LOGOS[k].fb)||'';
  if(!src&&!fb){_logoInitials(co,el,wrap);return;}
  el.onerror=function(){el.onerror=function(){_logoInitials(co,el,wrap);};el.src=fb;};
  el.src=src||fb;el.style.display='block';
  if(wrap) wrap.style.display=(_curView==='analysis')?'flex':'none';
}
function _logoInitials(co,el,wrap){
  const initials=co.ticker.replace('.TO','').replace('.AS','').substring(0,2);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${co.color||'#1e3a5f'}"/><text x="16" y="21" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="12" font-weight="800" fill="white">${initials}</text></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  el.onerror=null;el.src=url;el.style.display='block';
  if(wrap) wrap.style.display=(_curView==='analysis')?'flex':'none';
}
