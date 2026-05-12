// castdown — PDF template: report.typ
// Composed by services/pandoc/src/handlers/pdf.ts:
//   1. `pandoc -t typst` emits a body-only Typst snippet (no -s flag).
//   2. This preamble is prepended verbatim.
//   3. `typst compile` produces the PDF.
//
// Constraints respected here:
//   - body-only mode means our `#set` rules govern the whole document.
//   - `#set heading(numbering: none)` is defensive: pandoc would only emit
//     `#set heading(numbering: "1.1")` under `--number-sections`, but pin it
//     explicitly so callers can opt in without surprises.
//   - Font fallback chain so non-Docker hosts (Pi without fonts-jetbrains-mono)
//     don't fail compile — falls back to DejaVu / a generic mono.

#set document(title: "castdown report")
#set page(
  paper: "a4",
  // Margin vertical mayor para que tablas largas no pisen header/footer.
  margin: (x: 2cm, top: 2.8cm, bottom: 2.6cm),
  header: context [
    #set text(size: 8pt, fill: gray)
    #grid(columns: (1fr, auto), [castdown], [#datetime.today().display()])
    #line(length: 100%, stroke: 0.5pt + gray)
  ],
  footer: context [
    #set text(size: 8pt, fill: gray)
    #align(center)[
      #counter(page).display("1 / 1", both: true)
    ]
  ],
)

// Body: sans-serif por defecto (legible en celdas estrechas).
// Mono se reserva para code/raw via `#show raw` mas abajo.
#set text(font: ("Inter", "Helvetica", "Arial", "DejaVu Sans"), size: 10pt, lang: "es", hyphenate: auto)
// Justify off por defecto: dentro de tablas estrechas, justify produce
// "rios" de espacio horribles. Para parrafos sueltos sigue siendo legible.
#set par(justify: false, leading: 0.65em)
#set heading(numbering: none)

// `sticky: true` evita el caso "titulo huerfano": typst mantiene el heading
// pegado al bloque siguiente (parrafo, tabla, lista) y rompe pagina antes del
// par heading+bloque, no entre ellos.
#show heading.where(level: 1): h => block(sticky: true, above: 1em, below: 0.5em)[
  #set text(weight: 800, size: 22pt)
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 0.9em, below: 0.4em)[
  #set text(weight: 700, size: 14pt)
  #h
]
#show heading.where(level: 3): h => block(sticky: true, above: 0.7em, below: 0.3em)[
  #set text(weight: 600, size: 12pt, fill: rgb("#ff2e2e"))
  #h
]

// Inline code: solo cambio de font (mono), sin caja ni highlight.
#show raw.where(block: false): r => text(
  font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"),
  size: 9pt,
  r,
)

// Code blocks: mono, fondo paper, borde brutalist.
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#ebe7d8"),
  inset: 10pt,
  stroke: 2pt + black,
  radius: 0pt,
  text(font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"), size: 9pt, r),
)

// --- Tablas ---
// Causa raiz: pandoc-typst writer emite `table(columns: N)` (int, sin anchos).
// Typst entonces auto-mide y celdas con texto largo dominan el ancho. Aqui
// reconstruimos la tabla con `columns: (1fr,) * N` para anchos iguales y
// envolvemos en block 100% para que ocupe el ancho de la columna/pagina.
// Recursion del show rule se rompe en la 2da invocacion porque cols pasa a
// ser array (1fr,)*N, no int, cae a else: it.
#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 6 { 7pt } else if cols >= 4 { 7.5pt } else { 8.5pt }
    let h-inset = if cols >= 5 { 3pt } else { 6pt }
    let t = table(
      columns: (1fr,) * cols,
      inset: (x: h-inset, y: 4pt),
      ..it.children
    )
    block(width: 100%, breakable: true)[
      #set text(size: font-sz, hyphenate: true)
      #set par(justify: false, leading: 0.55em)
      #t
    ]
  } else {
    it
  }
}
#set table(
  inset: (x: 6pt, y: 4pt),
  stroke: 0.6pt + black,
  align: top + left,
)

// Links: solo color, sin underline.
#show link: l => text(fill: rgb("#ff2e2e"), weight: 600, l)

// --- pandoc typst-writer body-mode helpers ---
// `pandoc -t typst` (without -s) emite llamadas a simbolos que solo existen si
// pandoc inyecta su default template. Aqui los definimos defensivamente para
// que el compile no truene independientemente de que el writer los use.
#let horizontalrule = [
  #v(0.6em)
  #line(length: 100%, stroke: 0.5pt + gray)
  #v(0.6em)
]
#let blockquote(body) = block(
  width: 100%,
  inset: (left: 12pt, rest: 8pt),
  stroke: (left: 2pt + rgb("#2f4fbd")),
  text(style: "italic", body),
)
// Estos los emite pandoc para markdown extendido (~~strike~~, etc).
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)

// Content is appended after this preamble by pandoc -t typst.
