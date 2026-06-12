# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- `castdown-cleaners` v0.1.0 — 29-step Markdown post-processing pipeline
  - 14 new cleaners: `decodeHtmlEntities`, `fixLigatures`, `stripHtmlArtifacts`, `stripEmptyHeadings`, `normalizeHorizontalRules`, `normalizeListMarkers`, `normalizeNumberedLists`, `collapseRedundantEmphasis`, `stripUrlTrackingParams`, `fixFootnoteMarkers`, `annotateFiguresTables`, `stripBoilerplate`, `normalizeWhitespaceInLines`, `extractMetadataFrontmatter`
  - Shared `withProtectedCode()` utility for code-block-safe transformations
  - Pipeline refactored from parallel arrays to `PipelineStep[]` object form
  - New `CleanOptions`: `ligatureMap`, `extractFrontmatter`, `frontmatterScanLines`, `keepBoilerplate`, `keepUrlTracking`
  - 184 unit tests (100% passing)
  - Standalone `README.md` and build config for npm publishing
- `LICENSE` — Apache 2.0
- `CHANGELOG.md` (this file)

### Fixed
- `castdown-mcp`: replaced hardcoded `/tmp/` paths with `os.tmpdir()` — fixes Windows compatibility for `render_markdown` and `crawl_url` tools when `output_path` is not specified

### Changed
- `SettingsModal`: simplified to "Verify API Key" — removed SAVE/RESET buttons and localStorage persistence; key is now injected server-side by middleware, not stored in browser
- `castdown-cleaners`: removed dead `&nbsp;` replacement from `stripDocxArtifacts` (now handled by `decodeHtmlEntities` upstream in the pipeline)

---

## Pre-release history

Sessions 01–10 (Jan–May 2026): initial implementation of all services, templates, and infrastructure. See `logs/` for detailed session logs.
