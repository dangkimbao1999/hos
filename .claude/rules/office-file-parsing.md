# Reading Microsoft Office Files (xlsx/docx/doc)

Recommended libraries for parsing Office files in this repo. Install with
`bun add <package>` (never npm/npx per the tech stack rule).

For **writing/generating** `.docx` or `.xlsx` files (e.g. filling a template
with data, building a document from scratch), see the `office-file-generation`
skill instead — this rule covers reading/extraction only.

## Excel (.xlsx / .xls / .csv)

- **`xlsx` (SheetJS Community Edition)** — default choice. Most popular
  option (~7.8M weekly downloads), actively maintained, reads/writes 20+
  spreadsheet formats (xlsx, xls, ods, csv), works in Node and browser.
  Note: styling/charts/pivots/conditional-formatting on **write** are
  Pro-tier only — irrelevant if you're just reading/extracting data.
- **`exceljs`** — only reach for this if you need streaming reads/writes of
  very large workbooks or need to preserve rich formatting on write. As of
  this writing it has had no meaningful release since Oct 2023 and its own
  maintainers call it inactive — treat as a fallback, not the default, and
  re-check its maintenance status before adopting.

## Word (.docx)

- **`mammoth`** — default choice for `.docx`. Converts Word documents (from
  Word, Google Docs, or LibreOffice) to clean HTML or Markdown, extracting
  content while preserving semantic structure. Widely used and stable.

## Word (.doc — legacy binary, pre-2007)

- **`word-extractor`** — `mammoth` and most modern parsers only handle the
  `.docx` XML format, not the legacy binary `.doc` format. `word-extractor`
  is the practical pure-JS option for reading text out of old `.doc` files.

## Multi-format / format-agnostic extraction

- **`officeparser`** — single API for extracting text/Markdown/HTML from
  `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.odp`, `.pdf`, `.rtf`, and
  more. Useful when you need uniform plain-text extraction across mixed
  Office file types (e.g. a RAG ingestion pipeline) rather than structured
  access to a specific format. Prefer the format-specific library above
  when you need to manipulate structure (cells, styles, paragraphs), not
  just extract text.

## Load this rule when

- Implementing any feature that reads, parses, or extracts data from Excel
  or Word files.
- Choosing a new dependency for Office file I/O.

Load the `office-file-generation` skill instead when the task is to
*produce* or *populate* a `.docx`/`.xlsx` file.

## Skip when

- Working on unrelated code with no Office file I/O involved.
