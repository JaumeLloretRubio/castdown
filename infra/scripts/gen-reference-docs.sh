#!/usr/bin/env bash
# gen-reference-docs.sh — generate pandoc binary reference templates.
#
# pandoc uses reference.docx / reference.pptx as style masters when
# rendering with --reference-doc. This script generates the defaults
# so they can be customized in LibreOffice/Word and re-committed.
#
# Usage:
#   bash infra/scripts/gen-reference-docs.sh
#
# Requirements:
#   - pandoc in PATH
#
# Output:
#   templates/docx/default.docx
#   templates/pptx/default.pptx
#
# After generating: open each file in LibreOffice / Microsoft Office,
# customize styles (fonts, colors, spacing), save, and commit.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATES="$REPO_ROOT/templates"

if ! command -v pandoc &>/dev/null; then
  echo "Error: pandoc not found in PATH." >&2
  exit 1
fi

PANDOC_VER=$(pandoc --version | head -1)
echo "Using $PANDOC_VER"

# ── DOCX ──────────────────────────────────────────────────────────
mkdir -p "$TEMPLATES/docx"
DOCX_OUT="$TEMPLATES/docx/default.docx"
if [[ -f "$DOCX_OUT" ]]; then
  echo "DOCX already exists: $DOCX_OUT (skipping — delete to regenerate)"
else
  pandoc --print-default-data-file reference.docx > "$DOCX_OUT"
  echo "Created: $DOCX_OUT"
fi

# ── PPTX ──────────────────────────────────────────────────────────
mkdir -p "$TEMPLATES/pptx"
PPTX_OUT="$TEMPLATES/pptx/default.pptx"
if [[ -f "$PPTX_OUT" ]]; then
  echo "PPTX already exists: $PPTX_OUT (skipping — delete to regenerate)"
else
  pandoc --print-default-data-file reference.pptx > "$PPTX_OUT"
  echo "Created: $PPTX_OUT"
fi

echo ""
echo "Done. Customize the generated files in LibreOffice/Word, then commit."
echo "  - Fonts, colors, spacing: edit via 'Styles' menu"
echo "  - DOCX: Styles > Modify > set font/size for each style"
echo "  - PPTX: View > Slide Master > modify layouts + fonts"
