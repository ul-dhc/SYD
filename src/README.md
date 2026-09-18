# Application source

This directory contains the dependency-free browser application:

- `app.js` handles local CSV, TSV, and XLSX parsing, worksheet selection, editable column profiling, question selection, and visualisation;
- `library.js` contains the first reusable SYD Library module registry and recommendation metadata, including the bipartite network;
- `visualization-data.js` adapts approved table columns to generic records, roles, nodes, and edges;
- `visualization-state.js` contains the shared filters, selection, layout, palette, style, motion, and viewport state used by every visualisation;
- `network.js` provides the reusable, domain-neutral multilayer network engine with the NSRD force, hierarchical, and bipartite layout principles;
- `styles.css` defines the landing page and shared visual language;
- `workspace.css` defines the data workflow and the NSRD-derived three-column visualization workspace with responsive filter and detail drawers;
- `network.css` defines network palettes, standard and pencil rendering, and movement modes.

The source remains independent of NSRD-specific concepts such as people, artefacts, formats, groups, and institutions. A dataset adapter maps table columns to visual roles, while example-specific meaning belongs in project configurations.
