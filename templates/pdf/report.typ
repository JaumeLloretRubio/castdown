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
  margin: (x: 2cm, y: 2.4cm),
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
#set text(font: ("JetBrains Mono", "DejaVu Sans Mono", "Courier New"), size: 10pt, lang: "es")
#set par(justify: true, leading: 0.7em)
#set heading(numbering: none)

#show heading.where(level: 1): h => [
  #set text(weight: 800, size: 22pt)
  #v(0.4em) #h #v(0.2em)
  #line(length: 100%, stroke: 2pt + black)
]
#show heading.where(level: 2): h => [
  #set text(weight: 700, size: 14pt)
  #v(0.6em) #h #v(0.1em)
]
#show heading.where(level: 3): h => [
  #set text(weight: 600, size: 12pt, fill: rgb("#ff2e2e"))
  #v(0.4em) #h
]

#show raw.where(block: true): r => [
  #block(
    width: 100%,
    fill: rgb("#ebe7d8"),
    inset: 10pt,
    stroke: 2pt + black,
    radius: 0pt,
    text(font: "JetBrains Mono", size: 9pt, r)
  )
]

#show link: l => underline(text(fill: rgb("#ff2e2e"), l))

// Content is appended after this preamble by pandoc -t typst.
