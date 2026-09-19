import { SYD_LIBRARY } from "./library.js";
import { renderInteractiveNetwork } from "./network.js?v=19";
import { CHART_SWATCH_KEYS, visualizationPalette } from "./visualization-palettes.js?v=1";
import {
  createBipartiteGraph,
  createCooccurrenceData,
  createMultilayerGraph,
  createVisualizationModel,
  filterVisualizationRecords,
  recordIdsForSelection,
  roleForColumn,
} from "./visualization-data.js?v=10";
import {
  clearVisualizationFilters,
  createVisualizationState,
  initializeVisualizationState,
  reconcileVisualizationState,
  setRoleFilter,
  setVisualizationOption,
  toggleNodeSelection,
  visualizationPreferences,
} from "./visualization-state.js?v=13";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 10_000;
const MAX_COLUMNS = 100;
const ALL_XLSX_SHEETS = "__all__";
const CHART_PREFERENCES_KEY = "syd-chart-preferences";
const DEFAULT_DOCUMENT_TITLE = document.title;
const COLUMN_TYPES = [
  ["teksts", "Teksts"],
  ["kategorija", "Kategorija"],
  ["skaitlis", "Skaitlis"],
  ["gads", "Gads"],
  ["datums", "Datums"],
  ["vieta", "Vieta"],
  ["persona", "Persona"],
  ["identifikators", "Identifikators"],
  ["vairākas vērtības", "Vairākas vērtības"],
  ["tukšs", "Tukšs lauks"],
];
window.lucide?.createIcons();
const savedVisualizationPreferences = readChartPreferences();

const state = {
  rows: [],
  columns: [],
  profiles: [],
  name: "",
  question: "categories",
  workbook: null,
  workbookName: "",
  sheetName: "",
  structureConfirmed: false,
  moduleId: "",
  recommendations: [],
  visualizationModel: null,
  visualization: createVisualizationState(savedVisualizationPreferences),
  focusReturnScroll: 0,
  filtersPanelOpen: true,
  detailsPanelOpen: true,
  resultListExpanded: false,
};

const elements = {
  demoButton: document.querySelector("#load-demo"),
  fileInput: document.querySelector("#file-input"),
  status: document.querySelector("#status-message"),
  sourceGrid: document.querySelector(".source-grid"),
  analysis: document.querySelector("#analysis"),
  datasetName: document.querySelector("#dataset-name"),
  changeData: document.querySelector("#change-data"),
  sheetControl: document.querySelector("#sheet-control"),
  sheetSelect: document.querySelector("#sheet-select"),
  metrics: document.querySelector("#metrics"),
  columnProfile: document.querySelector("#column-profile"),
  structureSummary: document.querySelector("#structure-summary"),
  confirmStructure: document.querySelector("#confirm-structure"),
  questionSection: document.querySelector("#question-section"),
  questionOptions: document.querySelector("#question-options"),
  recommendationSection: document.querySelector("#recommendation-section"),
  visualRecommendations: document.querySelector("#visual-recommendations"),
  visualisationSection: document.querySelector("#visualisation-section"),
  visualTitle: document.querySelector("#visualisation-title"),
  methodNote: document.querySelector("#method-note"),
  fieldControl: document.querySelector("#field-control"),
  fieldSelect: document.querySelector("#field-select"),
  secondFieldControl: document.querySelector("#second-field-control"),
  secondFieldSelect: document.querySelector("#second-field-select"),
  limitControl: document.querySelector("#limit-control"),
  limitSelect: document.querySelector("#limit-select"),
  searchFilter: document.querySelector("#data-search-filter"),
  generatedFilters: document.querySelector("#generated-filters"),
  clearVisualFilters: document.querySelector("#clear-visual-filters"),
  filterSummary: document.querySelector("#filter-summary"),
  filterPanel: document.querySelector(".explorer-filter-panel"),
  detailPanel: document.querySelector("#explorer-detail-panel"),
  detailPanelBody: document.querySelector("#detail-panel-body"),
  panelScrim: document.querySelector("#panel-scrim"),
  toggleFilterPanel: document.querySelector("#toggle-filter-panel"),
  toggleDetailPanel: document.querySelector("#toggle-detail-panel"),
  closeFilterPanel: document.querySelector("#close-filter-panel"),
  closeDetailPanel: document.querySelector("#close-detail-panel"),
  filterCountBadge: document.querySelector("#filter-count-badge"),
  selectionCountBadge: document.querySelector("#selection-count-badge"),
  networkLayerControls: document.querySelector("#network-layer-controls"),
  multiSelectControl: document.querySelector("#multi-select-control"),
  multiSelectToggle: document.querySelector("#multi-select-toggle"),
  workspaceViewSwitcher: document.querySelector("#workspace-view-switcher"),
  workspaceViewButtons: [...document.querySelectorAll("[data-workspace-view]")],
  explorerShell: document.querySelector(".explorer-shell"),
  chartSettingsPanel: document.querySelector("#chart-settings-panel"),
  chartSettingsScrim: document.querySelector("#chart-settings-scrim"),
  openChartSettings: [...document.querySelectorAll("[data-open-chart-settings]")],
  closeChartSettings: document.querySelector("#close-chart-settings"),
  chartTheme: document.querySelector("#chart-theme-select"),
  chartStyle: document.querySelector("#chart-style-select"),
  chartAnimation: document.querySelector("#chart-animation-select"),
  chartMotionButtons: [...document.querySelectorAll("[data-motion-frozen]")],
  chartNodeShapeButtons: [...document.querySelectorAll("[data-node-shape]")],
  chartPaletteButtons: [...document.querySelectorAll("[data-chart-palette]")],
  openVisualisationFocus: document.querySelector("#open-visualisation-focus"),
  closeVisualisationFocus: document.querySelector("#close-visualisation-focus"),
  focusDatasetName: document.querySelector("#focus-dataset-name"),
  focusVisualisationName: document.querySelector("#focus-visualisation-name"),
  visualOutput: document.querySelector("#visual-output"),
  visualControls: document.querySelector("#visual-controls"),
  resultList: document.querySelector("#visual-result-list"),
  interpretation: document.querySelector("#interpretation p"),
  stepperItems: [...document.querySelectorAll(".stepper li")],
};

const compactWorkspaceMedia = window.matchMedia("(max-width: 1100px)");
function syncWorkspaceViewport(event = compactWorkspaceMedia) {
  state.filtersPanelOpen = !event.matches;
  state.detailsPanelOpen = !event.matches;
  renderWorkspacePanels();
}
syncWorkspaceViewport();
compactWorkspaceMedia.addEventListener?.("change", syncWorkspaceViewport);
applyChartPreferences();
window.addEventListener("hashchange", syncVisualisationFocus);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.chartSettingsPanel.hidden) closeChartSettings();
});

elements.demoButton?.addEventListener("click", loadDemo);
elements.fileInput?.addEventListener("change", loadFile);
elements.changeData?.addEventListener("click", resetWorkspace);
elements.sheetSelect?.addEventListener("change", () => openXlsxSelection(elements.sheetSelect.value));
elements.columnProfile?.addEventListener("change", updateColumnStructure);
elements.confirmStructure?.addEventListener("click", confirmStructure);
elements.questionOptions?.addEventListener("change", (event) => {
  if (event.target.name !== "question") return;
  state.question = event.target.value;
  state.moduleId = "";
  configureRecommendations();
});
elements.visualRecommendations?.addEventListener("change", (event) => {
  if (event.target.name !== "visual-module") return;
  state.moduleId = event.target.value;
  configureVisualisation();
});
elements.fieldSelect?.addEventListener("change", renderVisualisation);
elements.secondFieldSelect?.addEventListener("change", renderVisualisation);
elements.limitSelect?.addEventListener("change", renderVisualisation);
elements.searchFilter?.addEventListener("input", () => {
  state.visualization.searchQuery = elements.searchFilter.value;
  renderVisualisation();
});
elements.generatedFilters?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-filter-column]");
  if (!select) return;
  setFilterForColumn(select.dataset.filterColumn, select.value);
  renderVisualisation();
});
elements.clearVisualFilters?.addEventListener("click", clearVisualFilters);
elements.toggleFilterPanel?.addEventListener("click", () => toggleWorkspacePanel("filters"));
elements.toggleDetailPanel?.addEventListener("click", () => toggleWorkspacePanel("details"));
elements.closeFilterPanel?.addEventListener("click", () => setWorkspacePanel("filters", false));
elements.closeDetailPanel?.addEventListener("click", () => setWorkspacePanel("details", false));
elements.panelScrim?.addEventListener("click", closeWorkspacePanels);
elements.workspaceViewSwitcher?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-workspace-view]");
  if (!button) return;
  setVisualizationOption(state.visualization, "view", button.dataset.workspaceView);
  renderVisualisation();
});
elements.chartStyle?.addEventListener("change", () => {
  setVisualizationOption(state.visualization, "style", elements.chartStyle.value);
  saveChartPreferences();
  applyChartPreferences();
  renderVisualisation();
});
elements.chartNodeShapeButtons.forEach((button) => button.addEventListener("click", () => {
  setVisualizationOption(state.visualization, "nodeShapeMode", button.dataset.nodeShape);
  saveChartPreferences();
  applyChartPreferences();
  renderVisualisation();
}));
elements.chartMotionButtons.forEach((button) => button.addEventListener("click", () => {
  state.visualization.motionFrozen = button.dataset.motionFrozen === "true";
  saveChartPreferences();
  applyChartPreferences();
  renderVisualisation();
}));
elements.chartTheme?.addEventListener("change", () => {
  setVisualizationOption(state.visualization, "theme", elements.chartTheme.value);
  saveChartPreferences();
  applyChartPreferences();
  renderVisualisation();
});
elements.chartAnimation?.addEventListener("change", () => {
  setVisualizationOption(state.visualization, "animation", elements.chartAnimation.value);
  saveChartPreferences();
  applyChartPreferences();
  renderVisualisation();
});
elements.chartPaletteButtons.forEach((button) => button.addEventListener("click", () => {
  setVisualizationOption(state.visualization, "palette", button.dataset.chartPalette);
  saveChartPreferences();
  applyChartPreferences();
  renderVisualisation();
}));
elements.openChartSettings.forEach((button) => button.addEventListener("click", openChartSettings));
elements.closeChartSettings?.addEventListener("click", closeChartSettings);
elements.chartSettingsScrim?.addEventListener("click", closeChartSettings);
elements.openVisualisationFocus?.addEventListener("click", openVisualisationFocus);
elements.closeVisualisationFocus?.addEventListener("click", closeVisualisationFocus);
elements.multiSelectToggle?.addEventListener("change", () => {
  state.visualization.multiSelect = elements.multiSelectToggle.checked;
});
elements.detailPanelBody?.addEventListener("click", (event) => {
  const logicButton = event.target.closest("[data-selection-logic]");
  if (logicButton) {
    state.visualization.selectionLogic = logicButton.dataset.selectionLogic;
    renderVisualisation();
    return;
  }
  const removeButton = event.target.closest("[data-remove-node]");
  if (!removeButton) return;
  state.visualization.selectedNodeIds = state.visualization.selectedNodeIds.filter((id) => id !== removeButton.dataset.removeNode);
  renderVisualisation();
});
elements.resultList?.addEventListener("click", (event) => {
  if (event.target.closest("[data-toggle-results]")) {
    state.resultListExpanded = !state.resultListExpanded;
    renderVisualisation();
    return;
  }
  const resultButton = event.target.closest("[data-result-node]");
  if (!resultButton?.dataset.resultNode) return;
  state.visualization.selectionLogic = "any";
  state.visualization.selectedNodeIds = [resultButton.dataset.resultNode];
  renderVisualisation();
});
elements.visualOutput?.addEventListener("click", (event) => {
  const selectedPair = event.target.closest("[data-select-first][data-select-second]");
  if (selectedPair) {
    state.visualization.selectionLogic = "all";
    state.visualization.selectedNodeIds = [selectedPair.dataset.selectFirst, selectedPair.dataset.selectSecond];
    renderVisualisation();
    return;
  }
  const selectedNode = event.target.closest("[data-select-node]");
  if (selectedNode) {
    state.visualization.selectionLogic = "any";
    toggleNodeSelection(state.visualization, selectedNode.dataset.selectNode, event.shiftKey);
    renderVisualisation();
    return;
  }
  if (event.target.closest("[data-clear-selection]")) {
    state.visualization.selectedNodeIds = [];
    renderVisualisation();
    return;
  }
  const target = event.target.closest("[data-filter-field][data-filter-value]");
  if (!target) return;
  setFilterForColumn(target.dataset.filterField, target.dataset.filterValue);
  if (target.dataset.secondFilterField && target.dataset.secondFilterValue) {
    setFilterForColumn(target.dataset.secondFilterField, target.dataset.secondFilterValue);
  }
  renderGeneratedFilters();
  renderVisualisation();
});

async function loadDemo() {
  setStatus("Ielādējam piemēra datu kopu…");
  try {
    const response = await fetch("./examples/cultural-events.csv");
    if (!response.ok) throw new Error("Piemēra fails nav pieejams.");
    openDataset(parseDelimited(await response.text(), ","), "Kultūras notikumu piemērs");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadFile(event) {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    setStatus("Fails ir lielāks par 5 MB. Šajā prototipā izvēlieties mazāku datu kopu.", true);
    event.target.value = "";
    return;
  }
  setStatus(`Nolasām “${file.name}” tikai šajā pārlūkā…`);
  try {
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      await openXlsxDataset(file);
    } else {
      const text = await file.text();
      const delimiter = file.name.toLowerCase().endsWith(".tsv") ? "\t" : detectDelimiter(text);
      openDataset(parseDelimited(text, delimiter), file.name);
    }
  } catch (error) {
    setStatus(error.message || "Failu neizdevās nolasīt.", true);
  } finally {
    event.target.value = "";
  }
}

async function openXlsxDataset(file) {
  if (!window.XLSX) throw new Error("XLSX lasītāju neizdevās ielādēt. Atjaunojiet lapu un mēģiniet vēlreiz.");
  const workbook = window.XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const [sheetName] = workbook.SheetNames;
  if (!sheetName) throw new Error("XLSX failā nav nevienas darblapas.");
  state.workbook = workbook;
  state.workbookName = file.name;
  const combineOption = workbook.SheetNames.length > 1
    ? `<option value="${ALL_XLSX_SHEETS}">Visas darblapas kopā</option>`
    : "";
  elements.sheetSelect.innerHTML = `${workbook.SheetNames.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}${combineOption}`;
  openXlsxSheet(sheetName);
}

function openXlsxSelection(selection) {
  if (selection === ALL_XLSX_SHEETS) openAllXlsxSheets();
  else openXlsxSheet(selection);
}

function openXlsxSheet(sheetName) {
  try {
    const worksheet = state.workbook?.Sheets[sheetName];
    if (!worksheet) throw new Error("Izvēlēto XLSX darblapu neizdevās nolasīt.");
    const matrix = xlsxWorksheetToMatrix(worksheet);
    state.sheetName = sheetName;
    openDataset(matrixToDataset(matrix), `${state.workbookName} · ${sheetName}`, { preserveWorkbook: true });
  } catch (error) {
    setStatus(error.message || "Izvēlēto XLSX darblapu neizdevās nolasīt.", true);
  }
}

function openAllXlsxSheets() {
  try {
    const datasets = [];
    const skippedSheets = [];
    for (const sheetName of state.workbook?.SheetNames || []) {
      const worksheet = state.workbook.Sheets[sheetName];
      const matrix = xlsxWorksheetToMatrix(worksheet);
      if (matrix.length < 2) {
        skippedSheets.push(sheetName);
        continue;
      }
      datasets.push({ sheetName, ...matrixToDataset(matrix) });
    }
    if (!datasets.length) throw new Error("XLSX failā nav apvienojamu datu rindu.");

    const unionHeaders = [];
    for (const dataset of datasets) {
      for (const header of dataset.headers) {
        if (!unionHeaders.includes(header)) unionHeaders.push(header);
      }
    }
    const sourceColumn = uniqueColumnName(unionHeaders, "XLSX darblapa");
    if (unionHeaders.length + 1 > MAX_COLUMNS) {
      throw new Error(`Apvienotajās darblapās ir vairāk nekā ${MAX_COLUMNS} atšķirīgas kolonnas.`);
    }

    const rows = [];
    let truncated = datasets.some((dataset) => dataset.truncated);
    for (const dataset of datasets) {
      for (const row of dataset.rows) {
        if (rows.length >= MAX_ROWS) {
          truncated = true;
          break;
        }
        rows.push(Object.fromEntries([
          [sourceColumn, dataset.sheetName],
          ...unionHeaders.map((header) => [header, row[header] ?? ""]),
        ]));
      }
      if (rows.length >= MAX_ROWS) break;
    }

    state.sheetName = ALL_XLSX_SHEETS;
    openDataset({ headers: [sourceColumn, ...unionHeaders], rows, truncated }, `${state.workbookName} · visas darblapas`, { preserveWorkbook: true });
    const limitNote = truncated ? ` Drošības ierobežojuma dēļ parādīti pirmie ${MAX_ROWS.toLocaleString("lv-LV")} ieraksti.` : "";
    const skippedNote = skippedSheets.length ? ` Izlaistas darblapas bez datu rindām: ${skippedSheets.join(", ")}.` : "";
    setStatus(`${rows.length.toLocaleString("lv-LV")} ieraksti apvienoti no ${datasets.length} darblapām. Kolonna “${sourceColumn}” saglabā katra ieraksta izcelsmi.${limitNote}${skippedNote}`);
  } catch (error) {
    setStatus(error.message || "XLSX darblapas neizdevās apvienot.", true);
  }
}

function uniqueColumnName(headers, preferredName) {
  if (!headers.includes(preferredName)) return preferredName;
  let number = 2;
  while (headers.includes(`${preferredName} (${number})`)) number += 1;
  return `${preferredName} (${number})`;
}

function xlsxWorksheetToMatrix(worksheet) {
  const options = { header: 1, defval: "", blankrows: false };
  const formatted = window.XLSX.utils.sheet_to_json(worksheet, { ...options, raw: false });
  const raw = window.XLSX.utils.sheet_to_json(worksheet, { ...options, raw: true });
  return formatted.map((row, rowIndex) => row.map((value, columnIndex) => {
    const rawValue = raw[rowIndex]?.[columnIndex];
    return rawValue instanceof Date ? rawValue : value;
  }));
}

function detectDelimiter(text) {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] || "";
  const counts = [["\t", (firstLine.match(/\t/g) || []).length], [";", (firstLine.match(/;/g) || []).length], [",", (firstLine.match(/,/g) || []).length]];
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

function parseDelimited(text, delimiter) {
  const cleanText = text.replace(/^\uFEFF/, "");
  const matrix = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < cleanText.length; index += 1) {
    const character = cleanText[index];
    const next = cleanText[index + 1];
    if (character === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === delimiter && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value !== "")) matrix.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (inQuotes) throw new Error("Failā ir neaizvērts pēdiņu lauks.");
  row.push(field.trim());
  if (row.some((value) => value !== "")) matrix.push(row);
  if (matrix.length < 2) throw new Error("Tabulā jābūt virsrakstu rindai un vismaz vienam datu ierakstam.");

  return matrixToDataset(matrix);
}

function matrixToDataset(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 2) throw new Error("Tabulā jābūt virsrakstu rindai un vismaz vienam datu ierakstam.");
  const rawHeaders = matrix[0].map((header, index) => String(header ?? "").trim() || `Kolonna ${index + 1}`);
  if (rawHeaders.length > MAX_COLUMNS) throw new Error(`Šajā prototipā atbalstām ne vairāk kā ${MAX_COLUMNS} kolonnas.`);
  const headers = makeUniqueHeaders(rawHeaders);
  const rows = matrix.slice(1, MAX_ROWS + 1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, cellValueToString(values[index])])),
  );
  return { headers, rows, truncated: matrix.length - 1 > MAX_ROWS };
}

function cellValueToString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (number) => String(number).padStart(2, "0");
    const date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    const hasTime = value.getHours() || value.getMinutes() || value.getSeconds();
    return hasTime ? `${date} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}` : date;
  }
  return String(value ?? "").trim();
}

function makeUniqueHeaders(headers) {
  const counts = new Map();
  return headers.map((header) => {
    const count = (counts.get(header) || 0) + 1;
    counts.set(header, count);
    return count === 1 ? header : `${header} (${count})`;
  });
}

function openDataset(dataset, name, options = {}) {
  if (!options.preserveWorkbook) {
    state.workbook = null;
    state.workbookName = "";
    state.sheetName = "";
  }
  state.rows = dataset.rows;
  state.columns = dataset.headers;
  state.name = name;
  state.profiles = state.columns.map(profileColumn);
  state.structureConfirmed = false;
  state.moduleId = "";
  state.recommendations = [];
  rebuildVisualizationModel(true);
  if (elements.searchFilter) elements.searchFilter.value = "";
  elements.datasetName.textContent = name;
  elements.sheetControl.hidden = !state.workbook;
  if (state.workbook) elements.sheetSelect.value = state.sheetName;
  elements.sourceGrid.hidden = true;
  elements.analysis.hidden = false;
  elements.questionSection.hidden = true;
  elements.recommendationSection.hidden = true;
  elements.visualisationSection.hidden = true;
  setActiveStep(1);
  renderOverview();
  renderStructure();
  setStatus(dataset.truncated
    ? `Drošības ierobežojuma dēļ parādām pirmos ${MAX_ROWS.toLocaleString("lv-LV")} ierakstus.`
    : `${state.rows.length.toLocaleString("lv-LV")} ieraksti nolasīti lokāli. Pārbaudiet kolonnu tipus, pirms izvēlaties vizualizāciju.`);
  elements.analysis.scrollIntoView({ behavior: "smooth", block: "start" });
}

function profileColumn(column) {
  const values = state.rows.map((row) => String(row[column] ?? "").trim());
  const nonEmpty = values.filter(Boolean);
  const unique = new Set(nonEmpty);
  const type = inferType(column, nonEmpty, unique.size);
  return { name: column, type, suggestedType: type, included: type !== "tukšs", missing: values.length - nonEmpty.length, unique: unique.size, samples: [...unique].slice(0, 3) };
}

function inferType(column, values, uniqueCount) {
  if (!values.length) return "tukšs";
  const name = column.toLocaleLowerCase("lv");
  if (/darblapa|worksheet|sheet/.test(name)) return "kategorija";
  if (/vieta|pilsēta|valsts|adrese|place|city|country|location/.test(name)) return "vieta";
  if (/persona|autors|vārds|uzvārds|person|author|creator/.test(name)) return "persona";
  if (/^(id|nr\.?|numurs)$|identifikator/.test(name)) return "identifikators";
  const years = values.filter((value) => /^(1[0-9]{3}|20[0-9]{2}|2100)$/.test(value));
  if (years.length / values.length >= 0.8 || /gads|year/.test(name)) return "gads";
  const numbers = values.filter((value) => Number.isFinite(Number(value.replace(",", "."))));
  if (numbers.length / values.length >= 0.8) return "skaitlis";
  const dates = values.filter(isDateLike);
  if (dates.length / values.length >= 0.8 || /datums|date|datetime|timestamp|published[_ ]?at|created[_ ]?at|updated[_ ]?at/.test(name)) return "datums";
  if (values.some((value) => /[;|]/.test(value))) return "vairākas vērtības";
  if (uniqueCount <= Math.max(5, values.length * 0.45)) return "kategorija";
  return "teksts";
}

function isDateLike(value) {
  const normalized = String(value).trim().replace(/(\d{2,4})[.,]\s+(?=\d{1,2}:\d{2})/, "$1 ");
  const timePattern = "(?:[ T]\\d{1,2}:\\d{2}(?::\\d{2}(?:[.,]\\d{1,6})?)?(?:\\s?(?:Z|UTC|[+-]\\d{2}:?\\d{2}|[AP]M))?)?";
  const yearFirst = normalized.match(new RegExp(`^(\\d{4})[-/. ](\\d{1,2})(?:[-/. ](\\d{1,2}))?${timePattern}$`, "i"));
  if (yearFirst) return isValidDateParts(Number(yearFirst[1]), Number(yearFirst[2]), yearFirst[3] ? Number(yearFirst[3]) : 1);

  const dayFirst = normalized.match(new RegExp(`^(\\d{1,2})[-/. ](\\d{1,2})[-/. ](\\d{2}|\\d{4})${timePattern}$`, "i"));
  if (dayFirst) {
    const year = Number(dayFirst[3].length === 2 ? `20${dayFirst[3]}` : dayFirst[3]);
    const first = Number(dayFirst[1]);
    const second = Number(dayFirst[2]);
    return isValidDateParts(year, second, first) || isValidDateParts(year, first, second);
  }

  const hasYear = /\b(?:1[5-9]\d{2}|20\d{2}|2100)\b/.test(normalized);
  const hasMonthName = /janvār|februār|mart|aprīl|maij|jūnij|jūlij|august|septembr|oktobr|novembr|decembr|january|february|march|april|may|june|july|september|october|november|december/i.test(normalized);
  return hasYear && hasMonthName;
}

function isValidDateParts(year, month, day) {
  if (year < 1500 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function chooseInitialQuestion() {
  const includedProfiles = state.profiles.filter((profile) => profile.included);
  if (includedProfiles.some((profile) => ["kategorija", "vieta", "persona", "vairākas vērtības"].includes(profile.type))) return "categories";
  if (includedProfiles.some((profile) => ["gads", "datums"].includes(profile.type))) return "time";
  return "records";
}

function renderOverview() {
  const missing = state.profiles.reduce((sum, profile) => sum + profile.missing, 0);
  const totalCells = state.rows.length * state.columns.length;
  const timeFields = state.profiles.filter((profile) => profile.included && ["gads", "datums"].includes(profile.type)).length;
  elements.metrics.innerHTML = [metricMarkup(state.rows.length, "ieraksti"), metricMarkup(state.columns.length, "kolonnas"), metricMarkup(totalCells ? `${Math.round((missing / totalCells) * 100)}%` : "0%", "tukšu šūnu"), metricMarkup(timeFields, "laika lauki")].join("");
}

function renderStructure() {
  elements.columnProfile.innerHTML = `<div class="profile-row" aria-hidden="true"><span>Lietot</span><span>Kolonna</span><span>Datu tips</span><span>Tukšs / unikāls</span><span>Piemēri</span></div>${state.profiles.map((profile, index) => structureRowMarkup(profile, index)).join("")}`;
  updateStructureSummary();
}

function structureRowMarkup(profile, index) {
  const options = COLUMN_TYPES.map(([value, label]) => `<option value="${escapeHtml(value)}"${profile.type === value ? " selected" : ""}>${escapeHtml(label)}</option>`).join("");
  return `<div class="profile-row${profile.included ? "" : " is-excluded"}" data-profile-index="${index}"><label class="profile-use"><input type="checkbox" data-profile-action="include"${profile.included ? " checked" : ""} aria-label="Izmantot kolonnu ${escapeHtml(profile.name)}"><span>Jā</span></label><strong>${escapeHtml(profile.name)}</strong><select class="profile-type" data-profile-action="type" aria-label="Kolonnas ${escapeHtml(profile.name)} datu tips"${profile.included ? "" : " disabled"}>${options}</select><span>${profile.missing} / ${profile.unique}</span><span class="profile-sample" title="${escapeHtml(profile.samples.join(", "))}">${escapeHtml(profile.samples.join(" · ") || "–")}</span></div>`;
}

function updateColumnStructure(event) {
  const control = event.target.closest("[data-profile-action]");
  const row = control?.closest("[data-profile-index]");
  if (!control || !row) return;
  const profile = state.profiles[Number(row.dataset.profileIndex)];
  if (!profile) return;

  if (control.dataset.profileAction === "include") {
    profile.included = control.checked;
    row.classList.toggle("is-excluded", !profile.included);
    const typeSelect = row.querySelector("[data-profile-action='type']");
    typeSelect.disabled = !profile.included;
  } else {
    profile.type = control.value;
  }

  state.structureConfirmed = false;
  rebuildVisualizationModel(false);
  updateStructureSummary();
  renderOverview();
  if (!elements.questionSection.hidden) configureRecommendations();
}

function updateStructureSummary() {
  const included = state.profiles.filter((profile) => profile.included);
  const excludedCount = state.profiles.length - included.length;
  const changedCount = state.profiles.filter((profile) => profile.type !== profile.suggestedType).length;
  const parts = [`Analīzē tiks izmantotas ${included.length} no ${state.profiles.length} kolonnām.`];
  if (excludedCount) parts.push(excludedCount === 1 ? "1 kolonna izslēgta." : `${excludedCount} kolonnas izslēgtas.`);
  if (changedCount) parts.push(changedCount === 1 ? "1 tipam veikts labojums." : `${changedCount} tipiem veikti labojumi.`);
  elements.structureSummary.textContent = parts.join(" ");
  elements.confirmStructure.disabled = included.length === 0;
}

function confirmStructure() {
  if (!state.profiles.some((profile) => profile.included)) {
    setStatus("Izvēlieties vismaz vienu kolonnu, ko izmantot analīzē.", true);
    return;
  }
  state.structureConfirmed = true;
  state.question = chooseInitialQuestion();
  document.querySelector(`input[name="question"][value="${state.question}"]`).checked = true;
  elements.questionSection.hidden = false;
  elements.recommendationSection.hidden = false;
  elements.visualisationSection.hidden = false;
  renderGeneratedFilters();
  configureRecommendations();
  setStatus("Datu struktūra apstiprināta. Tagad izvēlieties pētniecisko jautājumu.");
  elements.questionSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function metricMarkup(value, label) {
  return `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${label}</span></div>`;
}

function filterProfiles() {
  const preferredTypes = ["gads", "datums", "kategorija", "vieta", "persona", "vairākas vērtības"];
  return state.profiles
    .filter((profile) => profile.included && preferredTypes.includes(profile.type) && profile.unique > 1 && profile.unique <= 50)
    .sort((first, second) => preferredTypes.indexOf(first.type) - preferredTypes.indexOf(second.type))
    .slice(0, 5);
}

function valuesForProfile(row, profile) {
  const raw = String(row[profile.name] ?? "").trim();
  if (!raw) return ["Nav norādīts"];
  return profile.type === "vairākas vērtības" ? splitValues(raw) : [raw];
}

function rebuildVisualizationModel(reset = false) {
  state.visualizationModel = createVisualizationModel(state.rows, state.profiles);
  if (reset) initializeVisualizationState(state.visualization, state.visualizationModel);
  else reconcileVisualizationState(state.visualization, state.visualizationModel);
}

function setFilterForColumn(column, value) {
  const role = roleForColumn(state.visualizationModel, column);
  if (role) setRoleFilter(state.visualization, role.id, value);
}

function filterValueForColumn(column) {
  const role = roleForColumn(state.visualizationModel, column);
  return role ? state.visualization.filters.get(role.id) : undefined;
}

function renderGeneratedFilters() {
  const profiles = filterProfiles();
  const availableRoleIds = new Set(profiles.map((profile) => roleForColumn(state.visualizationModel, profile.name)?.id).filter(Boolean));
  for (const roleId of state.visualization.filters.keys()) {
    if (!availableRoleIds.has(roleId)) state.visualization.filters.delete(roleId);
  }
  elements.generatedFilters.innerHTML = profiles.map((profile) => {
    const values = [...new Set(state.rows.flatMap((row) => valuesForProfile(row, profile)))];
    values.sort((first, second) => ["gads", "datums"].includes(profile.type)
      ? compareTimeValues(first, second)
      : first.localeCompare(second, "lv", { numeric: true }));
    const selected = filterValueForColumn(profile.name) || "";
    return `<label class="filter-field"><span>${escapeHtml(profile.name)}</span><select data-filter-column="${escapeHtml(profile.name)}" aria-label="${escapeHtml(profile.name)}"><option value="">Visas vērtības</option>${values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></label>`;
  }).join("");
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function getFilteredRows() {
  return filterVisualizationRecords(state.visualizationModel, state.visualization).map((record) => record.sourceRow);
}

function updateFilterSummary(rows) {
  const activeCount = state.visualization.filters.size + (state.visualization.searchQuery.trim() ? 1 : 0);
  elements.filterSummary.textContent = activeCount
    ? `${rows.length.toLocaleString("lv-LV")} no ${state.rows.length.toLocaleString("lv-LV")} ierakstiem · ${activeCount} ${activeCount === 1 ? "filtrs" : "filtri"}`
    : `${state.rows.length.toLocaleString("lv-LV")} ieraksti`;
  elements.clearVisualFilters.disabled = activeCount === 0;
  elements.filterCountBadge.textContent = activeCount;
  elements.filterCountBadge.hidden = activeCount === 0;
}

function toggleWorkspacePanel(panel) {
  const key = panel === "filters" ? "filtersPanelOpen" : "detailsPanelOpen";
  setWorkspacePanel(panel, !state[key]);
}

function setWorkspacePanel(panel, open) {
  if (panel === "filters") {
    state.filtersPanelOpen = open;
    if (open && compactWorkspaceMedia.matches) state.detailsPanelOpen = false;
  } else {
    state.detailsPanelOpen = open;
    if (open && compactWorkspaceMedia.matches) state.filtersPanelOpen = false;
  }
  renderWorkspacePanels();
}

function closeWorkspacePanels() {
  state.filtersPanelOpen = false;
  state.detailsPanelOpen = false;
  renderWorkspacePanels();
}

function renderWorkspacePanels() {
  if (!elements.explorerShell) return;
  elements.explorerShell.classList.toggle("is-filters-collapsed", !state.filtersPanelOpen);
  elements.explorerShell.classList.toggle("is-details-collapsed", !state.detailsPanelOpen);
  elements.toggleFilterPanel.setAttribute("aria-expanded", String(state.filtersPanelOpen));
  elements.toggleDetailPanel.setAttribute("aria-expanded", String(state.detailsPanelOpen));
  elements.toggleFilterPanel.setAttribute("aria-label", state.filtersPanelOpen ? "Paslēpt filtrus" : "Rādīt filtrus");
  elements.toggleDetailPanel.setAttribute("aria-label", state.detailsPanelOpen ? "Paslēpt detaļas" : "Rādīt detaļas");
  elements.toggleFilterPanel.title = state.filtersPanelOpen ? "Paslēpt filtrus" : "Rādīt filtrus";
  elements.toggleDetailPanel.title = state.detailsPanelOpen ? "Paslēpt detaļas" : "Rādīt detaļas";
  elements.panelScrim.hidden = !(compactWorkspaceMedia.matches && (state.filtersPanelOpen || state.detailsPanelOpen));
}

function renderWorkspaceDetails(filteredRecords = filterVisualizationRecords(state.visualizationModel, state.visualization)) {
  if (!elements.detailPanelBody || !state.visualizationModel) return;
  const roleIds = state.visualizationModel.roles.map((role) => role.id);
  const graph = createMultilayerGraph(state.visualizationModel, roleIds, filteredRecords);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const selectedNodes = state.visualization.selectedNodeIds.map((id) => nodeById.get(id)).filter(Boolean);
  const selectedRecordIds = selectedNodes.length
    ? recordIdsForSelection(graph, selectedNodes.map((node) => node.id), state.visualization.selectionLogic)
    : new Set();
  const relatedRecords = selectedNodes.length
    ? filteredRecords.filter((record) => selectedRecordIds.has(record.id))
    : filteredRecords;
  elements.selectionCountBadge.textContent = selectedNodes.length;
  elements.selectionCountBadge.hidden = selectedNodes.length === 0;

  if (!selectedNodes.length) {
    elements.detailPanelBody.innerHTML = `<div class="detail-empty"><i data-lucide="circle-help" aria-hidden="true"></i><h2>Izvēlieties mezglu</h2><p>Klikšķiniet vizualizācijā, lai izgaismotu saites un redzētu atlasīto datu kopsavilkumu.</p><div><i data-lucide="rows-3" aria-hidden="true"></i>Pašlaik filtrā: ${filteredRecords.length.toLocaleString("lv-LV")} ieraksti</div></div>`;
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
    return;
  }

  const paletteColors = { person: "var(--viz-blue)", artifact: "var(--viz-orange)", format: "var(--viz-green)", group: "var(--viz-magenta)", institution: "var(--viz-teal)" };
  elements.detailPanelBody.innerHTML = `<p class="inspector-type">${selectedNodes.length === 1 ? escapeHtml(state.visualizationModel.roleById.get(selectedNodes[0].roleId)?.label || "Vērtība") : `Atlase · ${selectedNodes.length} mezgli`}</p>
    <h2>${selectedNodes.length === 1 ? escapeHtml(selectedNodes[0].label) : "Atlasītie mezgli"}</h2>
    <div class="detail-summary"><div><strong>${selectedNodes.length}</strong><span>atlasīti mezgli</span></div><div><strong>${relatedRecords.length}</strong><span>saistīti ieraksti</span></div></div>
    <section class="detail-selection"><h4>Atlase</h4><div class="selection-chips">${selectedNodes.map((node) => `<button type="button" data-remove-node="${escapeHtml(node.id)}" style="--chip-color:${paletteColors[node.type] || "var(--viz-blue)"}" aria-label="Noņemt ${escapeHtml(node.label)} no atlases"><i></i><span title="${escapeHtml(node.label)}">${escapeHtml(node.label)}</span><i data-lucide="x" aria-hidden="true"></i></button>`).join("")}</div>${selectedNodes.length > 1 ? `<div class="logic-switch" aria-label="Atlases loģika"><button type="button" data-selection-logic="any" aria-pressed="${state.visualization.selectionLogic === "any"}">Jebkurš</button><button type="button" data-selection-logic="all" aria-pressed="${state.visualization.selectionLogic === "all"}">Visi</button></div>` : ""}</section>
    <section class="detail-records"><h4>Saistītie ieraksti</h4>${relatedRecords.slice(0, 8).map(detailRecordMarkup).join("")}${relatedRecords.length > 8 ? `<span class="detail-more">Vēl ${relatedRecords.length - 8} ieraksti</span>` : ""}</section>`;
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function detailRecordMarkup(record) {
  const values = state.visualizationModel.roles
    .flatMap((role) => record.fields[role.id].map((value) => ({ role, value })))
    .filter(({ value }) => value && value !== "Nav norādīts");
  const primary = values[0]?.value || record.id;
  const secondary = values.slice(1, 4).map(({ role, value }) => `${role.label}: ${value}`).join(" · ");
  return `<div class="detail-record"><strong title="${escapeHtml(primary)}">${escapeHtml(primary)}</strong><span>${escapeHtml(secondary || "Papildu dati nav norādīti")}</span></div>`;
}

function renderResultList(records) {
  if (!elements.resultList || !state.visualizationModel) return;
  const model = state.visualizationModel;
  const titleRole = model.roles.find((role) => role.paletteSlot === "artifact") || model.roles[0];
  const timeRole = model.roles.find((role) => ["gads", "datums"].includes(role.valueType));
  const graph = createMultilayerGraph(model, model.roles.map((role) => role.id), records);
  const shown = state.resultListExpanded ? records : records.slice(0, 10);
  elements.resultList.innerHTML = `<div class="result-heading"><p>${state.visualization.selectedNodeIds.length ? "Atlases rezultāti" : "Filtrētie dati"}</p><h3 id="visual-result-title">Ieraksti <span>${records.length.toLocaleString("lv-LV")}</span></h3></div>${shown.length ? `<div class="result-rows">${shown.map((record) => {
    const title = record.fields[titleRole?.id]?.[0] || record.id;
    const node = graph.nodes.find((item) => item.roleId === titleRole?.id && item.label === title);
    const time = timeRole ? record.fields[timeRole.id]?.[0] || "" : "";
    const secondary = model.roles.filter((role) => role.id !== titleRole?.id && role.id !== timeRole?.id).flatMap((role) => record.fields[role.id] || []).filter((value) => value && value !== "Nav norādīts").slice(0, 3).join(" · ");
    const relationCount = model.roles.filter((role) => role.id !== titleRole?.id).reduce((sum, role) => sum + new Set(record.fields[role.id] || []).size, 0);
    return `<button type="button" data-result-node="${escapeHtml(node?.id || "")}"><time>${escapeHtml(time)}</time><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(secondary)}</small></span><em>${relationCount} saites</em><i data-lucide="chevron-right" aria-hidden="true"></i></button>`;
  }).join("")}</div>` : `<p class="no-results">Šai filtru kombinācijai datu nav.</p>`}${records.length > 10 ? `<button type="button" class="more-results more-results-button" data-toggle-results>${state.resultListExpanded ? "Rādīt mazāk" : `Vēl ${records.length - 10}`}</button>` : ""}`;
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function clearVisualFilters() {
  clearVisualizationFilters(state.visualization);
  elements.searchFilter.value = "";
  renderGeneratedFilters();
  renderVisualisation();
}

function readChartPreferences() {
  try { return JSON.parse(localStorage.getItem(CHART_PREFERENCES_KEY) || "{}"); } catch { return {}; }
}

function saveChartPreferences() {
  try {
    localStorage.setItem(CHART_PREFERENCES_KEY, JSON.stringify(visualizationPreferences(state.visualization)));
  } catch { /* Storage may be unavailable in a private browser context. */ }
}

function applyChartPreferences() {
  if (!elements.explorerShell) return;
  const palette = visualizationPalette(state.visualization.palette);
  Object.entries(palette.colors).forEach(([key, value]) => elements.explorerShell.style.setProperty(`--viz-${key}`, value));
  elements.explorerShell.dataset.vizPalette = state.visualization.palette;
  elements.explorerShell.dataset.vizTheme = state.visualization.theme;
  elements.explorerShell.dataset.nodeShape = state.visualization.nodeShapeMode;
  elements.explorerShell.dataset.vizStyle = state.visualization.style;
  elements.explorerShell.dataset.vizAnimation = state.visualization.animation;
  document.body.dataset.sydVisualTheme = state.visualization.theme;
  elements.chartTheme.value = state.visualization.theme;
  elements.chartStyle.value = state.visualization.style;
  elements.chartAnimation.value = state.visualization.animation;
  elements.chartMotionButtons.forEach((button) => button.setAttribute("aria-pressed", String((button.dataset.motionFrozen === "true") === state.visualization.motionFrozen)));
  elements.chartNodeShapeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.nodeShape === state.visualization.nodeShapeMode)));
  elements.chartPaletteButtons.forEach((button) => {
    const active = button.dataset.chartPalette === state.visualization.palette;
    const option = visualizationPalette(button.dataset.chartPalette);
    button.querySelector(".palette-swatches").innerHTML = CHART_SWATCH_KEYS.map((key) => `<i style="--swatch:${option.colors[key]}"></i>`).join("");
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function openChartSettings() {
  elements.chartSettingsPanel.hidden = false;
  elements.chartSettingsScrim.hidden = false;
  elements.openChartSettings.forEach((button) => button.setAttribute("aria-expanded", "true"));
  elements.closeChartSettings?.focus();
}

function closeChartSettings() {
  elements.chartSettingsPanel.hidden = true;
  elements.chartSettingsScrim.hidden = true;
  elements.openChartSettings.forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function configureRecommendations() {
  const includedProfiles = state.profiles.filter((profile) => profile.included);
  state.recommendations = SYD_LIBRARY
    .map((module) => matchLibraryModule(module, includedProfiles))
    .filter(Boolean)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);

  if (!state.recommendations.some((module) => module.id === state.moduleId)) {
    state.moduleId = state.recommendations[0]?.id || "";
  }

  elements.visualRecommendations.innerHTML = state.recommendations.length
    ? state.recommendations.map(recommendationMarkup).join("")
    : `<div class="empty-state"><p>Apstiprinātajai datu struktūrai piemērota vizualizācija nav atrasta.</p></div>`;
  configureVisualisation();
}

function matchLibraryModule(module, profiles) {
  const fields = module.fieldTypes.length
    ? profiles
      .filter((profile) => module.fieldTypes.includes(profile.type))
      .sort((first, second) => module.fieldTypes.indexOf(first.type) - module.fieldTypes.indexOf(second.type))
    : profiles;
  if (["comparison", "network"].includes(module.renderer) && fields.length < 2) return null;
  if (!fields.length) return null;
  const fit = module.renderer === "records"
    ? profiles.length === 1 ? "1 iekļauta kolonna" : `${profiles.length} iekļautas kolonnas`
    : ["comparison", "network"].includes(module.renderer)
      ? `${fields.length} salīdzināmas kolonnas`
      : fields.length === 1 ? "1 piemērota kolonna" : `${fields.length} piemērotas kolonnas`;
  return { ...module, fields, fit, score: module.scores[state.question] || 0 };
}

function recommendationMarkup(module, index) {
  return `<label class="recommendation-card"><input type="radio" name="visual-module" value="${escapeHtml(module.id)}"${module.id === state.moduleId ? " checked" : ""}><span class="recommendation-rank">${index === 0 ? "SYD iesaka" : `Alternatīva ${index}`}</span><strong>${escapeHtml(module.title)}</strong><small>${escapeHtml(module.description)}</small><small class="recommendation-limit"><b>Ierobežojums:</b> ${escapeHtml(module.limitation)}</small><span class="recommendation-fit"><span>Atbilstība:</span> ${escapeHtml(module.fit)}</span></label>`;
}

function configureVisualisation() {
  const config = state.recommendations.find((module) => module.id === state.moduleId);
  if (!config) {
    elements.visualisationSection.hidden = true;
    syncVisualisationFocus();
    return;
  }
  elements.visualisationSection.hidden = false;
  elements.visualTitle.textContent = config.title;
  elements.methodNote.textContent = config.note;
  elements.interpretation.textContent = config.interpretation;
  updateVisualisationIdentity(config);
  if (config.renderer === "network") state.visualization.view = "network";
  if (config.renderer === "overview") state.visualization.view = "overview";
  updateWorkspaceViewSwitcher(config);
  elements.fieldSelect.innerHTML = config.fields.map((profile) => `<option value="${escapeHtml(profile.name)}">${escapeHtml(profile.name)} · ${profile.type}</option>`).join("");
  elements.secondFieldSelect.innerHTML = elements.fieldSelect.innerHTML;
  if (["comparison", "network", "overview"].includes(config.renderer) && config.fields.length > 1) {
    elements.secondFieldSelect.value = config.fields[1].name;
  }
  setActiveStep(2);
  renderVisualisation();
  syncVisualisationFocus();
}

function updateWorkspaceViewSwitcher(config) {
  const supportsWorkspaceViews = ["network", "overview"].includes(config.renderer);
  elements.workspaceViewSwitcher.hidden = !supportsWorkspaceViews;
  elements.workspaceViewButtons.forEach((button) => {
    const active = button.dataset.workspaceView === state.visualization.view;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function visualisationHashId(config) {
  return `viz-${config.hash || config.id}`;
}

function currentVisualisationConfig() {
  return state.recommendations.find((module) => module.id === state.moduleId);
}

function updateVisualisationIdentity(config) {
  elements.explorerShell.id = visualisationHashId(config);
  elements.focusDatasetName.textContent = state.name || "Datu kopa";
  elements.focusVisualisationName.textContent = config.title;
}

function openVisualisationFocus() {
  const config = currentVisualisationConfig();
  if (!config) return;
  state.focusReturnScroll = window.scrollY;
  const hash = `#${visualisationHashId(config)}`;
  if (window.location.hash === hash) syncVisualisationFocus();
  else window.location.hash = hash;
}

function closeVisualisationFocus() {
  const returnScroll = state.focusReturnScroll;
  closeChartSettings();
  history.pushState(null, "", "#workspace");
  syncVisualisationFocus();
  requestAnimationFrame(() => window.scrollTo({ top: returnScroll, behavior: "auto" }));
}

function syncVisualisationFocus() {
  const config = currentVisualisationConfig();
  const activeHash = config ? `#${visualisationHashId(config)}` : "";
  const shouldFocus = Boolean(config && state.rows.length && window.location.hash === activeHash);
  document.body.classList.toggle("visualisation-focus", shouldFocus);
  document.title = shouldFocus ? `${config.title} · ${state.name} · SYD` : DEFAULT_DOCUMENT_TITLE;
  if (shouldFocus) {
    updateVisualisationIdentity(config);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }
}

function renderVisualisation() {
  const config = state.recommendations.find((module) => module.id === state.moduleId);
  if (!config) return;
  const effectiveRenderer = ["network", "overview"].includes(config.renderer) ? state.visualization.view : config.renderer;
  updateWorkspaceViewSwitcher(config);
  elements.interpretation.textContent = effectiveRenderer === "overview"
    ? "Vizualizācijas rāda datu struktūru, biežumu un kopparādīšanos. Šie rādītāji paši par sevi neparāda parādību nozīmīgumu vai cēloņsakarību."
    : config.interpretation;
  elements.fieldControl.hidden = ["records", "overview", "network"].includes(effectiveRenderer);
  elements.secondFieldControl.hidden = effectiveRenderer !== "comparison";
  elements.limitControl.hidden = ["records", "overview", "comparison", "network"].includes(effectiveRenderer);
  elements.visualControls.hidden = ["network", "overview"].includes(effectiveRenderer);
  elements.resultList.hidden = !["network", "overview"].includes(effectiveRenderer);
  elements.multiSelectControl.hidden = effectiveRenderer !== "network";
  elements.multiSelectToggle.checked = state.visualization.multiSelect;
  if (effectiveRenderer !== "network") {
    elements.networkLayerControls.hidden = true;
    elements.networkLayerControls.replaceChildren();
  }
  elements.visualOutput.classList.toggle("network-output", effectiveRenderer === "network");
  const filteredRecords = filterVisualizationRecords(state.visualizationModel, state.visualization);
  const rows = filteredRecords.map((record) => record.sourceRow);
  updateFilterSummary(rows);
  renderWorkspaceDetails(filteredRecords);
  if (["network", "overview"].includes(effectiveRenderer)) renderResultList(recordsForCurrentSelection(filteredRecords));
  if (effectiveRenderer === "overview") return renderDataOverview(recordsForCurrentSelection(filteredRecords));
  if (effectiveRenderer === "records") return renderRecords();
  if (effectiveRenderer === "comparison") return renderComparison();
  if (effectiveRenderer === "network") return renderNetwork();
  const field = elements.fieldSelect.value;
  if (!field) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Šai vizualizācijai vajadzīgā tipa kolonna nav atrasta.<br>Izvēlieties citu pētniecisko jautājumu.</p></div>`;
    return;
  }
  const counts = new Map();
  const profile = state.profiles.find((item) => item.name === field);
  for (const row of rows) {
    const raw = String(row[field] ?? "").trim();
    const values = profile?.type === "vairākas vērtības" ? splitValues(raw) : [raw || "Nav norādīts"];
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  }
  const limit = Number(elements.limitSelect.value);
  const sorted = [...counts.entries()].sort((a, b) => config.renderer === "time" ? compareTimeValues(a[0], b[0]) : b[1] - a[1] || a[0].localeCompare(b[0], "lv")).slice(0, limit);
  const max = Math.max(...sorted.map(([, count]) => count), 1);
  elements.visualOutput.innerHTML = sorted.length ? `<div class="bar-chart" role="img" aria-label="${escapeHtml(elements.visualTitle.textContent)} kolonnai ${escapeHtml(field)}">${sorted.map(([label, count], index) => `<button class="bar-row" type="button" data-filter-field="${escapeHtml(field)}" data-filter-value="${escapeHtml(label)}" aria-pressed="${filterValueForColumn(field) === label}"><span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${(count / max) * 100}%;--animation-index:${index}"></span></span><strong class="bar-value">${count}</strong></button>`).join("")}</div>` : `<div class="empty-state"><p>Šai filtru kombinācijai datu nav.</p></div>`;
}

function recordsForCurrentSelection(filteredRecords) {
  if (!state.visualization.selectedNodeIds.length) return filteredRecords;
  const graph = createMultilayerGraph(state.visualizationModel, state.visualizationModel.roles.map((role) => role.id), filteredRecords);
  const recordIds = recordIdsForSelection(graph, state.visualization.selectedNodeIds, state.visualization.selectionLogic);
  return filteredRecords.filter((record) => recordIds.has(record.id));
}

function renderDataOverview(records) {
  if (!records.length) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Šai filtru kombinācijai datu nav.</p><button class="text-button" type="button" data-clear-dashboard-filters>Notīrīt filtrus</button></div>`;
    elements.visualOutput.querySelector("[data-clear-dashboard-filters]")?.addEventListener("click", clearVisualFilters);
    return;
  }

  const model = state.visualizationModel;
  const graph = createMultilayerGraph(model, model.roles.map((role) => role.id), records);
  const categoricalRoles = model.roles.filter((role) => ["kategorija", "vieta", "persona", "vairākas vērtības", "teksts"].includes(role.valueType));
  const primaryRole = categoricalRoles.find((role) => role.valueType !== "teksts") || categoricalRoles[0] || model.roles[0];
  const secondaryRole = categoricalRoles.find((role) => role.id !== primaryRole?.id && role.valueType !== "teksts") || primaryRole;
  const associationRole = categoricalRoles.find((role) => records.some((record) => new Set(record.fields[role.id]).size > 1)) || categoricalRoles.find((role) => role.multiValue) || secondaryRole;
  const titleRole = model.roles.find((role) => role.valueType === "identifikators") || model.roles.find((role) => role.valueType === "teksts") || model.roles[0];
  const primaryCounts = roleCounts(records, primaryRole).slice(0, 6);
  const secondaryCounts = roleCounts(records, secondaryRole).slice(0, 8);
  const uniquePrimary = new Set(records.flatMap((record) => record.fields[primaryRole?.id] || [])).size;
  const selected = new Set(state.visualization.selectedNodeIds);
  const colors = ["var(--viz-blue)", "var(--viz-orange)", "var(--viz-green)", "var(--viz-magenta)", "var(--viz-teal)", "var(--viz-amber)"];
  const donutTotal = Math.max(1, primaryCounts.reduce((sum, [, count]) => sum + count, 0));
  let donutOffset = 0;
  const barMax = Math.max(1, ...secondaryCounts.map(([, count]) => count));
  const recordCounts = records.map((record) => ({
    record,
    label: record.fields[titleRole?.id]?.[0] || record.id,
    count: model.roles.filter((role) => role.id !== titleRole?.id).reduce((sum, role) => sum + new Set(record.fields[role.id] || []).size, 0),
  })).sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, "lv")).slice(0, 8);
  const recordMax = Math.max(1, ...recordCounts.map(({ count }) => count));
  const surfaceClasses = `nsrd-overview analytics-surface animation-${escapeHtml(state.visualization.animation)} style-${escapeHtml(state.visualization.style)}${selected.size ? " has-selection" : ""}${state.visualization.motionFrozen ? " is-motion-paused" : ""}`;

  elements.visualOutput.innerHTML = `<div class="${surfaceClasses}">
    <div class="overview-summary analytics-summary" aria-label="Datu pārskata kopsavilkums">
      <div><strong>${records.length.toLocaleString("lv-LV")}</strong><span>ieraksti</span></div>
      <div><strong>${uniquePrimary.toLocaleString("lv-LV")}</strong><span>${escapeHtml(primaryRole?.label || "vērtības")}</span></div>
      <div><strong>${selected.size}</strong><span>atlasīti mezgli</span></div>
    </div>
    <div class="overview-grid analytics-grid">
      <section class="overview-chart analytics-chart overview-donut-chart">
        <h4>${escapeHtml(primaryRole ? `${primaryRole.label} · sadalījums` : "Vērtību sadalījums")}</h4>
        ${primaryCounts.length ? `<div class="donut-layout"><div class="overview-donut-svg" role="img" aria-label="${escapeHtml(`${primaryRole.label}: ${donutTotal} vērtības`)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="donut-track" cx="60" cy="60" r="46" pathLength="100"></circle>${primaryCounts.map(([label, count], index) => { const segment = count / donutTotal * 100; const offset = donutOffset; donutOffset += segment; return `<circle class="donut-segment" cx="60" cy="60" r="46" pathLength="100" style="--segment-color:${colors[index % colors.length]};stroke-dasharray:${segment} ${100 - segment};stroke-dashoffset:${-offset};--animation-index:${index}"></circle>`; }).join("")}</svg><div><strong>${donutTotal}</strong><span>vērtības</span></div></div><div class="donut-legend">${primaryCounts.map(([label, count], index) => { const node = graph.nodes.find((item) => item.roleId === primaryRole.id && item.label === label); return `<button type="button" data-select-node="${escapeHtml(node?.id || "")}" aria-pressed="${selected.has(node?.id)}"><i style="--legend-color:${colors[index % colors.length]}"></i><span>${escapeHtml(label)}</span><strong>${count}</strong></button>`; }).join("")}</div></div>` : `<p class="chart-empty">Nav piemērotas kategoriskas kolonnas.</p>`}
      </section>
      <section class="overview-chart analytics-chart overview-bars-chart">
        <h4>${escapeHtml(secondaryRole ? `${secondaryRole.label} · biežākās vērtības` : "Biežākās vērtības")}</h4>
        ${secondaryCounts.length ? `<div class="overview-bars analytics-bars">${secondaryCounts.map(([label, count], index) => { const node = graph.nodes.find((item) => item.roleId === secondaryRole.id && item.label === label); return `<button class="analytics-bar${selected.has(node?.id) ? " is-active" : ""}" type="button" data-select-node="${escapeHtml(node?.id || "")}" aria-pressed="${selected.has(node?.id)}" style="--bar-size:${count / barMax * 100}%;--chart-color:${colors[index % colors.length]};--animation-index:${index}"><span>${escapeHtml(label)}</span><i><b></b></i><strong>${count}</strong></button>`; }).join("")}</div>` : `<p class="chart-empty">Nav otras salīdzināmas kolonnas.</p>`}
      </section>
      <section class="overview-chart analytics-chart artifact-chart overview-columns-chart">
        <h4>Ieraksti pēc saistīto vērtību skaita</h4>
        ${recordCounts.length ? `<div class="overview-columns artifact-columns">${recordCounts.map(({ record, label, count }, index) => { const value = record.fields[titleRole?.id]?.[0]; const node = graph.nodes.find((item) => item.roleId === titleRole?.id && item.label === value); return `<button class="artifact-column${selected.has(node?.id) ? " is-active" : ""}" type="button" data-select-node="${escapeHtml(node?.id || "")}" aria-pressed="${selected.has(node?.id)}" title="${escapeHtml(label)}" style="--bar-size:${Math.max(4, count / recordMax * 100)}%;--chart-color:${colors[index % colors.length]};--animation-index:${index}"><strong>${count}</strong><i><b></b></i><span>${escapeHtml(label)}</span></button>`; }).join("")}</div>` : `<p class="chart-empty">Nav parādāmu ierakstu.</p>`}
      </section>
      ${collaborationMatrixMarkup(records, associationRole, graph, selected)}
    </div>
    <div class="overview-footer analytics-footer"><strong>Pašlaik: ${records.length.toLocaleString("lv-LV")} ieraksti</strong><span>Klikšķiniet uz elementa, lai atlasītu saistītos datus.</span>${selected.size ? `<button type="button" data-clear-selection>Notīrīt atlasi</button>` : ""}</div>
  </div>`;
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function roleCounts(records, role) {
  if (!role) return [];
  const counts = new Map();
  records.forEach((record) => new Set(record.fields[role.id] || []).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)));
  return [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], "lv", { numeric: true }));
}

function collaborationMatrixMarkup(records, role, graph, selected) {
  if (!role) return `<section class="overview-chart analytics-chart matrix-section"><p class="chart-empty">Kopparādīšanās analīzei nav piemērotas datu lomas.</p></section>`;
  const matrix = createCooccurrenceData(state.visualizationModel, role.id, records);
  const rankedValues = matrix.values;
  const { pairCounts, maxPair, topPairs } = matrix;
  const nodeId = (value) => graph.nodes.find((node) => node.roleId === role.id && node.label === value)?.id || "";
  if (!pairCounts.size) return `<section class="overview-chart analytics-chart matrix-section"><div class="matrix-heading"><div><h4>${escapeHtml(`${role.label} · kopparādīšanās`)}</h4><p>Vērtības, kas sastopamas kopā vienā ierakstā.</p></div></div><div class="compact-matrix-empty"><i data-lucide="network" aria-hidden="true"></i><strong>Kopparādīšanās nav atrasta</strong><span>Izvēlētās lomas ierakstos nav vairāku vērtību pāru.</span></div></section>`;
  return `<section class="overview-chart analytics-chart matrix-section"><div class="matrix-heading"><div><h4><span class="desktop-matrix-title">${escapeHtml(`${role.label} · kopparādīšanās matrica`)}</span><span class="mobile-matrix-title">${escapeHtml(`${role.label} · biežākie pāri`)}</span></h4><p>Vērtības, kas sastopamas kopā vienā ierakstā. Kopparādīšanās pati par sevi nepierāda saikni.</p></div><span>${rankedValues.length} vērtības</span></div><div class="mobile-collaboration-list"><h4>Biežākie pāri</h4>${topPairs.map(({ values: [first, second], count }) => { const firstId = nodeId(first); const secondId = nodeId(second); const active = selected.has(firstId) && selected.has(secondId); return `<button type="button" class="${active ? "is-active" : ""}" data-select-first="${escapeHtml(firstId)}" data-select-second="${escapeHtml(secondId)}" aria-pressed="${active}"><span><strong>${escapeHtml(first)}</strong><small>${escapeHtml(second)}</small></span><i><b style="width:${count / maxPair * 100}%"></b></i><em>${count}</em></button>`; }).join("")}</div><div class="matrix-scroll"><div class="collaboration-matrix${rankedValues.length <= 6 ? " is-compact-labels" : ""}" style="--matrix-size:${rankedValues.length}"><span class="matrix-corner"></span>${rankedValues.map((value) => `<button type="button" class="matrix-column-label${selected.has(nodeId(value)) ? " is-active" : ""}" data-select-node="${escapeHtml(nodeId(value))}" aria-pressed="${selected.has(nodeId(value))}"><span>${escapeHtml(value)}</span></button>`).join("")}${rankedValues.map((rowValue, rowIndex) => `<div class="matrix-row"><button type="button" class="matrix-row-label${selected.has(nodeId(rowValue)) ? " is-active" : ""}" data-select-node="${escapeHtml(nodeId(rowValue))}" aria-pressed="${selected.has(nodeId(rowValue))}">${escapeHtml(rowValue)}</button>${rankedValues.map((columnValue, columnIndex) => { const diagonal = rowValue === columnValue; const count = diagonal ? matrix.valueCounts.get(rowValue) || 0 : pairCounts.get([rowValue, columnValue].sort().join("\u0000")) || 0; const active = !diagonal && selected.has(nodeId(rowValue)) && selected.has(nodeId(columnValue)); const sharedLabel = count === 1 ? "1 kopīgs ieraksts" : `${count} kopīgi ieraksti`; return `<button type="button" class="matrix-cell${diagonal ? " is-diagonal" : ""}${active ? " is-active" : ""}" ${diagonal || !count ? "disabled" : `data-select-first="${escapeHtml(nodeId(rowValue))}" data-select-second="${escapeHtml(nodeId(columnValue))}"`} aria-label="${escapeHtml(`${rowValue} un ${columnValue}: ${sharedLabel}`)}" aria-pressed="${active}" style="--cell-strength:${diagonal ? .12 : .12 + count / maxPair * .78};--animation-index:${rowIndex + columnIndex}"><span>${!diagonal && count ? count : ""}</span></button>`; }).join("")}</div>`).join("")}</div></div></section>`;
}

function fieldCounts(rows, profile, chronological = false) {
  const counts = new Map();
  for (const row of rows) {
    for (const value of valuesForProfile(row, profile)) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((first, second) => chronological
    ? compareTimeValues(first[0], second[0])
    : second[1] - first[1] || first[0].localeCompare(second[0], "lv", { numeric: true }));
}

function splitValues(value) {
  const values = value.split(/[;|]/).map((item) => item.trim()).filter(Boolean);
  return values.length ? values : ["Nav norādīts"];
}

function renderComparison() {
  const pairData = buildPairData();
  if (!pairData) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Izvēlieties divas atšķirīgas kolonnas.</p></div>`;
    return;
  }
  const { firstField, secondField, pairs, firstCounts, secondCounts } = pairData;
  const firstValues = [...firstCounts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value]) => value);
  const secondValues = [...secondCounts].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([value]) => value);
  const max = Math.max(...firstValues.flatMap((firstValue) => secondValues.map((secondValue) => pairs.get(`${firstValue}\u0000${secondValue}`) || 0)), 1);
  elements.visualOutput.innerHTML = `<div class="comparison-wrap"><table class="comparison-table"><caption class="visually-hidden">${escapeHtml(firstField)} un ${escapeHtml(secondField)} vērtību kombināciju biežums</caption><thead><tr><th scope="col">${escapeHtml(firstField)} / ${escapeHtml(secondField)}</th>${secondValues.map((value) => `<th scope="col">${escapeHtml(value)}</th>`).join("")}</tr></thead><tbody>${firstValues.map((firstValue) => `<tr><th scope="row">${escapeHtml(firstValue)}</th>${secondValues.map((secondValue) => { const count = pairs.get(`${firstValue}\u0000${secondValue}`) || 0; return `<td style="--intensity:${Math.round((count / max) * 70)}" title="${escapeHtml(`${firstValue} un ${secondValue}: ${count}`)}">${count ? `<button type="button" data-filter-field="${escapeHtml(firstField)}" data-filter-value="${escapeHtml(firstValue)}" data-second-filter-field="${escapeHtml(secondField)}" data-second-filter-value="${escapeHtml(secondValue)}">${count}</button>` : "–"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderNetwork() {
  const firstRole = roleForColumn(state.visualizationModel, elements.fieldSelect.value);
  const secondRole = roleForColumn(state.visualizationModel, elements.secondFieldSelect.value);
  if (!firstRole || !secondRole || firstRole.id === secondRole.id) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Izvēlieties divas atšķirīgas kolonnas.</p></div>`;
    return;
  }
  const roleIds = state.visualizationModel.roles.map((role) => role.id);
  state.visualization.bipartiteRoleIds = [firstRole.id, secondRole.id];
  renderInteractiveNetwork(elements.visualOutput, {
    model: state.visualizationModel,
    records: filterVisualizationRecords(state.visualizationModel, state.visualization),
    roleIds,
    layerControlsHost: elements.networkLayerControls,
  }, state.visualization, () => {
    saveChartPreferences();
    applyChartPreferences();
    const filteredRecords = filterVisualizationRecords(state.visualizationModel, state.visualization);
    renderWorkspaceDetails(filteredRecords);
    renderResultList(recordsForCurrentSelection(filteredRecords));
  });
}

function buildPairData() {
  const firstField = elements.fieldSelect.value;
  const secondField = elements.secondFieldSelect.value;
  if (!firstField || !secondField || firstField === secondField) return null;
  const firstRole = roleForColumn(state.visualizationModel, firstField);
  const secondRole = roleForColumn(state.visualizationModel, secondField);
  if (!firstRole || !secondRole) return null;
  state.visualization.bipartiteRoleIds = [firstRole.id, secondRole.id];
  const records = filterVisualizationRecords(state.visualizationModel, state.visualization);
  const graph = createBipartiteGraph(state.visualizationModel, firstRole.id, secondRole.id, records);
  if (!graph) return null;
  const pairs = new Map();
  const firstCounts = new Map();
  const secondCounts = new Map();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const node of graph.nodes) {
    if (node.roleId === firstRole.id) firstCounts.set(node.label, node.degree);
    if (node.roleId === secondRole.id) secondCounts.set(node.label, node.degree);
  }
  for (const edge of graph.edges) {
    const firstNode = nodeById.get(edge.source);
    const secondNode = nodeById.get(edge.target);
    if (firstNode && secondNode) pairs.set(`${firstNode.label}\u0000${secondNode.label}`, edge.weight);
  }
  return { firstField, secondField, pairs, firstCounts, secondCounts };
}

function compareTimeValues(first, second) {
  const firstNumber = Number.parseFloat(first);
  const secondNumber = Number.parseFloat(second);
  return Number.isFinite(firstNumber) && Number.isFinite(secondNumber) ? firstNumber - secondNumber : first.localeCompare(second, "lv", { numeric: true });
}

function renderRecords() {
  const columns = state.profiles.filter((profile) => profile.included).map((profile) => profile.name);
  const rows = getFilteredRows();
  elements.visualOutput.innerHTML = rows.length ? `<div class="records-wrap"><table class="records-table"><thead><tr>${columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${rows.slice(0, 50).map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] || "–")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><p>Šai filtru kombinācijai datu nav.</p></div>`;
}

function resetWorkspace() {
  history.replaceState(null, "", "#workspace");
  Object.assign(state, { rows: [], columns: [], profiles: [], name: "", question: "categories", workbook: null, workbookName: "", sheetName: "", structureConfirmed: false, moduleId: "", recommendations: [], visualizationModel: null, resultListExpanded: false });
  clearVisualizationFilters(state.visualization);
  state.filtersPanelOpen = !compactWorkspaceMedia.matches;
  state.detailsPanelOpen = !compactWorkspaceMedia.matches;
  renderWorkspacePanels();
  if (elements.searchFilter) elements.searchFilter.value = "";
  if (elements.generatedFilters) elements.generatedFilters.innerHTML = "";
  elements.analysis.hidden = true;
  elements.questionSection.hidden = true;
  elements.recommendationSection.hidden = true;
  elements.visualisationSection.hidden = true;
  elements.sheetControl.hidden = true;
  elements.sourceGrid.hidden = false;
  setStatus("");
  setActiveStep(0);
  syncVisualisationFocus();
  document.querySelector("#workspace-title").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveStep(index) {
  elements.stepperItems.forEach((item, itemIndex) => {
    item.classList.toggle("is-active", itemIndex <= index);
    if (itemIndex === index) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
  });
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#9e2f24" : "";
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
