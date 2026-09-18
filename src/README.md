# Application source

This directory contains the dependency-free browser application:

- `app.js` handles local CSV, TSV, and XLSX parsing, worksheet selection, editable column profiling, question selection, and visualisation;
- `library.js` contains the first reusable SYD Library module registry and recommendation metadata, including the bipartite network;
- `visualization-data.js` adapts approved table columns to generic records, roles, nodes, edges, and co-occurrence matrices;
- `visualization-state.js` contains the shared filters, selection, layout, palette, style, motion, and viewport state used by every visualisation;
- `network.js` provides the reusable, domain-neutral multilayer network engine with the NSRD force, hierarchical, and bipartite layout principles;
- `styles.css` defines the landing page and shared visual language;
- `workspace.css` defines only the data preparation and question-selection workflow;
- `visualization.css` is the single CSS entrypoint for the isolated NSRD-derived visualization system;
- `visualization-system.css` is its internal module for the three-column workspace, overview, filters, details, and responsive drawers;
- `network.css` is its internal module for network palettes, standard and pencil rendering, and movement modes;
- `visualization-brand.css` applies only SYD surface, text, border, and interface-accent tokens after the shared NSRD-derived modules.

The source remains independent of NSRD-specific concepts such as people, artefacts, formats, groups, and institutions. A dataset adapter maps table columns to visual roles, while example-specific meaning belongs in project configurations.
