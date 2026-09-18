const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 10_000;
const MAX_COLUMNS = 100;
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
  visualisationSection: document.querySelector("#visualisation-section"),
  visualTitle: document.querySelector("#visualisation-title"),
  methodNote: document.querySelector("#method-note"),
  fieldControl: document.querySelector("#field-control"),
  fieldSelect: document.querySelector("#field-select"),
  limitControl: document.querySelector("#limit-control"),
  limitSelect: document.querySelector("#limit-select"),
  visualOutput: document.querySelector("#visual-output"),
  interpretation: document.querySelector("#interpretation p"),
  stepperItems: [...document.querySelectorAll(".stepper li")],
};

elements.demoButton?.addEventListener("click", loadDemo);
elements.fileInput?.addEventListener("change", loadFile);
elements.changeData?.addEventListener("click", resetWorkspace);
elements.sheetSelect?.addEventListener("change", () => openXlsxSheet(elements.sheetSelect.value));
elements.columnProfile?.addEventListener("change", updateColumnStructure);
elements.confirmStructure?.addEventListener("click", confirmStructure);
elements.questionOptions?.addEventListener("change", (event) => {
  if (event.target.name !== "question") return;
  state.question = event.target.value;
  configureVisualisation();
});
elements.fieldSelect?.addEventListener("change", renderVisualisation);
elements.limitSelect?.addEventListener("change", renderVisualisation);

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
  elements.sheetSelect.innerHTML = workbook.SheetNames.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  openXlsxSheet(sheetName);
}

function openXlsxSheet(sheetName) {
  try {
    const worksheet = state.workbook?.Sheets[sheetName];
    if (!worksheet) throw new Error("Izvēlēto XLSX darblapu neizdevās nolasīt.");
    const matrix = window.XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    state.sheetName = sheetName;
    openDataset(matrixToDataset(matrix), `${state.workbookName} · ${sheetName}`, { preserveWorkbook: true });
  } catch (error) {
    setStatus(error.message || "Izvēlēto XLSX darblapu neizdevās nolasīt.", true);
  }
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
    Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? "").trim()])),
  );
  return { headers, rows, truncated: matrix.length - 1 > MAX_ROWS };
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
  elements.datasetName.textContent = name;
  elements.sheetControl.hidden = !state.workbook;
  if (state.workbook) elements.sheetSelect.value = state.sheetName;
  elements.sourceGrid.hidden = true;
  elements.analysis.hidden = false;
  elements.questionSection.hidden = true;
  elements.visualisationSection.hidden = true;
  setActiveStep(1);
  renderOverview();
  renderStructure();
  setStatus(dataset.truncated
    ? `Drošības ierobežojuma dēļ parādām pirmos ${MAX_ROWS.toLocaleString("lv-LV")} ierakstus.`
    : `${state.rows.length.toLocaleString("lv-LV")} ieraksti nolasīti lokāli. Pārbaudiet kolonnu tipus, pirms izvēlaties skatu.`);
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
  if (/vieta|pilsēta|valsts|adrese|place|city|country|location/.test(name)) return "vieta";
  if (/persona|autors|vārds|uzvārds|person|author|creator/.test(name)) return "persona";
  if (/^(id|nr\.?|numurs)$|identifikator/.test(name)) return "identifikators";
  const years = values.filter((value) => /^(1[0-9]{3}|20[0-9]{2}|2100)$/.test(value));
  if (years.length / values.length >= 0.8 || /gads|year/.test(name)) return "gads";
  const numbers = values.filter((value) => Number.isFinite(Number(value.replace(",", "."))));
  if (numbers.length / values.length >= 0.8) return "skaitlis";
  const dates = values.filter((value) => /^\d{4}[-/.]\d{1,2}([-/ .]\d{1,2})?$/.test(value));
  if (dates.length / values.length >= 0.8 || /datums|date/.test(name)) return "datums";
  if (values.some((value) => /[;|]/.test(value))) return "vairākas vērtības";
  if (uniqueCount <= Math.max(20, values.length * 0.45)) return "kategorija";
  return "teksts";
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
  if (!elements.questionSection.hidden) configureVisualisation();
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
  elements.visualisationSection.hidden = false;
  configureVisualisation();
  setStatus("Datu struktūra apstiprināta. Tagad izvēlieties pētniecisko jautājumu.");
  elements.questionSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function metricMarkup(value, label) {
  return `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${label}</span></div>`;
}

function configureVisualisation() {
  const config = getQuestionConfig();
  elements.visualTitle.textContent = config.title;
  elements.methodNote.textContent = config.note;
  elements.interpretation.textContent = config.interpretation;
  elements.fieldControl.hidden = config.fields.length === 0;
  elements.limitControl.hidden = state.question === "records";
  elements.fieldSelect.innerHTML = config.fields.map((profile) => `<option value="${escapeHtml(profile.name)}">${escapeHtml(profile.name)} · ${profile.type}</option>`).join("");
  setActiveStep(2);
  renderVisualisation();
}

function getQuestionConfig() {
  const includedProfiles = state.profiles.filter((profile) => profile.included);
  if (state.question === "time") {
    const fields = includedProfiles.filter((profile) => ["gads", "datums", "skaitlis"].includes(profile.type));
    return { title: "Laika sadalījuma skats", note: fields.length ? "Piemērots, lai pamanītu koncentrāciju un pārtraukumus laikā." : "Šajā tabulā SYD neatrada drošu laika lauku.", interpretation: "Ierakstu skaits konkrētā periodā var atspoguļot gan vēsturisku aktivitāti, gan avotu saglabāšanos un datu vākšanas izvēles.", fields };
  }
  if (state.question === "records") return { title: "Ierakstu pārlūks", note: "Piemērots avota ierakstu pārbaudei pirms analīzes.", interpretation: "Tabulas priekšskatījums nemaina avota vērtības. Šajā prototipā tiek parādīti pirmie 50 ieraksti.", fields: [] };
  const categoryPriority = { "kategorija": 0, "vieta": 1, "persona": 1, "vairākas vērtības": 2, "teksts": 3 };
  const fields = includedProfiles
    .filter((profile) => Object.hasOwn(categoryPriority, profile.type))
    .sort((first, second) => categoryPriority[first.type] - categoryPriority[second.type]);
  return { title: "Kategoriju biežuma skats", note: fields.length ? "Piemērots, lai salīdzinātu vienas kolonnas vērtību biežumu." : "Šajā tabulā SYD neatrada kategorisku lauku.", interpretation: "Biežums parāda ierakstu skaitu, nevis parādības nozīmīgumu. Tukšās vērtības tiek parādītas atsevišķi.", fields };
}

function renderVisualisation() {
  if (state.question === "records") return renderRecords();
  const field = elements.fieldSelect.value;
  if (!field) {
    elements.visualOutput.innerHTML = `<div class="empty-state"><p>Šim skatam vajadzīgā tipa kolonna nav atrasta.<br>Izvēlieties citu pētniecisko jautājumu.</p></div>`;
    return;
  }
  const counts = new Map();
  for (const row of state.rows) {
    const raw = String(row[field] ?? "").trim();
    const values = state.question === "categories" && /[;|]/.test(raw) ? raw.split(/[;|]/).map((value) => value.trim()).filter(Boolean) : [raw || "Nav norādīts"];
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  }
  const limit = Number(elements.limitSelect.value);
  const sorted = [...counts.entries()].sort((a, b) => state.question === "time" ? compareTimeValues(a[0], b[0]) : b[1] - a[1] || a[0].localeCompare(b[0], "lv")).slice(0, limit);
  const max = Math.max(...sorted.map(([, count]) => count), 1);
  elements.visualOutput.innerHTML = sorted.length ? `<div class="bar-chart" role="img" aria-label="${escapeHtml(elements.visualTitle.textContent)} kolonnai ${escapeHtml(field)}">${sorted.map(([label, count]) => `<div class="bar-row"><span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${(count / max) * 100}%"></span></span><strong class="bar-value">${count}</strong></div>`).join("")}</div>` : `<div class="empty-state"><p>Šajā kolonnā nav attēlojamu vērtību.</p></div>`;
}

function compareTimeValues(first, second) {
  const firstNumber = Number.parseFloat(first);
  const secondNumber = Number.parseFloat(second);
  return Number.isFinite(firstNumber) && Number.isFinite(secondNumber) ? firstNumber - secondNumber : first.localeCompare(second, "lv", { numeric: true });
}

function renderRecords() {
  const columns = state.profiles.filter((profile) => profile.included).map((profile) => profile.name);
  elements.visualOutput.innerHTML = `<div class="records-wrap"><table class="records-table"><thead><tr>${columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${state.rows.slice(0, 50).map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] || "–")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function resetWorkspace() {
  Object.assign(state, { rows: [], columns: [], profiles: [], name: "", question: "categories", workbook: null, workbookName: "", sheetName: "", structureConfirmed: false });
  elements.analysis.hidden = true;
  elements.questionSection.hidden = true;
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
