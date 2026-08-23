// ─────────────────────────────────────────────────────────────
// Carga bajo demanda de las librerías externas (Chart.js, SheetJS)
// ─────────────────────────────────────────────────────────────
// Antes se descargaban SIEMPRE en el <head> (~640 KB) aunque el usuario
// se quedara en el Dashboard. Ahora sólo se piden cuando de verdad hacen
// falta: Chart.js al pintar el primer gráfico, XLSX al importar un Excel.
// Cada librería se descarga una sola vez (la promesa queda cacheada).

const _CDN={
  chart:'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  xlsx :'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
};
const _cdnPromesas={};

function _cargarScript(url){
  if(_cdnPromesas[url]) return _cdnPromesas[url];
  _cdnPromesas[url]=new Promise((ok,ko)=>{
    const s=document.createElement('script');
    s.src=url; s.async=true;
    s.onload=()=>ok();
    s.onerror=()=>{
      // Se olvida el fallo a los 10 s: así un corte de red no deja la librería
      // inutilizable para siempre, pero tampoco se reintenta en bucle.
      setTimeout(()=>{ delete _cdnPromesas[url]; },10000);
      ko(new Error('No se pudo cargar '+url));
    };
    document.head.appendChild(s);
  });
  return _cdnPromesas[url];
}

// Garantiza que window.Chart existe. Devuelve una promesa.
function ensureChart(){
  if(typeof Chart!=='undefined') return Promise.resolve();
  return _cargarScript(_CDN.chart).catch(e=>{console.warn('[cdn]',e.message);});
}

// Garantiza que window.XLSX existe. Devuelve una promesa.
function ensureXLSX(){
  if(typeof XLSX!=='undefined') return Promise.resolve();
  return _cargarScript(_CDN.xlsx);
}

// Precarga en segundo plano, sin bloquear: se llama cuando el usuario
// entra en Análisis (ahí casi seguro va a ver un gráfico).
function precargarChart(){ if(typeof Chart==='undefined') _cargarScript(_CDN.chart).catch(()=>{}); }
