# Family Finance

Plataforma web **privada** para que una pareja gestione de forma profesional sus
finanzas domésticas: ingresos, gastos, reparto proporcional por persona,
hipoteca, objetivos de ahorro y evolución del patrimonio neto. Pensada para ser
**intuitiva** para usuarios no técnicos y a la vez ofrecer **análisis avanzados**.

> Caso de uso de referencia: pareja con vivienda unifamiliar (jardín y piscina)
> en Vidreres, Girona. Los datos de ejemplo del seed reproducen este escenario.

---

## ✨ Características

- **Dashboard** con patrimonio neto, ahorro mensual, tasa de ahorro, gasto por
  categoría, ratio vivienda/ingresos, fondo de emergencia y objetivos.
- **Ingresos**: recurrentes, extraordinarios, pagas extra y simulación de cambios.
- **Gastos**: alta manual, importación CSV de bancos, categorías, etiquetas y
  gastos recurrentes.
- **Reparto por persona**: proporcional automático (68,7 % / 31,3 %),
  igualitario, personalizado o solo pagador.
- **Objetivos**: fondo de emergencia, reformas, viajes, amortización de
  hipoteca, inversión y vehículo, con progreso y fecha estimada.
- **Hipoteca**: capital pendiente, cuadro de amortización (sistema francés) y
  simulador de amortización anticipada.
- **Informes**: gráficos interactivos con filtros por mes, trimestre, año,
  categoría y persona.
- **Alertas inteligentes**: presupuesto superado, tasa de ahorro < 20 %, gasto
  de vivienda > 35 %, fondo de emergencia < 6 meses, suscripciones sin uso.
- **Presupuestos** mensuales y anuales por categoría con desviación absoluta,
  porcentual y tendencia.
- **Exportación** a CSV, PDF y Excel.
- **Seguridad**: autenticación email/contraseña y Google (Supabase Auth), roles
  administrador/invitado, datos cifrados y copias de seguridad.
- **UX**: minimalista, responsive, accesible, con modo claro y oscuro.

## 🧱 Stack tecnológico

| Capa            | Tecnología                                        |
| --------------- | ------------------------------------------------- |
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Componentes     | shadcn/ui (Radix), Recharts                       |
| Backend / Auth  | Supabase (PostgreSQL + Supabase Auth)             |
| ORM             | Prisma                                            |
| Validación      | Zod                                               |
| Tests           | Vitest, Testing Library                           |
| Infra           | Docker, docker-compose, GitHub Actions, Vercel    |

## 🚀 Puesta en marcha rápida

Requisitos: **Node 20+** y **Docker** (opcional, para PostgreSQL local).

```bash
cd family-finance
cp .env.example .env          # rellena tus credenciales
npm install
docker compose up -d db       # levanta PostgreSQL en local
npm run db:push               # crea el esquema
npm run db:seed               # carga los datos de ejemplo
npm run dev                   # http://localhost:3000
```

El dashboard de demostración funciona sin base de datos en
`http://localhost:3000/dashboard` (usa los datos del seed en memoria).

Guía detallada: [`docs/INSTALL.md`](docs/INSTALL.md).
Decisiones de arquitectura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 📜 Scripts

| Script                  | Descripción                                  |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                       |
| `npm run build`         | Build de producción                          |
| `npm run start`         | Sirve el build                               |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | Comprobación de tipos (tsc)                  |
| `npm run test`          | Tests unitarios + integración (Vitest)       |
| `npm run test:coverage` | Tests con cobertura                          |
| `npm run db:push`       | Sincroniza el esquema con la base de datos   |
| `npm run db:migrate`    | Crea/aplica migraciones                      |
| `npm run db:seed`       | Carga los datos de ejemplo                   |

## 🗂️ Estructura

```
family-finance/
├── prisma/
│   ├── schema.prisma         # Modelo de datos (PostgreSQL)
│   └── seed.ts               # Datos de ejemplo del enunciado
├── src/
│   ├── app/                  # App Router (landing, login, dashboard)
│   ├── components/           # UI (shadcn), charts, dashboard
│   ├── domain/               # Lógica de negocio pura (DDD) + tests
│   │   ├── money.ts          # Value Object Money (céntimos)
│   │   ├── allocation.ts     # Reparto proporcional / custom
│   │   ├── mortgage.ts       # Amortización francesa + simulador
│   │   ├── finance.ts        # Tasa de ahorro, patrimonio, ratios
│   │   └── alerts.ts         # Motor de alertas
│   ├── lib/                  # Prisma, Supabase, Zod, formato, constantes
│   └── middleware.ts         # Sesión Supabase + protección de rutas
├── tests/integration/        # Tests de integración
├── Dockerfile · docker-compose.yml
└── .github/workflows/ci.yml  # CI: lint, typecheck, tests, build
```

## 🔭 Estado y roadmap

Este repositorio entrega una **base de producción** con el modelo de datos
completo, la lógica de negocio testeada (reparto, hipoteca, indicadores,
alertas), el dashboard con gráficos y la infraestructura (Docker, CI/CD).

Próximos pasos (ver `docs/ARCHITECTURE.md`): Server Actions de CRUD sobre
Prisma, políticas RLS en Supabase, importador CSV de bancos, exportación
PDF/Excel y filtros avanzados en informes.

## 📄 Licencia

Uso privado. © Los autores.
