from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class GrupoBase(BaseModel):
    grupo: str = Field(..., max_length=100)
    esta_activo: bool = True


class GrupoCreate(GrupoBase):
    pass


class GrupoUpdate(BaseModel):
    grupo: str | None = Field(None, max_length=100)
    esta_activo: bool | None = None


class GrupoRead(GrupoBase):
    codigo: UUID

    model_config = {"from_attributes": True}


class PersonaBase(BaseModel):
    nombres: str = Field(..., max_length=100)
    apellidos: str = Field(..., max_length=100)
    correo: EmailStr
    nro_celular: str | None = Field(None, max_length=20)
    direccion: str | None = Field(None, max_length=200)
    observaciones: str | None = None
    esta_activo: bool = True
    grupo_codigo: UUID


class PersonaCreate(PersonaBase):
    fotografia: str | None = None


class PersonaUpdate(BaseModel):
    nombres: str | None = Field(None, max_length=100)
    apellidos: str | None = Field(None, max_length=100)
    correo: EmailStr | None = None
    nro_celular: str | None = Field(None, max_length=20)
    direccion: str | None = Field(None, max_length=200)
    observaciones: str | None = None
    fotografia: str | None = None
    esta_activo: bool | None = None
    grupo_codigo: UUID | None = None


class GrupoResumen(BaseModel):
    codigo: UUID
    grupo: str

    model_config = {"from_attributes": True}


class PersonaRead(PersonaBase):
    codigo: UUID
    fotografia: str | None = None
    grupo: GrupoResumen | None = None

    model_config = {"from_attributes": True}
