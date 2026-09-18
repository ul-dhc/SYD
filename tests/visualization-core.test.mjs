import test from "node:test";
import assert from "node:assert/strict";
import {
  createBipartiteGraph,
  createCooccurrenceData,
  createMultilayerGraph,
  createVisualizationModel,
  filterVisualizationRecords,
  recordIdsForSelection,
  roleForColumn,
} from "../src/visualization-data.js";
import {
  clearVisualizationFilters,
  createVisualizationState,
  initializeVisualizationState,
  reconcileVisualizationState,
  setRoleFilter,
  setVisualizationOption,
  toggleNodeSelection,
} from "../src/visualization-state.js";
import { NETWORK_COLOR_KEYS, VISUALIZATION_PALETTES } from "../src/visualization-palettes.js";

const rows = [
  { ID: "A-1", Persona: "Anna", Kategorija: "Mūzika; Lasījums", Vieta: "Rīga" },
  { ID: "A-2", Persona: "Anna", Kategorija: "Mūzika", Vieta: "Cēsis" },
  { ID: "A-3", Persona: "Jānis", Kategorija: "Lasījums", Vieta: "Rīga" },
];

const profiles = [
  { name: "ID", type: "identifikators", included: true },
  { name: "Persona", type: "persona", included: true },
  { name: "Kategorija", type: "vairākas vērtības", included: true },
  { name: "Vieta", type: "vieta", included: true },
];

test("NSRD paletes izmanto vienu kopīgu krāsu avotu", () => {
  assert.deepEqual(Object.keys(VISUALIZATION_PALETTES), ["archive", "neon", "autumn", "pastel", "vivid"]);
  assert.deepEqual(NETWORK_COLOR_KEYS.map((key) => VISUALIZATION_PALETTES.neon.colors[key]), ["#1e90ff", "#00ff85", "#b100ff", "#ff0099", "#00d9cf"]);
  assert.equal(VISUALIZATION_PALETTES.autumn.colors.blue, "#9b5c38");
  assert.equal(VISUALIZATION_PALETTES.pastel.colors.green, "#b4cfa4");
  assert.equal(VISUALIZATION_PALETTES.vivid.colors.amber, "#ffcf00");
});

test("adapteris izveido lomas un stabilus ierakstu identifikatorus", () => {
  const model = createVisualizationModel(rows, profiles);
  assert.equal(model.roles.length, 4);
  assert.deepEqual(model.records.map((record) => record.id), ["record:A-1", "record:A-2", "record:A-3"]);
  assert.equal(roleForColumn(model, "Persona").shape, "circle");
  assert.equal(roleForColumn(model, "Kategorija").multiValue, true);
  assert.deepEqual(model.records[0].fields[roleForColumn(model, "Kategorija").id], ["Mūzika", "Lasījums"]);
});

test("adapteris kartē kolonnu tipus uz piecām NSRD mezglu formām", () => {
  const shapeProfiles = [
    { name: "Artefakts", type: "identifikators", included: true },
    { name: "Persona", type: "persona", included: true },
    { name: "Formāts", type: "kategorija", included: true },
    { name: "Grupa", type: "vairākas vērtības", included: true },
    { name: "Institūcija", type: "vieta", included: true },
  ];
  const model = createVisualizationModel([{ Artefakts: "A", Persona: "P", Formāts: "F", Grupa: "G", Institūcija: "I" }], shapeProfiles);
  assert.deepEqual(model.roles.map((role) => role.paletteSlot), ["artifact", "person", "format", "group", "institution"]);
  assert.deepEqual(model.roles.map((role) => role.shape), ["diamond", "circle", "rounded-square", "triangle", "hexagon"]);
});

test("kopīgie filtri darbojas pēc lomas un meklēšana neņem vērā diakritiskās zīmes", () => {
  const model = createVisualizationModel(rows, profiles);
  const state = initializeVisualizationState(createVisualizationState(), model);
  const placeRole = roleForColumn(model, "Vieta");
  setRoleFilter(state, placeRole.id, "Rīga");
  assert.deepEqual(filterVisualizationRecords(model, state).map((record) => record.id), ["record:A-1", "record:A-3"]);
  state.searchQuery = "janis";
  assert.deepEqual(filterVisualizationRecords(model, state).map((record) => record.id), ["record:A-3"]);
  clearVisualizationFilters(state);
  assert.equal(filterVisualizationRecords(model, state).length, 3);
});

test("divdaļīgais grafiks saglabā mezglu, saišu un avota ierakstu sasaisti", () => {
  const model = createVisualizationModel(rows, profiles);
  const personRole = roleForColumn(model, "Persona");
  const categoryRole = roleForColumn(model, "Kategorija");
  const graph = createBipartiteGraph(model, personRole.id, categoryRole.id);
  const anna = graph.nodes.find((node) => node.label === "Anna");
  const music = graph.nodes.find((node) => node.label === "Mūzika");
  const edge = graph.edges.find((item) => item.source === anna.id && item.target === music.id);
  assert.equal(anna.degree, 3);
  assert.equal(edge.weight, 2);
  assert.deepEqual(edge.recordIds, ["record:A-1", "record:A-2"]);
});

test("daudzslāņu grafiks un jebkurš vai visi atlase atgriež pareizos ierakstus", () => {
  const model = createVisualizationModel(rows, profiles);
  const roleIds = ["Persona", "Kategorija", "Vieta"].map((column) => roleForColumn(model, column).id);
  const graph = createMultilayerGraph(model, roleIds);
  const anna = graph.nodes.find((node) => node.label === "Anna");
  const riga = graph.nodes.find((node) => node.label === "Rīga");
  assert.deepEqual([...recordIdsForSelection(graph, [anna.id, riga.id], "all")], ["record:A-1"]);
  assert.deepEqual([...recordIdsForSelection(graph, [anna.id, riga.id], "any")].sort(), ["record:A-1", "record:A-2", "record:A-3"]);
});

test("kopparādīšanās matrica skaita vienā ierakstā sastopamus vērtību pārus", () => {
  const model = createVisualizationModel(rows, profiles);
  const categoryRole = roleForColumn(model, "Kategorija");
  const matrix = createCooccurrenceData(model, categoryRole.id);
  assert.deepEqual(matrix.values, ["Lasījums", "Mūzika"]);
  assert.equal(matrix.valueCounts.get("Mūzika"), 2);
  assert.equal(matrix.valueCounts.get("Lasījums"), 2);
  assert.equal(matrix.pairCounts.get("Lasījums\u0000Mūzika"), 1);
  assert.deepEqual(matrix.topPairs, [{ values: ["Lasījums", "Mūzika"], count: 1 }]);
});

test("vienotais stāvoklis pārbauda izvēles un pielāgojas lomu izmaiņām", () => {
  const model = createVisualizationModel(rows, profiles);
  const state = initializeVisualizationState(createVisualizationState({ palette: "pastel" }), model);
  setVisualizationOption(state, "layout", "bipartite");
  toggleNodeSelection(state, "node:a");
  toggleNodeSelection(state, "node:b", true);
  assert.deepEqual(state.selectedNodeIds, ["node:a", "node:b"]);
  assert.equal(state.palette, "pastel");
  assert.throws(() => setVisualizationOption(state, "layout", "aplis"));

  const reducedModel = createVisualizationModel(rows, profiles.map((profile) => ({ ...profile, included: profile.name !== "Vieta" })));
  reconcileVisualizationState(state, reducedModel);
  assert.equal(state.visibleRoleIds.has(roleForColumn(model, "Vieta").id), false);
  assert.deepEqual(state.selectedNodeIds, []);
});
