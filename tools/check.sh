#!/usr/bin/env bash
# Verificación rápida antes de publicar. Uso:  bash tools/check.sh
set -uo pipefail
cd "$(dirname "$0")/.."
fallos=0

echo "▸ Sintaxis de cada módulo (node --check)"
while IFS= read -r f; do
  if ! salida=$(node --check "$f" 2>&1); then
    echo "  ✗ $f"; echo "$salida" | head -4 | sed 's/^/      /'; fallos=$((fallos+1))
  fi
done < <(find assets/js -name '*.js' | sort)
echo "  $(find assets/js -name '*.js' | wc -l | tr -d ' ') ficheros revisados"

echo "▸ index.html carga exactamente los módulos de tools/modules.txt, en orden"
grep -vE '^\s*(#|$)' tools/modules.txt > /tmp/vi_mods.txt
grep -oE '<script defer src="assets/js/[A-Za-z0-9/_.-]+\.js"' index.html | sed -E 's|.*assets/js/||; s|"$||' > /tmp/vi_html.txt
if diff -u /tmp/vi_mods.txt /tmp/vi_html.txt > /tmp/vi_diff.txt; then
  echo "  ✓ $(wc -l < /tmp/vi_mods.txt | tr -d ' ') módulos en el orden correcto"
else
  echo "  ✗ index.html y tools/modules.txt no coinciden:"; sed 's/^/    /' /tmp/vi_diff.txt; fallos=$((fallos+1))
fi

echo "▸ Ningún módulo declara dos veces el mismo símbolo global"
dup=$(grep -hoE '^(const|let|var|function|async function|class) +[A-Za-z_$][A-Za-z0-9_$]*' $(find assets/js -name '*.js') \
      | awk '{print $NF}' | sort | uniq -d)
if [ -z "$dup" ]; then echo "  ✓ sin colisiones"; else echo "  ✗ símbolos repetidos (romperían el ámbito global):"; echo "$dup" | sed 's/^/    /'; fallos=$((fallos+1)); fi

echo "▸ El CSS no lleva plantillas de JS (\${...})"
if grep -n '\${' assets/css/app.css; then echo "  ✗ hay interpolación JS dentro del CSS"; fallos=$((fallos+1)); else echo "  ✓ limpio"; fi

echo
if [ "$fallos" -eq 0 ]; then echo "✅ Todo correcto. Ya puedes probar en el navegador y publicar."; else echo "❌ $fallos comprobación(es) fallida(s)."; exit 1; fi
