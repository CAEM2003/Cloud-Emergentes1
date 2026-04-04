from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from . import models


def list_grupos(db: Session) -> list[models.Grupo]:
    return list(db.scalars(select(models.Grupo).order_by(models.Grupo.grupo)).all())


def get_grupo(db: Session, codigo: UUID) -> models.Grupo | None:
    return db.get(models.Grupo, codigo)


def create_grupo(db: Session, grupo: str, esta_activo: bool) -> models.Grupo:
    row = models.Grupo(grupo=grupo, esta_activo=esta_activo)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_grupo(db: Session, row: models.Grupo, grupo: str | None, esta_activo: bool | None) -> models.Grupo:
    if grupo is not None:
        row.grupo = grupo
    if esta_activo is not None:
        row.esta_activo = esta_activo
    db.commit()
    db.refresh(row)
    return row


def list_personas(db: Session) -> list[models.Persona]:
    q = (
        select(models.Persona)
        .options(joinedload(models.Persona.grupo))
        .order_by(models.Persona.apellidos, models.Persona.nombres)
    )
    return list(db.scalars(q).unique().all())


def get_persona(db: Session, codigo: UUID) -> models.Persona | None:
    q = (
        select(models.Persona)
        .options(joinedload(models.Persona.grupo))
        .where(models.Persona.codigo == codigo)
    )
    return db.scalars(q).unique().first()


def create_persona(
    db: Session,
    *,
    nombres: str,
    apellidos: str,
    correo: str,
    nro_celular: str | None,
    direccion: str | None,
    observaciones: str | None,
    fotografia: str | None,
    esta_activo: bool,
    grupo_codigo: UUID,
) -> models.Persona:
    row = models.Persona(
        nombres=nombres,
        apellidos=apellidos,
        correo=correo,
        nro_celular=nro_celular,
        direccion=direccion,
        observaciones=observaciones,
        fotografia=fotografia,
        esta_activo=esta_activo,
        grupo_codigo=grupo_codigo,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_persona(
    db: Session,
    row: models.Persona,
    *,
    nombres: str | None,
    apellidos: str | None,
    correo: str | None,
    nro_celular: str | None,
    direccion: str | None,
    observaciones: str | None,
    fotografia: str | None,
    esta_activo: bool | None,
    grupo_codigo: UUID | None,
) -> models.Persona:
    if nombres is not None:
        row.nombres = nombres
    if apellidos is not None:
        row.apellidos = apellidos
    if correo is not None:
        row.correo = correo
    if nro_celular is not None:
        row.nro_celular = nro_celular
    if direccion is not None:
        row.direccion = direccion
    if observaciones is not None:
        row.observaciones = observaciones
    if fotografia is not None:
        row.fotografia = fotografia
    if esta_activo is not None:
        row.esta_activo = esta_activo
    if grupo_codigo is not None:
        row.grupo_codigo = grupo_codigo
    db.commit()
    db.refresh(row)
    return row


def count_personas_en_grupo(db: Session, grupo_codigo: UUID) -> int:
    n = db.scalar(
        select(func.count())
        .select_from(models.Persona)
        .where(models.Persona.grupo_codigo == grupo_codigo)
    )
    return int(n or 0)
