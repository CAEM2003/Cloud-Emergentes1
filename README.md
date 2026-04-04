# Cloud-Emergentes1

Aplicación de contactos (Python): API **FastAPI** + interfaz web estática.

## Requisitos

- Python 3.11+
- Dependencias: `pip install -r backend/requirements.txt`

## Base de datos

- **Sin configurar nada:** se crea `backend/contactos.db` (SQLite).
- **PostgreSQL:** en `backend/.env` define `DATABASE_URL=postgresql+psycopg2://...` (ver `.env.example`).

## Arranque

Desde la carpeta `backend`:

```bash
python -m app
```

Abre **http://127.0.0.1:8000/** (redirige a `/ui/`). Documentación API: **http://127.0.0.1:8000/docs**.

## Funciones

- Grupos y personas con **UUID** como código interno.
- Relación: varias personas por grupo.
- CRUD, fotografía (subida a `backend/app/static/uploads/`), búsqueda en la interfaz, paleta cálida.

## Supabase y variables “Next.js”

Esta app es **FastAPI + HTML estático**, no Next.js. Para que el backend hable con Postgres necesitas **`DATABASE_URL`** (cadena **PostgreSQL** en Supabase: **Project Settings → Database → Connection string**, modo *URI*, y adaptar el esquema a SQLAlchemy: `postgresql+psycopg2://...`).

Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_…` sirven para el **cliente JavaScript de Supabase** en proyectos Next/React. **No sustituyen** a `DATABASE_URL` para esta API. No las subas al repositorio; usa solo variables de entorno en el panel del hosting.

## Despliegue: Render (API + UI opcional en el mismo servicio)

1. En [Render](https://dashboard.render.com): **New → Web Service** (no hace falta Postgres en Render si ya usas Supabase).
2. Conecta el repositorio GitHub.
3. Configuración sugerida:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `hypercorn app.main:app --bind 0.0.0.0:$PORT`
   - **Environment →** `PYTHON_VERSION` = `3.12.8` (evita que Render use Python 3.14 por defecto).
4. **Environment →** `DATABASE_URL` = tu URI de Supabase (`postgresql+psycopg2://...`, con `?sslmode=require`). Sin esto o con URI mala, el arranque puede fallar al crear tablas.
5. Tras el deploy, la URL pública tendrá la API en `/api/...`, la documentación en `/docs` y la interfaz en `/ui/` (si el repo incluye la carpeta `frontend` junto a `backend`).

> Render inyecta `PORT` automáticamente.

**Si el build sale bien pero “Exited with status 1”:** abre **Logs** en Render y busca el traceback (casi siempre conexión a Postgres o `DATABASE_URL`). Local también puedes usar `python -m app`.

Opcional: **New → Blueprint** y selecciona `render.yaml` del repo; luego añade `DATABASE_URL` a mano en el servicio.

## Despliegue: Vercel (solo interfaz en CDN)

1. En [Vercel](https://vercel.com): **Add New → Project** → mismo repo.
2. **Root Directory:** `frontend` (Framework Preset: **Other**).
3. Edita `frontend/vercel.json` y sustituye **dos veces** `https://TU-SERVICIO.onrender.com` por la URL real de tu Web Service en Render (sin barra final).
4. Deploy. Las peticiones del navegador van a `/api/...` y `/static/...` en tu dominio Vercel; Vercel las **reenvía** al backend en Render (misma apariencia que todo en un solo origen).

**Fotos:** las rutas guardadas como `/static/uploads/...` siguen funcionando gracias al rewrite de `/static`.

## Seguridad

No commitees `.env` ni claves de Supabase. Si alguna clave se compartió en chat o issue, **rótala** en el panel de Supabase.
