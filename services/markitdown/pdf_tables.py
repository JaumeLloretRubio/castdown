"""
PDF -> Markdown with structural table awareness via pdfplumber.

MarkItDown's PDF path uses pdfminer.six text extraction, which is positional
text only: tabular content survives as wall-of-text because the cell
geometry is discarded. pdfplumber wraps the same pdfminer backend but adds
page.find_tables() (ruling-line clustering), letting us splice GFM tables
back into the text in the order they appear, without losing surrounding
prose.

Pi-friendly: pdfplumber is pure Python and depends on pdfminer.six (already
pulled in transitively by markitdown[all]) + Pillow + pypdfium2.
"""
from __future__ import annotations

import logging
from typing import List, Optional, Sequence

import pdfplumber

log = logging.getLogger("markitdown-svc.pdf")


def pdf_to_markdown(path: str) -> str:
    """Convert a PDF to markdown with tables rendered as GFM in place."""
    parts: List[str] = []
    with pdfplumber.open(path) as pdf:
        for idx, page in enumerate(pdf.pages):
            try:
                rendered = _render_page(page)
            except Exception as e:  # noqa: BLE001 — fall back to plain text on any pdfplumber edge case
                log.warning("page %d render failed (%s) — falling back to plain text", idx, e)
                rendered = page.extract_text() or ""
            if rendered and rendered.strip():
                parts.append(rendered)
    return "\n\n".join(parts)


def _render_page(page) -> str:
    tables = page.find_tables() or []
    real_tables = [t for t in tables if _is_real_table(t.extract())]
    if not real_tables:
        return page.extract_text() or ""

    real_tables.sort(key=lambda t: t.bbox[1])  # by top-y

    segments: List[str] = []
    prev_bottom = 0.0
    page_w = page.width
    page_h = page.height

    for t in real_tables:
        _, top, _, bottom = t.bbox
        if top - prev_bottom > 1:
            above = _crop_text(page, 0, prev_bottom, page_w, top)
            if above:
                segments.append(above)
        gfm = _render_gfm_table(t.extract())
        if gfm:
            segments.append(gfm)
        prev_bottom = bottom

    if page_h - prev_bottom > 1:
        tail = _crop_text(page, 0, prev_bottom, page_w, page_h)
        if tail:
            segments.append(tail)

    return "\n\n".join(segments)


def _crop_text(page, x0: float, top: float, x1: float, bottom: float) -> str:
    try:
        cropped = page.crop((x0, top, x1, bottom), relative=False, strict=False)
        return (cropped.extract_text() or "").strip()
    except Exception:  # noqa: BLE001
        return ""


def _is_real_table(rows: Optional[Sequence[Sequence[Optional[str]]]]) -> bool:
    """Filter false positives from find_tables (single-cell blobs, empties)."""
    if not rows or len(rows) < 2:
        return False
    non_empty = [r for r in rows if r and any((c or "").strip() for c in r)]
    if len(non_empty) < 2:
        return False
    return any(len([c for c in r if (c or "").strip()]) >= 2 for r in non_empty)


def _render_gfm_table(rows: Optional[Sequence[Sequence[Optional[str]]]]) -> str:
    if not rows:
        return ""
    cleaned = [r for r in rows if r and any((c or "").strip() for c in r)]
    if not cleaned:
        return ""

    n_cols = max(len(r) for r in cleaned)
    norm = [_normalize_row(r, n_cols) for r in cleaned]
    header, body = norm[0], norm[1:]

    lines = [_fmt(header), "| " + " | ".join(["---"] * n_cols) + " |"]
    lines.extend(_fmt(r) for r in body)
    return "\n".join(lines)


def _normalize_row(row: Sequence[Optional[str]], n_cols: int) -> List[str]:
    out = [_clean_cell(c) for c in row]
    while len(out) < n_cols:
        out.append("")
    return out[:n_cols]


def _clean_cell(raw: Optional[str]) -> str:
    if raw is None:
        return ""
    # Collapse internal whitespace + newlines into single spaces (GFM cells are one line).
    s = " ".join(raw.split())
    return s.replace("|", "\\|")


def _fmt(cells: Sequence[str]) -> str:
    return "| " + " | ".join(cells) + " |"
