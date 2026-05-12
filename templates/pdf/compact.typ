// castdown — PDF template: compact.typ
// Denso. Margenes pequeños, leading bajo, tipografia 9pt.
// Pensado para informes tecnicos largos, dossiers, manuales.

#set document(title: "castdown compact")
#set page(
  paper: "a4",
  margin: (x: 1.5cm, top: 1.8cm, bottom: 1.8cm),
  header: context [
    #set text(size: 7pt, fill: gray)
    #grid(
      columns: (1fr, auto),
      align: (left, right),
      [castdown · compact],
      [#counter(page).display("1 / 1", both: true)],
    )
    #v(-4pt)
    #line(length: 100%, stroke: 0.3pt + gray)
  ],
)
#set text(font: ("Inter", "Helvetica", "Arial", "DejaVu Sans"), size: 9pt, lang: "es", hyphenate: auto)
#set par(justify: true, leading: 0.5em)
#set heading(numbering: "1.1")

#show heading.where(level: 1): h => block(sticky: true, above: 0.8em, below: 0.3em)[
  #set text(weight: 800, size: 14pt)
  #h
]
#show heading.where(level: 2): h => block(sticky: true, above: 0.6em, below: 0.25em)[
  #set text(weight: 700, size: 11pt)
  #h
]
#show heading.where(level: 3): h => block(sticky: true, above: 0.5em, below: 0.2em)[
  #set text(weight: 600, size: 10pt, fill: rgb("#444"))
  #h
]

#show raw.where(block: false): r => text(
  font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"),
  size: 8pt,
  r,
)
#show raw.where(block: true): r => block(
  width: 100%,
  fill: rgb("#f0f0f0"),
  inset: 6pt,
  text(font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"), size: 8pt, r),
)

#show figure.where(kind: table): set block(breakable: true)
#show table.cell: set par(linebreaks: "optimized", justify: false)
#show table: it => {
  let cols = it.at("columns", default: auto)
  if type(cols) == int and cols > 0 {
    let font-sz = if cols >= 6 { 6.5pt } else if cols >= 4 { 7pt } else { 8pt }
    let h-inset = if cols >= 5 { 2pt } else { 4pt }
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
#set table(
  inset: (x: 4pt, y: 2.5pt),
  stroke: 0.3pt + black,
  align: top + left,
)

#show link: l => text(fill: rgb("#2f4fbd"), l)

// pandoc typst-writer body helpers
#let horizontalrule = [
  #v(0.4em)
  #line(length: 100%, stroke: 0.3pt + gray)
  #v(0.4em)
]
#let blockquote(body) = block(
  width: 100%,
  inset: (left: 10pt, rest: 4pt),
  stroke: (left: 1.5pt + rgb("#666")),
  text(style: "italic", size: 8.5pt, body),
)
#let strikethrough = body => text(decoration: "line-through", body)
#let smallcaps = body => text(features: ("smcp",), body)
#let highlight = body => box(fill: rgb("#fff59d"), inset: (x: 2pt), body)
#let underline = body => text(decoration: "underline", body)
#let subscript = body => text(features: ("subs",), body)
#let superscript = body => text(features: ("sups",), body)
