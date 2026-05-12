// castdown — PDF template: springer-lncs.typ
// Estilo visual Springer Lecture Notes in Computer Science:
// 1 columna, Times 10pt, parrafos justificados con sangria, headings
// numerados en negrita.
//
// NO es llncs.cls. Drafts/previews.

#set document(title: "Springer LNCS-style paper")
#set page(
  paper: "us-letter",
  margin: (x: 3.2cm, top: 2.5cm, bottom: 3cm),
  numbering: "1",
  number-align: center,
)
#set text(
  font: ("Times New Roman", "Liberation Serif", "Nimbus Roman", "New Computer Modern"),
  size: 10pt,
  lang: "en",
  hyphenate: auto,
)
#set par(justify: true, leading: 0.6em, first-line-indent: 1.2em)
#set heading(numbering: "1.1")

#show heading.where(level: 1): h => block(sticky: true, above: 1.2em, below: 0.5em)[
  #set text(weight: 700, size: 12pt)
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 1em, below: 0.4em)[
  #set text(weight: 700, size: 10.5pt)
  #h
]
#show heading.where(level: 3): h => block(sticky: true, above: 0.8em, below: 0.3em)[
  #set text(weight: 700, size: 10pt, style: "italic")
  #h
]

#show raw.where(block: false): r => text(
  font: ("Courier New", "Liberation Mono", "DejaVu Sans Mono"),
  size: 9pt,
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f4f4f4"),
  inset: 8pt,
  stroke: 0.4pt + rgb("#888"),
  text(font: ("Courier New", "Liberation Mono", "DejaVu Sans Mono"), size: 9pt, r),
)

#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 6 { 7.5pt } else if cols >= 4 { 8pt } else { 9pt }
    let h-inset = if cols >= 5 { 3pt } else { 5pt }
    let t = table(
      columns: (1fr,) * cols,
      inset: (x: h-inset, y: 3pt),
      ..it.children
    )
    block(width: 100%, breakable: true)[
      #set text(size: font-sz, hyphenate: true)
      #set par(justify: false, leading: 0.5em)
      #t
    ]
  } else { it }
}
#set table(inset: (x: 5pt, y: 3pt), stroke: 0.4pt + black, align: top + left)

#show link: l => text(fill: rgb("#000088"), l)

#let horizontalrule = [
  #v(0.6em) #line(length: 100%, stroke: 0.3pt + gray) #v(0.6em)
]
#let blockquote(body) = block(
  width: 100%, inset: (left: 14pt, rest: 6pt),
  stroke: (left: 1pt + rgb("#666")),
  text(style: "italic", body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
