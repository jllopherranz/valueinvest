# ValueInvest JLH

Plataforma de análisis de inversión *value* (valoración por múltiplos, DCF, MOAT, cartera,
noticias, gráficos). Aplicación web **estática y sin build**, desplegada en GitHub Pages:
https://jllopherranz.github.io/valueinvestjlh

- **Datos**: el histórico y las proyecciones válidas provienen del Excel del usuario (Google Drive).
  Las empresas añadidas sin Excel usan estimaciones/consenso y se marcan claramente como tales.
- **Sin build ni dependencias**: se edita y se publica directamente. `index.html` es el armazón y
  carga `assets/css/app.css` + los módulos de `assets/js/**` con `<script defer>`.

## Estructura

```
index.html            armazón HTML + lista de módulos
assets/css/app.css    todo el CSS (modo oscuro con la clase .dark)
assets/js/**          la lógica, un módulo por área
tools/modules.txt     orden de carga canónico de los módulos
tools/check.sh        verificación previa a publicar
```

## Desarrollo

```bash
bash tools/check.sh            # sintaxis, orden de módulos y colisiones de símbolos
python3 -m http.server 8137    # http://localhost:8137
```

## Para trabajar con Claude Code

Ver **[`CLAUDE.md`](CLAUDE.md)** — índice de módulos (qué hay en cada fichero), modelo de datos,
claves de `localStorage`, fuentes externas y convenciones. Empezar siempre por ahí.
