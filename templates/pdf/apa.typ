// castdown — PDF template: apa.typ
// Estilo visual APA 7th: 1 columna, Times 12pt, doble espaciado,
// margenes 1 pulgada, sangria primera linea 0.5 pulgadas.
//
// NO incluye running head/title page automatica (eso requiere metadata MD
// estructurada). Estilo body-only.

#set document(title: "APA-style paper")
#set page(
  paper: "us-letter",
  margin: 2.54cm, // 1 inch
  numbering: "1",
  number-align: right,
)
#set text(
  font: ("Times New Roman", "Liberation Serif", "Nimbus Roman", "New Computer Modern"),
  size: 12pt,
  lang: "en",
  hyphenate: auto,
)
#set par(
  justify: false,           // APA prefiere flag-left
  leading: 1em,             // doble espaciado aproximado (12pt * 2 - desc)
  first-line-indent: 1.27cm, // 0.5 inch
)
#set heading(numbering: none)

// APA niveles 1-5: bold centered → bold left → italic left → bold indent → italic indent
#show heading.where(level: 1): h => block(sticky: true, above: 1em, below: 0.8em)[
  #set align(center)
  #set text(weight: 700, size: 12pt)
  #h.body
]
#show heading.where(level: 2): h => block(sticky: true, above: 0.9em, below: 0.5em)[
  #set text(weight: 700, size: 12pt)
  #h.body
]
#show heading.where(level: 3): h => block(sticky: true, above: 0.8em, below: 0.4em)[
  #set text(weight: 700, size: 12pt, style: "italic")
  #h.body
]

#show raw.where(block: false): r => text(
  font: ("Courier New", "Liberation Mono", "DejaVu Sans Mono"),
  size: 11pt,
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f6f6f6"),
  inset: 10pt,
  text(font: ("Courier New", "Liberation Mono", "DejaVu Sans Mono"), size: 10pt, r),
)

#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 6 { 8.5pt } else if cols >= 4 { 9pt } else { 10pt }
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
  } else { it }
}
#set table(inset: (x: 6pt, y: 4pt), stroke: 0.5pt + black, align: top + left)

#show link: l => text(fill: rgb("#0000ee"), l)

#let horizontalrule = [
  #v(0.8em) #line(length: 100%, stroke: 0.3pt + gray) #v(0.8em)
]
#let blockquote(body) = block(
  width: 100%,
  inset: (left: 1.27cm, rest: 6pt), // 0.5 inch indent APA quote block
  text(body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
