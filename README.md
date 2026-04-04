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
