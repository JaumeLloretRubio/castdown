// castdown — PDF template: minimal.typ
// Limpio, sans-serif, sin header/footer decorativo, margenes amplios.
// Pensado para drafts, lectura comoda, articulos cortos.

#set document(title: "castdown document")
#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2.5cm),
  numbering: "1",
  number-align: center,
)
#set text(font: ("Inter", "Helvetica", "Arial", "DejaVu Sans"), size: 11pt, lang: "es", hyphenate: auto)
#set par(justify: true, leading: 0.7em, first-line-indent: 0pt)
#set heading(numbering: none)

#show heading.where(level: 1): h => block(sticky: true, above: 1.2em, below: 0.6em)[
  #set text(weight: 700, size: 20pt)
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 1em, below: 0.4em)[
  #set text(weight: 600, size: 15pt)
  #h
]
#show heading.where(level: 3): h => block(sticky: true, above: 0.8em, below: 0.3em)[
  #set text(weight: 600, size: 12pt)
  #h
]

#show raw.where(block: false): r => text(
  font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"),
  size: 9.5pt,
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f5f5f5"),
  inset: 10pt,
  radius: 4pt,
  text(font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"), size: 9pt, r),
)

#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 6 { 8pt } else if cols >= 4 { 8.5pt } else { 9.5pt }
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
#set table(
  inset: (x: 6pt, y: 4pt),
  stroke: 0.4pt + rgb("#888"),
  align: top + left,
)

#show link: l => text(fill: rgb("#1a4dad"), l)

// pandoc typst-writer body helpers
#let horizontalrule = [
  #v(0.8em)
  #line(length: 100%, stroke: 0.4pt + rgb("#bbb"))
  #v(0.8em)
]
#let blockquote(body) = block(
  width: 100%,
  inset: (left: 14pt, rest: 6pt),
  stroke: (left: 1.5pt + rgb("#888")),
  text(fill: rgb("#444"), style: "italic", body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
