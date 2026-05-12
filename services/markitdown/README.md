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

## PDF table handling
PDFs are routed through `pdf_tables.py` (pdfplumber) instead of MarkItDown's
native pdfminer text path. Reason: pdfminer drops cell geometry, so visually
tabular PDFs become wall-of-text and no downstream cleaner can recover them.
pdfplumber wraps the same pdfminer backend but adds structural table
detection on top, so tables are emitted as GFM in the position they appear,
while surrounding prose still uses pdfminer extraction (no regression).
Borderless tables are not detected by default (ruling-line strategy only) —
add a text-strategy fallback if needed.
