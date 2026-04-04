from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/personas", tags=["personas"])

UPLOAD_DIR: Path | None = None
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def set_upload_dir(path: Path) -> None:
    global UPLOAD_DIR
    UPLOAD_DIR = path


@router.get("", response_model=list[schemas.PersonaRead])
def listar_personas(db: Session = Depends(get_db)):
    return crud.list_personas(db)


@router.get("/{codigo}", response_model=schemas.PersonaRead)
def obtener_persona(codigo: UUID, db: Session = Depends(get_db)):
    row = crud.get_persona(db, codigo)
    if not row:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return row


@router.post("", response_model=schemas.PersonaRead, status_code=201)
def crear_persona(body: schemas.PersonaCreate, db: Session = Depends(get_db)):
    if not crud.get_grupo(db, body.grupo_codigo):
        raise HTTPException(status_code=400, detail="El grupo indicado no existe")
    try:
        row = crud.create_persona(
            db,
            nombres=body.nombres,
            apellidos=body.apellidos,
            correo=body.correo,
            nro_celular=body.nro_celular,
            direccion=body.direccion,
            observaciones=body.observaciones,
            fotografia=body.fotografia,
            esta_activo=body.esta_activo,
            grupo_codigo=body.grupo_codigo,
        )
    except IntegrityError:
        raise HTTPException(status_code=409, detail="El correo ya está registrado") from None
    return crud.get_persona(db, row.codigo)


@router.put("/{codigo}", response_model=schemas.PersonaRead)
def actualizar_persona(codigo: UUID, body: schemas.PersonaUpdate, db: Session = Depends(get_db)):
    row = crud.get_persona(db, codigo)
    if not row:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    if body.grupo_codigo is not None and not crud.get_grupo(db, body.grupo_codigo):
        raise HTTPException(status_code=400, detail="El grupo indicado no existe")
    try:
        crud.update_persona(
            db,
            row,
            nombres=body.nombres,
            apellidos=body.apellidos,
            correo=body.correo,
            nro_celular=body.nro_celular,
            direccion=body.direccion,
            observaciones=body.observaciones,
            fotografia=body.fotografia,
            esta_activo=body.esta_activo,
            grupo_codigo=body.grupo_codigo,
        )
    except IntegrityError:
        raise HTTPException(status_code=409, detail="El correo ya está registrado") from None
    return crud.get_persona(db, codigo)


@router.post("/{codigo}/foto", response_model=schemas.PersonaRead)
async def subir_foto(codigo: UUID, foto: UploadFile = File(...), db: Session = Depends(get_db)):
    if UPLOAD_DIR is None:
        raise HTTPException(status_code=500, detail="Directorio de carga no configurado")
    row = crud.get_persona(db, codigo)
    if not row:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    suffix = Path(foto.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Use: {', '.join(sorted(ALLOWED_EXT))}",
        )
    filename = f"{codigo}{suffix}"
    dest = UPLOAD_DIR / filename
    content = await foto.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB")
    dest.write_bytes(content)
    public_path = f"/static/uploads/{filename}"
    crud.update_persona(
        db,
        row,
        nombres=None,
        apellidos=None,
        correo=None,
        nro_celular=None,
        direccion=None,
        observaciones=None,
        fotografia=public_path,
        esta_activo=None,
        grupo_codigo=None,
    )
    return crud.get_persona(db, codigo)
