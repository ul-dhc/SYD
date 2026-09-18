# Application source

This directory contains the dependency-free browser application:

- `app.js` handles local CSV, TSV, and XLSX parsing, worksheet selection, editable column profiling, question selection, and visualisation;
- `library.js` contains the first reusable SYD Library module registry and recommendation metadata, including the bipartite network;
- `styles.css` defines the landing page and shared visual language;
- `workspace.css` defines the data workflow and result views.

The source remains independent of NSRD-specific concepts such as people, artefacts, formats, groups, and institutions; those belong in example project configurations.
