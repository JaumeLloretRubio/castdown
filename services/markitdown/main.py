"""
markitdown-svc — file → markdown microservice
POST /cast    multipart file → { markdown, meta }
GET  /health  liveness
"""
from __future__ import annotations

import io
import logging
import os
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from markitdown import MarkItDown

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("markitdown-svc")

app = FastAPI(title="castdown · markitdown-svc", version="0.1.0-alpha")
converter = MarkItDown()

MAX_BYTES = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "markitdown", "version": "0.1.0-alpha"}


@app.post("/cast")
async def cast(file: UploadFile = File(...)) -> JSONResponse:
    if not file.filename:
        raise HTTPException(400, "filename_required")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(413, f"file_too_large (max {MAX_BYTES} bytes)")

    suffix = Path(file.filename).suffix or ".bin"
    t0 = time.perf_counter()

    # MarkItDown reads from path — write to temp.
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = converter.convert(tmp_path)
        markdown = result.text_content or ""
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        log.info(
            "cast ok name=%s size=%d ms=%d out_chars=%d",
            file.filename, len(contents), elapsed_ms, len(markdown),
        )
        return JSONResponse({
            "markdown": markdown,
            "meta": {
                "filename": file.filename,
                "size_bytes": len(contents),
                "elapsed_ms": elapsed_ms,
                "engine": "markitdown",
            },
        })
    except Exception as e:
        log.exception("cast failed name=%s", file.filename)
        raise HTTPException(500, f"conversion_failed: {e}")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
