export const NETWORK_COLOR_KEYS = ["blue", "orange", "green", "magenta", "teal"];
export const CHART_SWATCH_KEYS = ["blue", "orange", "green", "magenta"];

export const VISUALIZATION_PALETTES = {
  archive: {
    label: "Arhīvs",
    colors: { blue: "#114b94", orange: "#c83f00", green: "#2b783f", magenta: "#cf0060", teal: "#02a49f", amber: "#f4a000", cream: "#fce8cd" },
  },
  neon: {
    label: "Neons",
    colors: { blue: "#1e90ff", orange: "#00ff85", green: "#b100ff", magenta: "#ff0099", teal: "#00d9cf", amber: "#00c96c", cream: "#ffffff" },
  },
  autumn: {
    label: "Dzintars",
    colors: { blue: "#9b5c38", orange: "#ff6f61", green: "#b88220", magenta: "#c7472f", teal: "#8b6e3f", amber: "#daa520", cream: "#f5e8d8" },
  },
  pastel: {
    label: "Pastelis",
    colors: { blue: "#86c7cc", orange: "#ffc1cc", green: "#b4cfa4", magenta: "#d49abd", teal: "#9bd8c6", amber: "#b39cd0", cream: "#e4e4e4" },
  },
  vivid: {
    label: "Košums",
    colors: { blue: "#673ab7", orange: "#ff5722", green: "#6a9f28", magenta: "#b51d84", teal: "#008f9c", amber: "#ffcf00", cream: "#f7f7f7" },
  },
};

export function visualizationPalette(id) {
  return VISUALIZATION_PALETTES[id] || VISUALIZATION_PALETTES.archive;
}
