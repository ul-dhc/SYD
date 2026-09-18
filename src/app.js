import { SYD_LIBRARY } from "./library.js";
import { renderInteractiveNetwork } from "./network.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 10_000;
const MAX_COLUMNS = 100;
const ALL_XLSX_SHEETS = "__all__";
const CHART_PREFERENCES_KEY = "syd-chart-preferences";
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
  searchQuery: "",
  filters: new Map(),
  chartPalette: readChartPreferences().palette || "archive",
  chartStyle: readChartPreferences().style || "standard",
  chartAnimation: readChartPreferences().animation || "none",
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
  explorerShell: document.querySelector(".explorer-shell"),
  chartSettings: document.querySelector("#chart-settings"),
  chartStyle: document.querySelector("#chart-style-select"),
  chartAnimation: document.querySelector("#chart-animation-select"),
  chartPaletteButtons: [...document.querySelectorAll("[data-chart-palette]")],
  visualOutput: document.querySelector("#visual-output"),
  interpretation: document.querySelector("#interpretation p"),
  stepperItems: [...document.querySelectorAll(".stepper li")],
};

const compactFilterMedia = window.matchMedia("(max-width: 900px)");
function syncFilterPanelViewport(event = compactFilterMedia) {
  if (elements.filterPanel) elements.filterPanel.open = !event.matches;
}
syncFilterPanelViewport();
compactFilterMedia.addEventListener?.("change", syncFilterPanelViewport);
applyChartPreferences();

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
  state.searchQuery = elements.searchFilter.value;
  renderVisualisation();
});
elements.generatedFilters?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-filter-column]");
  if (!select) return;
  if (select.value) state.filters.set(select.dataset.filterColumn, select.value);
  else state.filters.delete(select.dataset.filterColumn);
  renderVisualisation();
});
elements.clearVisualFilters?.addEventListener("click", clearVisualFilters);
elements.chartStyle?.addEventListener("change", () => {
  state.chartStyle = elements.chartStyle.value;
  saveChartPreferences();
  applyChartPreferences();
});
elements.chartAnimation?.addEventListener("change", () => {
  state.chartAnimation = elements.chartAnimation.value;
  saveChartPreferences();
  applyChartPreferences();
});
elements.chartPaletteButtons.forEach((button) => button.addEventListener("click", () => {
  state.chartPalette = button.dataset.chartPalette;
  saveChartPreferences();
  applyChartPreferences();
}));
elements.visualOutput?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-filter-field][data-filter-value]");
  if (!target) return;
  state.filters.set(target.dataset.filterField, target.dataset.filterValue);
  if (target.dataset.secondFilterField && target.dataset.secondFilterValue) {
    state.filters.set(target.dataset.secondFilterField, target.dataset.secondFilterValue);
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
  state.searchQuery = "";
  state.filters = new Map();
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

function renderGeneratedFilters() {
  const profiles = filterProfiles();
  const availableNames = new Set(profiles.map((profile) => profile.name));
  for (const column of state.filters.keys()) {
    if (!availableNames.has(column)) state.filters.delete(column);
  }
  elements.generatedFilters.innerHTML = profiles.map((profile) => {
    const values = [...new Set(state.rows.flatMap((row) => valuesForProfile(row, profile)))];
    values.sort((first, second) => ["gads", "datums"].includes(profile.type)
      ? compareTimeValues(first, second)
      : first.localeCompare(second, "lv", { numeric: true }));
    const selected = state.filters.get(profile.name) || "";
    return `<label class="filter-field"><span>${escapeHtml(profile.name)}</span><select data-filter-column="${escapeHtml(profile.name)}" aria-label="${escapeHtml(profile.name)}"><option value="">Visas vērtības</option>${values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></label>`;
  }).join("");
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function getFilteredRows() {
  const query = normalizeFilterText(state.searchQuery);
  const includedColumns = state.profiles.filter((profile) => profile.included).map((profile) => profile.name);
  return state.rows.filter((row) => {
    if (query && !includedColumns.some((column) => normalizeFilterText(row[column]).includes(query))) return false;
    for (const [column, expected] of state.filters) {
      const profile = state.profiles.find((item) => item.name === column);
      if (!profile || !valuesForProfile(row, profile).includes(expected)) return false;
    }
    return true;
  });
}

function normalizeFilterText(value) {
  return String(value ?? "").toLocaleLowerCase("lv-LV").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function updateFilterSummary(rows) {
  const activeCount = state.filters.size + (state.searchQuery.trim() ? 1 : 0);
  elements.filterSummary.textContent = activeCount
    ? `${rows.length.toLocaleString("lv-LV")} no ${state.rows.length.toLocaleString("lv-LV")} ierakstiem · ${activeCount} ${activeCount === 1 ? "filtrs" : "filtri"}`
    : `${state.rows.length.toLocaleString("lv-LV")} ieraksti`;
  elements.clearVisualFilters.disabled = activeCount === 0;
}

function clearVisualFilters() {
  state.searchQuery = "";
  state.filters.clear();
  elements.searchFilter.value = "";
  renderGeneratedFilters();
  renderVisualisation();
}

function readChartPreferences() {
  try { return JSON.parse(localStorage.getItem(CHART_PREFERENCES_KEY) || "{}"); } catch { return {}; }
}

function saveChartPreferences() {
  try {
    localStorage.setItem(CHART_PREFERENCES_KEY, JSON.stringify({ palette: state.chartPalette, style: state.chartStyle, animation: state.chartAnimation }));
  } catch { /* Storage may be unavailable in a private browser context. */ }
}

function applyChartPreferences() {
  if (!elements.explorerShell) return;
  elements.explorerShell.dataset.vizPalette = state.chartPalette;
  elements.explorerShell.dataset.vizStyle = state.chartStyle;
  elements.explorerShell.dataset.vizAnimation = state.chartAnimation;
  elements.chartStyle.value = state.chartStyle;
  elements.chartAnimation.value = state.chartAnimation;
  elements.chartPaletteButtons.forEach((button) => {
    const active = button.dataset.chartPalette === state.chartPalette;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
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
    return;
  }
  elements.visualisationSection.hidden = false;
  elements.visualTitle.textContent = config.title;
  elements.methodNote.textContent = config.note;
  elements.interpretation.textContent = config.interpretation;
  elements.chartSettings.hidden = ["network", "records"].includes(config.renderer);
  elements.fieldControl.hidden = ["records", "overview"].includes(config.renderer);
  elements.secondFieldControl.hidden = !["comparison", "network"].includes(config.renderer);
  elements.limitControl.hidden = ["records", "overview", "comparison", "network"].includes(config.renderer);
  elements.fieldSelect.innerHTML = config.fields.map((profile) => `<option value="${escapeHtml(profile.name)}">${escapeHtml(profile.name)} · ${profile.type}</option>`).join("");
  elements.secondFieldSelect.innerHTML = elements.fieldSelect.innerHTML;
  if (["comparison", "network"].includes(config.renderer) && config.fields.length > 1) {
    elements.secondFieldSelect.value = config.fields[1].name;
  }
  setActiveStep(2);
  renderVisualisation();
}

function renderVisualisation() {
  const config = state.recommendations.find((module) => module.id === state.moduleId);
  if (!config) return;
  const rows = getFilteredRows();
  updateFilterSummary(rows);
  if (config.renderer === "overview") return renderDataOverview(rows);
  if (config.renderer === "records") return renderRecords();
  if (config.renderer === "comparison") return renderComparison();
  if (config.renderer === "network") return renderNetwork();
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
  elements.visualOutput.innerHTML = sorted.length ? `<div class="bar-chart" role="img" aria-label="${escapeHtml(elements.visualTitle.textContent)} kolonnai ${escapeHtml(field)}">${sorted.map(([label, count], index) => `<button class="bar-row" type="button" data-filter-field="${escapeHtml(field)}" data-filter-value="${escapeHtml(label)}" aria-pressed="${state.filters.get(field) === label}"><span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${(count / max) * 100}%;--chart-index:${index}"></span></span><strong class="bar-value">${count}</strong></button>`).join("")}</div>` : `<div class="empty-state"><p>Šai filtru kombinācijai datu nav.</p></div>`;
}

function renderDataOverview(rows) {
  if (!rows.length) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Šai filtru kombinācijai datu nav.</p><button class="text-button" type="button" data-clear-dashboard-filters>Notīrīt filtrus</button></div>`;
    elements.visualOutput.querySelector("[data-clear-dashboard-filters]")?.addEventListener("click", clearVisualFilters);
    return;
  }

  const categoricalProfiles = state.profiles.filter((profile) => profile.included && ["kategorija", "vieta", "persona", "vairākas vērtības"].includes(profile.type));
  const timeProfile = state.profiles.find((profile) => profile.included && ["gads", "datums"].includes(profile.type));
  const donutProfile = categoricalProfiles[0];
  const barsProfile = categoricalProfiles.find((profile) => profile.name !== donutProfile?.name) || donutProfile;
  const columnProfile = timeProfile || categoricalProfiles.find((profile) => ![donutProfile?.name, barsProfile?.name].includes(profile.name));
  const uniqueEntities = donutProfile ? new Set(rows.flatMap((row) => valuesForProfile(row, donutProfile))).size : 0;
  const activeFilters = state.filters.size + (state.searchQuery.trim() ? 1 : 0);
  const colors = ["var(--viz-blue)", "var(--viz-orange)", "var(--viz-green)", "var(--viz-magenta)", "var(--viz-teal)", "var(--viz-amber)"];
  const donutCounts = donutProfile ? fieldCounts(rows, donutProfile).slice(0, 6) : [];
  const donutTotal = Math.max(1, donutCounts.reduce((sum, [, count]) => sum + count, 0));
  let donutOffset = 0;
  const donutStops = donutCounts.map(([, count], index) => {
    const start = donutOffset;
    donutOffset += count / donutTotal * 100;
    return `${colors[index % colors.length]} ${start}% ${donutOffset}%`;
  }).join(", ");
  const barCounts = barsProfile ? fieldCounts(rows, barsProfile).slice(0, 8) : [];
  const barMax = Math.max(1, ...barCounts.map(([, count]) => count));
  const columnCounts = columnProfile ? fieldCounts(rows, columnProfile, ["gads", "datums"].includes(columnProfile.type)).slice(0, 12) : [];
  const columnMax = Math.max(1, ...columnCounts.map(([, count]) => count));

  elements.visualOutput.innerHTML = `<div class="nsrd-overview">
    <div class="overview-summary" aria-label="Datu pārskata kopsavilkums">
      <div><strong>${rows.length.toLocaleString("lv-LV")}</strong><span>ieraksti</span></div>
      <div><strong>${uniqueEntities.toLocaleString("lv-LV")}</strong><span>${escapeHtml(donutProfile?.name || "vērtības")}</span></div>
      <div><strong>${activeFilters}</strong><span>aktīvi filtri</span></div>
    </div>
    <div class="overview-grid">
      <section class="overview-chart overview-donut-chart">
        <h4>${escapeHtml(donutProfile ? `${donutProfile.name} · sadalījums` : "Vērtību sadalījums")}</h4>
        ${donutCounts.length ? `<div class="donut-layout"><div class="overview-donut" style="--donut:${donutStops}"><div><strong>${donutTotal}</strong><span>vērtības</span></div></div><div class="donut-legend">${donutCounts.map(([label, count], index) => `<button type="button" data-filter-field="${escapeHtml(donutProfile.name)}" data-filter-value="${escapeHtml(label)}" aria-pressed="${state.filters.get(donutProfile.name) === label}"><i style="--legend-color:${colors[index % colors.length]}"></i><span>${escapeHtml(label)}</span><strong>${count}</strong></button>`).join("")}</div></div>` : `<p class="chart-empty">Nav piemērotas kategoriskas kolonnas.</p>`}
      </section>
      <section class="overview-chart overview-bars-chart">
        <h4>${escapeHtml(barsProfile ? `${barsProfile.name} · biežākās vērtības` : "Biežākās vērtības")}</h4>
        ${barCounts.length ? `<div class="overview-bars">${barCounts.map(([label, count], index) => `<button type="button" data-filter-field="${escapeHtml(barsProfile.name)}" data-filter-value="${escapeHtml(label)}" aria-pressed="${state.filters.get(barsProfile.name) === label}" style="--bar-size:${count / barMax * 100}%;--chart-color:${colors[index % colors.length]}"><span>${escapeHtml(label)}</span><i><b></b></i><strong>${count}</strong></button>`).join("")}</div>` : `<p class="chart-empty">Nav otras salīdzināmas kolonnas.</p>`}
      </section>
      <section class="overview-chart overview-columns-chart">
        <h4>${escapeHtml(columnProfile ? `${columnProfile.name} · sadalījums` : "Ierakstu sadalījums")}</h4>
        ${columnCounts.length ? `<div class="overview-columns">${columnCounts.map(([label, count], index) => `<button type="button" data-filter-field="${escapeHtml(columnProfile.name)}" data-filter-value="${escapeHtml(label)}" aria-pressed="${state.filters.get(columnProfile.name) === label}" style="--bar-size:${Math.max(4, count / columnMax * 100)}%;--chart-color:${colors[index % colors.length]}"><strong>${count}</strong><i><b></b></i><span>${escapeHtml(label)}</span></button>`).join("")}</div>` : `<p class="chart-empty">Nav piemērotas laika vai kategoriskas kolonnas.</p>`}
      </section>
    </div>
    <div class="overview-footer"><strong>${rows.length.toLocaleString("lv-LV")} ieraksti</strong><span>Klikšķiniet uz diagrammas elementa, lai filtrētu visu pārskatu.</span>${activeFilters ? `<button type="button" data-clear-dashboard-filters>Notīrīt atlasi</button>` : ""}</div>
  </div>`;
  elements.visualOutput.querySelector("[data-clear-dashboard-filters]")?.addEventListener("click", clearVisualFilters);
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
  const pairData = buildPairData();
  if (!pairData) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Izvēlieties divas atšķirīgas kolonnas.</p></div>`;
    return;
  }
  const { firstField, secondField, pairs, firstCounts, secondCounts } = pairData;
  const firstEntries = [...firstCounts].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const secondEntries = [...secondCounts].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const firstValues = new Set(firstEntries.map(([value]) => value));
  const secondValues = new Set(secondEntries.map(([value]) => value));
  const links = [...pairs]
    .map(([key, count]) => {
      const [firstValue, secondValue] = key.split("\u0000");
      return { firstValue, secondValue, count };
    })
    .filter((link) => firstValues.has(link.firstValue) && secondValues.has(link.secondValue));
  renderInteractiveNetwork(elements.visualOutput, {
    firstField,
    secondField,
    firstEntries,
    secondEntries,
    links,
  });
}

function buildPairData() {
  const firstField = elements.fieldSelect.value;
  const secondField = elements.secondFieldSelect.value;
  if (!firstField || !secondField || firstField === secondField) return null;
  const firstProfile = state.profiles.find((profile) => profile.name === firstField);
  const secondProfile = state.profiles.find((profile) => profile.name === secondField);
  const pairs = new Map();
  const firstCounts = new Map();
  const secondCounts = new Map();

  for (const row of getFilteredRows()) {
    const firstRaw = String(row[firstField] ?? "").trim();
    const secondRaw = String(row[secondField] ?? "").trim();
    const firstValues = firstProfile?.type === "vairākas vērtības" ? splitValues(firstRaw) : [firstRaw || "Nav norādīts"];
    const secondValues = secondProfile?.type === "vairākas vērtības" ? splitValues(secondRaw) : [secondRaw || "Nav norādīts"];
    for (const firstValue of firstValues) {
      firstCounts.set(firstValue, (firstCounts.get(firstValue) || 0) + 1);
      for (const secondValue of secondValues) {
        const key = `${firstValue}\u0000${secondValue}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
    for (const secondValue of secondValues) secondCounts.set(secondValue, (secondCounts.get(secondValue) || 0) + 1);
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
  Object.assign(state, { rows: [], columns: [], profiles: [], name: "", question: "categories", workbook: null, workbookName: "", sheetName: "", structureConfirmed: false, moduleId: "", recommendations: [], searchQuery: "", filters: new Map() });
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
