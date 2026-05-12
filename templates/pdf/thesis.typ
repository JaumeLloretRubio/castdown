// castdown — PDF template: thesis.typ
// Tesis universitaria: 1 columna, serif, 11pt, espaciado 1.5,
// margenes asimetricos (mas grande izquierda para encuadernacion),
// headings numerados con capitulo. Footer con paginacion.

#set document(title: "Thesis")
#set page(
  paper: "a4",
  margin: (left: 3.5cm, right: 2.5cm, top: 2.8cm, bottom: 2.8cm),
  numbering: "1",
  number-align: center,
  footer: context [
    #set text(size: 9pt, fill: gray)
    #align(center)[#counter(page).display()]
  ],
)
#set text(
  font: ("Libertinus Serif", "Linux Libertine", "Times New Roman", "Liberation Serif", "New Computer Modern"),
  size: 11pt,
  lang: "es",
  hyphenate: auto,
)
#set par(justify: true, leading: 0.85em, first-line-indent: 1.5em, spacing: 0.8em)
#set heading(numbering: "1.1")

#show heading.where(level: 1): h => block(sticky: true, above: 2em, below: 0.8em)[
  #set text(weight: 700, size: 22pt)
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 1.4em, below: 0.6em)[
  #set text(weight: 700, size: 15pt)
  #h
]
#show heading.where(level: 3): h => block(sticky: true, above: 1em, below: 0.4em)[
  #set text(weight: 700, size: 12pt)
  #h
]
#show heading.where(level: 4): h => block(sticky: true, above: 0.8em, below: 0.3em)[
  #set text(weight: 600, size: 11pt, style: "italic")
  #h
]

#show raw.where(block: false): r => text(
  font: ("JetBrains Mono", "Liberation Mono", "DejaVu Sans Mono"),
  size: 10pt,
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f5f5f5"),
  inset: 10pt,
  stroke: 0.4pt + rgb("#888"),
  text(font: ("JetBrains Mono", "Liberation Mono", "DejaVu Sans Mono"), size: 9.5pt, r),
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
#set table(inset: (x: 6pt, y: 4pt), stroke: 0.4pt + black, align: top + left)

#show link: l => text(fill: rgb("#1a4dad"), l)

#let horizontalrule = [
  #v(1em) #line(length: 40%, stroke: 0.4pt + gray) #v(1em)
]
#let blockquote(body) = block(
  width: 90%,
  inset: (left: 16pt, rest: 8pt),
  stroke: (left: 1.5pt + rgb("#888")),
  text(style: "italic", size: 10.5pt, body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
