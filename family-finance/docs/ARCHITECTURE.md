# Arquitectura

## Principios

El proyecto aplica **Clean Architecture** y **Domain-Driven Design** de forma
pragmática, adaptados a un monolito Next.js:

- **Dominio puro y aislado** (`src/domain`): lógica de negocio sin dependencias
  de framework, base de datos ni UI. Es testeable de forma instantánea y
  determinista. Aquí viven el _value object_ `Money`, el reparto proporcional,
  la amortización de la hipoteca, los indicadores financieros y el motor de
  alertas.
- **Capa de aplicación / infraestructura** (`src/lib`): adaptadores hacia el
  exterior (Prisma, Supabase), validación de entrada (Zod), formato y
  constantes de negocio.
- **Capa de presentación** (`src/app`, `src/components`): App Router de Next.js,
  Server Components por defecto y Client Components solo donde hay interacción
  (gráficos, formularios, toggle de tema).

La dependencia siempre apunta hacia el dominio: la UI y la infraestructura
conocen el dominio, pero el dominio no conoce a nadie.

## Decisiones técnicas clave

### Dinero en céntimos (enteros)

Los importes se almacenan como **enteros de céntimos** (`Int`/`BigInt` en la BD,
`bigint` en `Money`). Se evita por completo la aritmética en coma flotante, que
introduce errores inaceptables en finanzas (`0.1 + 0.2 !== 0.3`). El reparto de
un gasto entre personas usa el **método del mayor resto** para garantizar que la
suma de las partes es _exactamente_ el total, sin perder ni inventar céntimos.

### Porcentajes en puntos básicos

Las cuotas de reparto y los tipos de interés se guardan en **puntos básicos**
(1 % = 100 bps) como enteros, por la misma razón. El 68,7 % / 31,3 % del
enunciado se calcula a partir de los ingresos reales (44.800 € / 20.400 €),
dando 6871 / 3129 bps que suman exactamente 10.000.

### Supabase + Prisma

- **Supabase** aporta PostgreSQL gestionado, **Auth** (email/contraseña + OAuth
  Google) y Row Level Security.
- **Prisma** es el ORM tipado para el acceso a datos desde el servidor. El `id`
  de `User` coincide con `auth.users.id` de Supabase para enlazar identidad y
  datos de dominio.
- En producción se recomienda activar **RLS** en Supabase de modo que cada
  hogar (`Household`) solo sea accesible por sus miembros.

### Next.js App Router

Server Components por defecto reducen el JavaScript enviado al cliente
(rapidez). Los gráficos (Recharts) y formularios se aíslan en Client Components.
El dashboard usa `force-dynamic` porque depende de datos que cambian.

### Modo demo sin base de datos

`buildDashboardModel()` compone el dashboard a partir de las constantes del seed
y la capa de dominio. Esto permite ver la aplicación funcionando sin
infraestructura y, a la vez, sirve de **test de integración** de que el dominio
reproduce las cifras del enunciado.

## Modelo de datos (resumen)

```
Household 1───* Member         (pareja; shareBps = cuota proporcional)
Household 1───* Account        (cuentas/activos/pasivos → patrimonio neto)
Household 1───* Income         (recurrente / extra / puntual)
Household 1───* Expense ───* ExpenseAllocation ─* Member   (reparto)
Household 1───* Category 1───* Budget
Household 1───* Goal           (fondo emergencia, reforma, hipoteca…)
Household 1───* Mortgage       (capital pendiente, tipo, plazo)
Household 1───* Alert
Household 1───* NetWorthSnapshot   (serie temporal de patrimonio)
User *───* Household  (vía Membership; rol ADMIN/GUEST)
```

## Riesgos y mitigaciones

| Riesgo                                              | Mitigación                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Doble fuente de verdad Supabase Auth ↔ tabla `User` | Sincronizar con un trigger/webhook al crear usuario en Supabase.  |
| Cálculos financieros incorrectos                    | Dominio puro con cobertura de tests (reparto, hipoteca, ratios).  |
| Fuga de datos entre hogares                         | Row Level Security en Supabase por `household_id`.                |
| Importación CSV con formatos heterogéneos de bancos | Validación con Zod y mapeo configurable por banco.                |
| Precisión monetaria                                 | Enteros de céntimos + método del mayor resto en los repartos.     |

## Mejoras futuras

- Server Actions de CRUD (ingresos, gastos, objetivos, presupuestos) sobre
  Prisma con validación Zod compartida.
- Políticas RLS y migración de cálculos del dashboard a consultas SQL agregadas.
- Importador CSV con detección de banco y conciliación de duplicados.
- Exportación real a PDF (react-pdf) y Excel (SheetJS) desde Route Handlers.
- Filtros avanzados (trimestre/persona/categoría) e informes comparativos.
- Copias de seguridad automáticas programadas (pg_dump → almacenamiento).
- Tests E2E con Playwright sobre los flujos críticos.
```
