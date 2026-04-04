from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/grupos", tags=["grupos"])


@router.get("", response_model=list[schemas.GrupoRead])
def listar_grupos(db: Session = Depends(get_db)):
    return crud.list_grupos(db)


@router.get("/{codigo}", response_model=schemas.GrupoRead)
def obtener_grupo(codigo: UUID, db: Session = Depends(get_db)):
    row = crud.get_grupo(db, codigo)
    if not row:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    return row


@router.post("", response_model=schemas.GrupoRead, status_code=201)
def crear_grupo(body: schemas.GrupoCreate, db: Session = Depends(get_db)):
    return crud.create_grupo(db, body.grupo, body.esta_activo)


@router.put("/{codigo}", response_model=schemas.GrupoRead)
def actualizar_grupo(codigo: UUID, body: schemas.GrupoUpdate, db: Session = Depends(get_db)):
    row = crud.get_grupo(db, codigo)
    if not row:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    return crud.update_grupo(db, row, body.grupo, body.esta_activo)
