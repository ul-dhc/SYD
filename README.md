# SYD – See Your Data

> A guided data explorer for humanities research.

SYD is a planned data exploration and visualisation environment for humanities researchers who want to work with structured research data without programming.

The project combines three parts:

- **SYD Guide** — a methodological conversation guide that helps formulate a research question and recommends suitable methods;
- **SYD Explorer** — a browser-based workspace for preparing, exploring, and visualising data;
- **SYD Library** — a curated library of humanities-oriented methods and visualisation modules.

## Core principles

- Private research data stays in the user's browser.
- SYD Guide cannot access an uploaded dataset.
- Data transformations are transparent, reversible, and approved by the researcher.
- Ambiguity, approximate dates, historical names, and incomplete records are treated as meaningful characteristics of humanities data.
- Public visualisations may use a Google Sheet that its owner has intentionally made publicly accessible.
- The initial service is designed to work without user accounts, server-side dataset storage, or a project database.

## Current status

The project is in its concept and architecture phase. The existing NSRD/Seque visualisation will become the first demonstration project, but the original NSRD repository remains separate and unchanged.

The complete product concept is available in [docs/product-concept.md](docs/product-concept.md).

## Planned public address

`https://dhc.lu.lv/seeyourdata`

## Repository structure

```text
docs/       Product, methodology, and technical documentation
examples/   Demonstration datasets and SYD project configurations
src/        Future application source code
```

The application source and example datasets will be added only after the universal SYD data model and module format have been defined.

## Initial development sequence

1. Define the universal SYD dataset and project model.
2. Define the SYD Library module manifest.
3. Adapt NSRD/Seque as the first example configuration.
4. Validate the model with a second, structurally different humanities dataset.
5. Build guided CSV/TSV import and field mapping.
6. Add public Google Sheets views.
7. Add SYD Guide after the Library contains real, usable modules.
