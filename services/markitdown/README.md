# markitdown-svc

File → Markdown microservice. Python + FastAPI + Microsoft MarkItDown.

## Endpoints
- `POST /cast` — multipart `file=@...` → `{ markdown, meta }`
- `GET /health` — liveness

## Local dev
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Notes
- Memory-bound on large PDFs (loads file into memory). For Pi, cap `MAX_FILE_SIZE_MB`.
- LibreOffice + Tesseract baked in for full MarkItDown extras coverage.
- Container image is heavy (~1.5 GB). Consider slimming for Pi by removing libreoffice if PPTX support not needed.
