// castdown — PDF template: acm.typ
// Estilo visual ACM sigconf: 2 columnas, Libertine/serif, 9pt body,
// blue accent en links/headings level 3.
//
// NO es acmart.cls. Drafts/previews/universitarios.

#set document(title: "ACM-style paper")
#set page(
  paper: "us-letter",
  margin: (x: 1.9cm, top: 2.2cm, bottom: 2.5cm),
  columns: 2,
  numbering: "1",
  number-align: center,
)
#set text(
  font: ("Libertinus Serif", "Linux Libertine", "Times New Roman", "New Computer Modern"),
  size: 9pt,
  lang: "en",
  hyphenate: auto,
)
#set par(justify: true, leading: 0.55em, first-line-indent: 1em)
#set heading(numbering: "1.1")

#show heading.where(level: 1): h => block(sticky: true, above: 1em, below: 0.4em)[
  #set text(weight: 700, size: 11pt, fill: rgb("#0f4c81"))
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 0.8em, below: 0.3em)[
  #set text(weight: 700, size: 9.5pt)
  #h
]
#show heading.where(level: 3): h => block(sticky: true, above: 0.6em, below: 0.2em)[
  #set text(weight: 600, size: 9pt, style: "italic")
  #h
]

#show raw.where(block: false): r => text(
  font: ("Inconsolata", "Liberation Mono", "DejaVu Sans Mono"),
  size: 8.5pt,
  fill: rgb("#0f4c81"),
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f5f7fa"),
  inset: 6pt,
  stroke: 0.3pt + rgb("#0f4c81"),
  text(font: ("Inconsolata", "Liberation Mono", "DejaVu Sans Mono"), size: 8pt, r),
)

#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 5 { 6.5pt } else if cols >= 3 { 7pt } else { 8pt }
    let h-inset = if cols >= 4 { 2pt } else { 4pt }
    let t = table(
      columns: (1fr,) * cols,
      inset: (x: h-inset, y: 2.5pt),
      ..it.children
    )
    block(width: 100%, breakable: true)[
      #set text(size: font-sz, hyphenate: true)
      #set par(justify: false, leading: 0.45em)
      #t
    ]
  } else { it }
}
#set table(inset: (x: 4pt, y: 2.5pt), stroke: 0.3pt + black, align: top + left)

#show link: l => text(fill: rgb("#0f4c81"), l)

#let horizontalrule = [
  #v(0.4em) #line(length: 100%, stroke: 0.3pt + gray) #v(0.4em)
]
#let blockquote(body) = block(
  width: 100%, inset: (left: 10pt, rest: 4pt),
  stroke: (left: 1.5pt + rgb("#0f4c81")),
  text(style: "italic", size: 8.5pt, body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
