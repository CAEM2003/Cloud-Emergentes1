"""Arranque local: desde la carpeta backend ejecute: python -m app"""

import asyncio
import os

from hypercorn.asyncio import serve
from hypercorn.config import Config

from .main import app


def main() -> None:
    host = (os.getenv("HOST") or "127.0.0.1").strip()
    port = int((os.getenv("PORT") or "8000").strip())
    config = Config()
    config.bind = [f"{host}:{port}"]
    print(f"Servidor local: http://{host}:{port}/  (interfaz: /ui/)")
    asyncio.run(serve(app, config))


if __name__ == "__main__":
    main()
