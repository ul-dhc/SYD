# SYD – See Your Data

> A guided data explorer for humanities research.

SYD is a planned data exploration and visualisation environment for humanities researchers who want to work with structured research data without programming.

The project combines three parts:

- **SYD Guide** – a methodological conversation guide that helps formulate a research question and recommends suitable methods;
- **SYD Explorer** – a browser-based workspace for preparing, exploring, and visualising data;
- **SYD Library** – a curated library of humanities-oriented methods and visualisation modules.

## Core principles

- Private research data stays in the user's browser.
- SYD Guide cannot access an uploaded dataset.
- Data transformations are transparent, reversible, and approved by the researcher.
- Ambiguity, approximate dates, historical names, and incomplete records are treated as meaningful characteristics of humanities data.
- Public visualisations may use a Google Sheet that its owner has intentionally made publicly accessible.
- The initial service is designed to work without user accounts, server-side dataset storage, or a project database.

## Current status

The first browser-based prototype is implemented. It provides:

- a public SYD landing page;
- local CSV, TSV, and XLSX import with a 5 MB safety limit;
- XLSX worksheet selection or multi-worksheet merging with a source-sheet column, and editable column-type review;
- automatic column type, missing-value, and uniqueness summaries;
- guided selection between category, time, and record-exploration views;
- up to three data-aware SYD Library recommendations with explicit limitations;
- category-frequency, place-frequency, time-distribution, category-comparison, interactive-network, and record-browser modules;
- an NSRD-derived network interaction system with five palettes, two rendering styles, four movement modes, node selection, dragging, panning, zooming, and label controls;
- a synthetic demonstration dataset for trying the workflow.

Imported research data stays in the browser and is not uploaded to SYD or sent to an LLM. The existing NSRD/Seque visualisation remains a separate project and will later become a SYD demonstration configuration.

The public, reader-facing concept is available in [concept.html](concept.html). Its concise source text is kept in [docs/product-concept.md](docs/product-concept.md).

## Planned public address

`https://dhc.lu.lv/seeyourdata`

## Repository structure

```text
docs/       Product, methodology, and technical documentation
examples/   Demonstration datasets and SYD project configurations
src/        Application JavaScript and styles
```

The root `index.html` is intentionally dependency-free so the prototype can be hosted directly with GitHub Pages.

## Initial development sequence

1. Define the universal SYD dataset and project model.
2. Formalise the current SYD Library registry as a reusable module manifest.
3. Adapt NSRD/Seque as the first example configuration.
4. Validate the model with a second, structurally different humanities dataset.
5. Expand guided CSV, TSV, and XLSX import and field mapping.
6. Add public Google Sheets views.
7. Add SYD Guide after the Library contains real, usable modules.
