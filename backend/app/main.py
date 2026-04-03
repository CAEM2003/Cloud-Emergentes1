from fastapi import FastAPI
from sqlalchemy import text
from .database import engine
from .models import Base

app = FastAPI(title="cloud-emergente API")

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"mensaje": "Conexión exitosa con PostgreSQL"}
    except Exception as e:
        return {"error": str(e)}