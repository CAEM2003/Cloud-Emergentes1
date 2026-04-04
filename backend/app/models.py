import uuid

from sqlalchemy import Boolean, Column, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from .database import Base


class Grupo(Base):
    __tablename__ = "grupos"

    codigo = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grupo = Column(String(100), nullable=False)
    esta_activo = Column(Boolean, nullable=False, default=True)

    personas = relationship("Persona", back_populates="grupo")


class Persona(Base):
    __tablename__ = "personas"

    codigo = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    nro_celular = Column(String(20))
    direccion = Column(String(200))
    observaciones = Column(Text)
    fotografia = Column(Text)
    esta_activo = Column(Boolean, nullable=False, default=True)
    grupo_codigo = Column(Uuid(as_uuid=True), ForeignKey("grupos.codigo"), nullable=False)

    grupo = relationship("Grupo", back_populates="personas")
