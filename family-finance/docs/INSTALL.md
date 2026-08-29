# Guía de instalación

## Requisitos

- **Node.js 20+** y **npm 10+**
- **Docker** y Docker Compose (opcional, para PostgreSQL en local)
- Una cuenta de **Supabase** (para autenticación y BD en la nube) — opcional en
  modo demo.

## 1. Clonar e instalar

```bash
git clone <repo>
cd valueinvestjlh/family-finance
npm install
```

## 2. Variables de entorno

```bash
cp .env.example .env
```

Rellena al menos:

- `DATABASE_URL` y `DIRECT_URL`: conexión a PostgreSQL.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: para Auth.

> El dashboard de demostración (`/dashboard`) funciona sin estas variables.

## 3. Base de datos

### Opción A — PostgreSQL local con Docker

```bash
docker compose up -d db          # PostgreSQL en localhost:5432
npm run db:push                  # crea el esquema a partir de schema.prisma
npm run db:seed                  # carga los datos de ejemplo (pareja Vidreres)
```

### Opción B — Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia la cadena de conexión (Settings → Database) a `DATABASE_URL` /
   `DIRECT_URL`.
3. Copia URL y `anon key` (Settings → API) a las variables `NEXT_PUBLIC_*`.
4. Activa el proveedor **Google** en Authentication → Providers.
5. Ejecuta:

```bash
npm run db:migrate    # aplica migraciones
npm run db:seed       # datos de ejemplo
```

## 4. Desarrollo

```bash
npm run dev           # http://localhost:3000
```

## 5. Comprobaciones de calidad

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript estricto
npm run test          # Vitest (unidad + integración)
npm run test:coverage # con cobertura
```

## 6. Producción

### Build local

```bash
npm run build && npm run start
```

### Docker (app + base de datos)

```bash
docker compose up --build
```

### Vercel

1. Importa el repositorio en Vercel y selecciona `family-finance` como _root
   directory_.
2. Configura las variables de entorno del `.env.example`.
3. Comando de build: `prisma generate && next build` (Vercel lo detecta vía
   `package.json`).
4. Conecta tu base de datos Supabase mediante `DATABASE_URL`/`DIRECT_URL`.

## Solución de problemas

- **`Prisma Client` no encontrado**: ejecuta `npm run db:generate`.
- **Errores de conexión a la BD**: revisa que Docker esté arriba
  (`docker compose ps`) y que `DATABASE_URL` apunte al puerto correcto.
- **Auth no funciona**: confirma `NEXT_PUBLIC_SUPABASE_URL` y la `anon key`, y
  que el dominio esté permitido en Supabase → Authentication → URL Configuration.
