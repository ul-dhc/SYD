const VALID_VALUES = {
  view: new Set(["network", "overview"]),
  selectionLogic: new Set(["any", "all"]),
  layout: new Set(["force", "hierarchical", "bipartite"]),
  palette: new Set(["archive", "neon", "autumn", "pastel", "vivid"]),
  theme: new Set(["light", "dark"]),
  nodeShapeMode: new Set(["distinct", "circles"]),
  style: new Set(["standard", "pencil"]),
  animation: new Set(["none", "rain", "echo", "wave"]),
  labelMode: new Set(["active", "all", "none"]),
  labelScale: new Set([1, 1.25, 1.5]),
};

export function createVisualizationState(initial = {}) {
  return {
    searchQuery: "",
    filters: new Map(),
    selectedNodeIds: [],
    selectionLogic: "any",
    visibleRoleIds: new Set(),
    layout: "force",
    bipartiteRoleIds: [null, null],
    view: "network",
    palette: "archive",
    theme: "light",
    nodeShapeMode: "distinct",
    style: "standard",
    animation: "none",
    motionFrozen: false,
    multiSelect: false,
    labelMode: "active",
    labelScale: 1,
    nodeScale: 1,
    zoom: 1,
    pan: { x: 0, y: 0 },
    manualPositions: new Map(),
    ...validInitialState(initial),
  };
}

export function initializeVisualizationState(state, model) {
  const roleIds = model.roles.map((role) => role.id);
  state.searchQuery = "";
  state.filters = new Map();
  state.selectedNodeIds = [];
  state.selectionLogic = "any";
  state.visibleRoleIds = new Set(roleIds);
  state.bipartiteRoleIds = [roleIds[0] || null, roleIds[1] || null];
  state.layout = "force";
  state.view = "network";
  state.motionFrozen = false;
  state.multiSelect = false;
  state.zoom = 1;
  state.pan = { x: 0, y: 0 };
  state.manualPositions = new Map();
  return state;
}

export function reconcileVisualizationState(state, model) {
  const available = new Set(model.roles.map((role) => role.id));
  state.visibleRoleIds = new Set([...state.visibleRoleIds].filter((id) => available.has(id)));
  if (!state.visibleRoleIds.size) state.visibleRoleIds = new Set(available);
  state.filters = new Map([...state.filters].filter(([id]) => available.has(id)));
  state.selectedNodeIds = [];
  state.manualPositions = new Map();

  const [first, second] = state.bipartiteRoleIds;
  const visible = [...state.visibleRoleIds];
  const nextFirst = available.has(first) ? first : visible[0] || null;
  state.bipartiteRoleIds = [
    nextFirst,
    available.has(second) && second !== nextFirst ? second : visible.find((id) => id !== nextFirst) || null,
  ];
  return state;
}

export function setVisualizationOption(state, key, value) {
  const allowed = VALID_VALUES[key];
  if (!allowed?.has(value)) throw new Error(`Neatbalstīta vizualizācijas izvēle: ${key}=${value}`);
  state[key] = value;
  return state;
}

export function setRoleFilter(state, roleId, value) {
  if (value) state.filters.set(roleId, value);
  else state.filters.delete(roleId);
  state.selectedNodeIds = [];
  return state;
}

export function clearVisualizationFilters(state) {
  state.searchQuery = "";
  state.filters.clear();
  state.selectedNodeIds = [];
  return state;
}

export function toggleNodeSelection(state, nodeId, additive = false) {
  const selected = new Set(state.selectedNodeIds);
  if (!additive) {
    state.selectedNodeIds = selected.size === 1 && selected.has(nodeId) ? [] : [nodeId];
    return state;
  }
  if (selected.has(nodeId)) selected.delete(nodeId);
  else selected.add(nodeId);
  state.selectedNodeIds = [...selected];
  return state;
}

export function visualizationPreferences(state) {
  return {
    palette: state.palette,
    theme: state.theme,
    nodeShapeMode: state.nodeShapeMode,
    style: state.style,
    animation: state.animation,
    motionFrozen: state.motionFrozen,
    labelMode: state.labelMode,
    labelScale: state.labelScale,
    nodeScale: state.nodeScale,
    layout: state.layout,
  };
}

function validInitialState(initial) {
  const valid = {};
  for (const [key, allowed] of Object.entries(VALID_VALUES)) {
    if (allowed.has(initial[key])) valid[key] = initial[key];
  }
  if (typeof initial.motionFrozen === "boolean") valid.motionFrozen = initial.motionFrozen;
  if (Number.isFinite(initial.labelScale) && initial.labelScale >= 0.5 && initial.labelScale <= 3) valid.labelScale = initial.labelScale;
  if (Number.isFinite(initial.nodeScale) && initial.nodeScale >= 0.5 && initial.nodeScale <= 2) valid.nodeScale = initial.nodeScale;
  return valid;
}
