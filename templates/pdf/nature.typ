// castdown — PDF template: nature.typ
// Estilo visual Nature: 1 columna ancha, sans-serif, headings discretos,
// figuras y tablas con captions claros. Linea fina divisoria.
//
// NO es nature.cls. Drafts/previews.

#set document(title: "Nature-style paper")
#set page(
  paper: "a4",
  margin: (x: 2.5cm, top: 2.3cm, bottom: 2.5cm),
  numbering: "1",
  number-align: center,
  header: context [
    #set text(size: 7.5pt, fill: gray)
    #grid(columns: (1fr, auto), [Article], [castdown · #datetime.today().display()])
    #line(length: 100%, stroke: 0.3pt + gray)
  ],
)
#set text(
  font: ("Helvetica Neue", "Helvetica", "Arial", "Liberation Sans", "DejaVu Sans"),
  size: 10pt,
  lang: "en",
  hyphenate: auto,
)
#set par(justify: true, leading: 0.65em, first-line-indent: 0pt, spacing: 1em)
#set heading(numbering: none)

#show heading.where(level: 1): h => block(sticky: true, above: 1.4em, below: 0.6em)[
  #set text(weight: 700, size: 16pt)
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 1.2em, below: 0.5em)[
  #set text(weight: 700, size: 12pt)
  #upper(h.body)
]
#show heading.where(level: 3): h => block(sticky: true, above: 1em, below: 0.4em)[
  #set text(weight: 700, size: 10.5pt, fill: rgb("#003366"))
  #h
]

#show raw.where(block: false): r => text(
  font: ("JetBrains Mono", "Liberation Mono", "DejaVu Sans Mono"),
  size: 9pt,
  fill: rgb("#003366"),
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f4f7fa"),
  inset: 8pt,
  stroke: (left: 2pt + rgb("#003366")),
  text(font: ("JetBrains Mono", "Liberation Mono", "DejaVu Sans Mono"), size: 9pt, r),
)

#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 6 { 7.5pt } else if cols >= 4 { 8pt } else { 9pt }
    let h-inset = if cols >= 5 { 3pt } else { 6pt }
    let t = table(
      columns: (1fr,) * cols,
      inset: (x: h-inset, y: 3.5pt),
      ..it.children
    )
    block(width: 100%, breakable: true)[
      #set text(size: font-sz, hyphenate: true)
      #set par(justify: false, leading: 0.5em)
      #t
    ]
  } else { it }
}
#set table(inset: (x: 6pt, y: 3.5pt), stroke: 0.3pt + black, align: top + left)

#show link: l => text(fill: rgb("#003366"), l)

#let horizontalrule = [
  #v(0.8em) #line(length: 100%, stroke: 0.4pt + rgb("#003366")) #v(0.8em)
]
#let blockquote(body) = block(
  width: 100%, inset: (left: 14pt, rest: 6pt),
  stroke: (left: 2pt + rgb("#003366")),
  text(style: "italic", fill: rgb("#333"), body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
