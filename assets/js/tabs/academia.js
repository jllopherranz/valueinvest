// ─────────────────────────────────────────────────────────────
// Pestaña Academia
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// ACADEMIA
// ═══════════════════════════════════════════════════════════════════
function rAcademia(){
  const cards=Object.entries(TIPS).map(([id,t])=>`<div class="ac-card" onclick="toggleAcCard(this)">
    <div class="ac-head"><div class="ac-emoji">${t.emoji}</div>
    <div style="flex:1"><div class="ac-title">${t.title}</div><span class="ac-tag" style="background:${t.color}15;color:${t.color};">${t.tag}</span></div></div>
    <div class="ac-summary">${t.def}</div>
    <div class="ac-expand"><div class="ac-section"><div class="ac-section-title">Fórmula</div><div class="ac-formula" style="background:${t.color}0e;color:${t.color};">${t.formula}</div></div>
    <div class="ac-section"><div class="ac-section-title">Ejemplo en ${co.name}</div><div class="ac-example" style="background:${t.color}08;border-color:${t.color}40;">${typeof t.example==='function'?t.example(co):t.example}</div></div>
    ${t.bench?.length?`<div class="ac-section"><div class="ac-section-title">Benchmarks</div><div class="ac-bench">${t.bench.map(b=>`<span class="ac-bench-item" style="background:${b.bg};color:${b.c};">${b.v} = ${b.label}</span>`).join('')}</div></div>`:''}
    <div class="ac-section"><div class="ac-section-title">Referencia</div><div style="font-size:11px;color:var(--muted);font-style:italic;">${t.ref}</div></div>
    </div>
  </div>`).join('');
  return`<div class="card" style="background:#1e3a5f09;border-color:#1e3a5f30;margin-bottom:16px;">
    <div style="font-size:16px;font-weight:700;color:#1e3a5f;margin-bottom:4px;">📚 Academia Value Invest</div>
    <p style="font-size:13px;color:#5a5650;line-height:1.7;">Conceptos clave del análisis fundamental aplicados a <strong>${co.name}</strong>. Clic en cada card para expandir.</p>
  </div>
  <div class="ac-grid">${cards}</div>`;
}
function toggleAcCard(card){const exp=card.querySelector('.ac-expand');const open=exp.classList.contains('open');document.querySelectorAll('.ac-expand.open').forEach(e=>e.classList.remove('open'));if(!open)exp.classList.add('open');}
