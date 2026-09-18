const ROLE_APPEARANCE = {
  persona: { shape: "circle", paletteSlot: "person" },
  vieta: { shape: "hexagon", paletteSlot: "institution" },
  "vairākas vērtības": { shape: "triangle", paletteSlot: "group" },
  kategorija: { shape: "rounded-square", paletteSlot: "format" },
  gads: { shape: "diamond", paletteSlot: "artifact" },
  datums: { shape: "diamond", paletteSlot: "artifact" },
  skaitlis: { shape: "diamond", paletteSlot: "artifact" },
  teksts: { shape: "rounded-square", paletteSlot: "format" },
  identifikators: { shape: "diamond", paletteSlot: "artifact" },
};

export function createVisualizationModel(rows, profiles) {
  const includedProfiles = profiles.filter((profile) => profile.included);
  const roles = includedProfiles.map((profile, index) => createRole(profile, index));
  const roleByColumn = new Map(roles.map((role) => [role.sourceColumn, role]));
  const identifierRole = roles.find((role) => role.valueType === "identifikators");
  const usedRecordIds = new Set();

  const records = rows.map((sourceRow, index) => {
    const preferredId = identifierRole ? firstValue(sourceRow[identifierRole.sourceColumn]) : "";
    const id = uniqueRecordId(preferredId || String(index + 1), usedRecordIds);
    const fields = Object.fromEntries(roles.map((role) => [role.id, valuesForRole(sourceRow, role)]));
    return { id, index, fields, sourceRow };
  });

  return {
    records,
    roles,
    roleById: new Map(roles.map((role) => [role.id, role])),
    roleByColumn,
    recordById: new Map(records.map((record) => [record.id, record])),
  };
}

export function roleForColumn(model, column) {
  return model?.roleByColumn.get(column) || null;
}

export function valuesForRole(row, role) {
  const raw = firstValue(row?.[role.sourceColumn]);
  if (!raw) return ["Nav norādīts"];
  if (!role.multiValue) return [raw];
  const values = raw.split(/[;|]/).map((value) => value.trim()).filter(Boolean);
  return values.length ? [...new Set(values)] : ["Nav norādīts"];
}

export function filterVisualizationRecords(model, visualizationState) {
  if (!model) return [];
  const query = normalizeSearchText(visualizationState.searchQuery);
  const visibleRoles = model.roles.filter((role) => visualizationState.visibleRoleIds.has(role.id));

  return model.records.filter((record) => {
    if (query && !visibleRoles.some((role) => record.fields[role.id].some((value) => normalizeSearchText(value).includes(query)))) {
      return false;
    }
    for (const [roleId, expected] of visualizationState.filters) {
      if (!record.fields[roleId]?.includes(expected)) return false;
    }
    return true;
  });
}

export function createBipartiteGraph(model, firstRoleId, secondRoleId, records = model?.records || []) {
  const firstRole = model?.roleById.get(firstRoleId);
  const secondRole = model?.roleById.get(secondRoleId);
  if (!firstRole || !secondRole || firstRole.id === secondRole.id) return null;

  const firstNodes = new Map();
  const secondNodes = new Map();
  const edges = new Map();

  for (const record of records) {
    const firstValues = record.fields[firstRole.id] || [];
    const secondValues = record.fields[secondRole.id] || [];
    for (const value of firstValues) addNodeRecord(firstNodes, firstRole, value, record.id);
    for (const value of secondValues) addNodeRecord(secondNodes, secondRole, value, record.id);
    for (const firstValue of firstValues) {
      for (const secondValue of secondValues) {
        const source = nodeId(firstRole.id, firstValue);
        const target = nodeId(secondRole.id, secondValue);
        const id = `${source}\u0000${target}`;
        const edge = edges.get(id) || { id, source, target, weight: 0, recordIds: [] };
        edge.weight += 1;
        edge.recordIds.push(record.id);
        edges.set(id, edge);
      }
    }
  }

  return {
    roles: [firstRole, secondRole],
    ...finalizeGraph([...firstNodes.values(), ...secondNodes.values()], [...edges.values()]),
  };
}

export function createMultilayerGraph(model, roleIds, records = model?.records || []) {
  const roles = roleIds.map((id) => model?.roleById.get(id)).filter(Boolean);
  const nodes = new Map();
  const edges = new Map();

  for (const record of records) {
    const recordNodes = [];
    for (const role of roles) {
      for (const value of record.fields[role.id] || []) {
        addNodeRecord(nodes, role, value, record.id);
        recordNodes.push({ id: nodeId(role.id, value), roleId: role.id });
      }
    }
    for (let firstIndex = 0; firstIndex < recordNodes.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < recordNodes.length; secondIndex += 1) {
        const first = recordNodes[firstIndex];
        const second = recordNodes[secondIndex];
        if (first.roleId === second.roleId) continue;
        const [source, target] = [first.id, second.id].sort();
        const id = `${source}\u0000${target}`;
        const edge = edges.get(id) || { id, source, target, weight: 0, recordIds: [] };
        edge.weight += 1;
        edge.recordIds.push(record.id);
        edges.set(id, edge);
      }
    }
  }

  return {
    roles,
    ...finalizeGraph([...nodes.values()], [...edges.values()]),
  };
}

export function recordIdsForSelection(graph, selectedNodeIds, logic = "any") {
  if (!selectedNodeIds.length) return new Set();
  const recordSets = selectedNodeIds
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter(Boolean)
    .map((node) => new Set(node.recordIds));
  if (!recordSets.length) return new Set();
  if (logic === "all") return new Set([...recordSets[0]].filter((id) => recordSets.every((set) => set.has(id))));
  return new Set(recordSets.flatMap((set) => [...set]));
}

export function normalizeSearchText(value) {
  return String(value ?? "").toLocaleLowerCase("lv-LV").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function createRole(profile, index) {
  const appearance = ROLE_APPEARANCE[profile.type] || ROLE_APPEARANCE.teksts;
  return {
    id: `role:${encodeURIComponent(profile.name)}`,
    label: profile.name,
    sourceColumn: profile.name,
    valueType: profile.type,
    shape: appearance.shape,
    paletteSlot: appearance.paletteSlot,
    multiValue: profile.type === "vairākas vērtības",
    order: index,
  };
}

function addNodeRecord(nodes, role, value, recordId) {
  const id = nodeId(role.id, value);
  const node = nodes.get(id) || {
    id,
    roleId: role.id,
    label: value,
    shape: role.shape,
    paletteSlot: role.paletteSlot,
    recordIds: [],
  };
  node.recordIds.push(recordId);
  nodes.set(id, node);
}

function finalizeNode(node) {
  const recordIds = [...new Set(node.recordIds)];
  return { ...node, type: node.paletteSlot, recordIds, degree: 0 };
}

function finalizeGraph(rawNodes, rawEdges) {
  const edges = rawEdges.map((edge) => ({ ...edge, recordIds: [...new Set(edge.recordIds)] }));
  const degree = new Map();
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + edge.weight);
    degree.set(edge.target, (degree.get(edge.target) || 0) + edge.weight);
  }
  const nodes = rawNodes.map(finalizeNode).map((node) => ({ ...node, degree: degree.get(node.id) || 0 }));
  return { nodes, edges };
}

function nodeId(roleId, value) {
  return `${roleId}:value:${encodeURIComponent(value)}`;
}

function uniqueRecordId(value, usedIds) {
  const base = `record:${encodeURIComponent(value)}`;
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}:${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function firstValue(value) {
  return String(value ?? "").trim();
}
