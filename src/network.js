import { createBipartiteGraph, createMultilayerGraph, recordIdsForSelection } from "./visualization-data.js?v=10";
import { NETWORK_COLOR_KEYS, VISUALIZATION_PALETTES, visualizationPalette } from "./visualization-palettes.js?v=1";

const WIDTH = 900;
const HEIGHT = 570;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const TYPE_ORDER = ["artifact", "person", "format", "group", "institution"];

export function renderInteractiveNetwork(container, data, sharedState, onStateChange = () => {}) {
  const availableRoleIds = data.roleIds.filter((id) => data.model.roleById.has(id));
  sharedState.visibleRoleIds = new Set([...sharedState.visibleRoleIds].filter((id) => availableRoleIds.includes(id)));
  if (!sharedState.visibleRoleIds.size) sharedState.visibleRoleIds = new Set(availableRoleIds);
  if (!availableRoleIds.includes(sharedState.bipartiteRoleIds[0])) sharedState.bipartiteRoleIds[0] = availableRoleIds[0] || null;
  if (!availableRoleIds.includes(sharedState.bipartiteRoleIds[1]) || sharedState.bipartiteRoleIds[1] === sharedState.bipartiteRoleIds[0]) {
    sharedState.bipartiteRoleIds[1] = availableRoleIds.find((id) => id !== sharedState.bipartiteRoleIds[0]) || null;
  }

  const state = {
    graph: { nodes: [], edges: [], roles: [] },
    drag: null,
    driftClock: 0,
    lastFrame: null,
    animationFrame: null,
    elasticTargets: new Map(),
    elasticVelocities: new Map(),
  };

  container.innerHTML = shellMarkup(data, sharedState);
  const root = container.querySelector(".syd-network");
  const svg = root.querySelector(".syd-network-svg");
  const graphLayer = root.querySelector(".syd-network-graph");
  const inspector = root.querySelector(".syd-network-inspector");
  const status = root.querySelector(".syd-network-status");
  const layoutSelect = root.querySelector("[data-network-layout]");
  const styleSelect = root.querySelector("[data-network-style]");
  const animationSelect = root.querySelector("[data-network-animation]");
  const leftRoleSelect = root.querySelector("[data-network-left-role]");
  const rightRoleSelect = root.querySelector("[data-network-right-role]");

  rebuildGraph(true);
  render();
  startDriftLoop();

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-network-layout]")) {
      sharedState.layout = event.target.value;
      sharedState.zoom = sharedState.layout === "force" ? 0.84 : 1;
      resetViewportAndPositions();
      rebuildGraph(true);
      announce("Izkārtojums mainīts.");
    }
    if (event.target.matches("[data-network-left-role]")) {
      sharedState.bipartiteRoleIds[0] = event.target.value;
      if (sharedState.bipartiteRoleIds[1] === event.target.value) sharedState.bipartiteRoleIds[1] = availableRoleIds.find((id) => id !== event.target.value) || null;
      resetViewportAndPositions();
      rebuildGraph(true);
    }
    if (event.target.matches("[data-network-right-role]")) {
      sharedState.bipartiteRoleIds[1] = event.target.value;
      if (sharedState.bipartiteRoleIds[0] === event.target.value) sharedState.bipartiteRoleIds[0] = availableRoleIds.find((id) => id !== event.target.value) || null;
      resetViewportAndPositions();
      rebuildGraph(true);
    }
    if (event.target.matches("[data-network-style]")) sharedState.style = event.target.value;
    if (event.target.matches("[data-network-animation]")) sharedState.animation = event.target.value;
    commitState();
    render();
  });

  root.addEventListener("click", (event) => {
    const paletteButton = event.target.closest(".syd-palette[data-palette]");
    const roleButton = event.target.closest("[data-network-role]");
    const actionButton = event.target.closest("[data-network-action]");
    const node = event.target.closest("[data-node-id]");
    if (paletteButton) {
      sharedState.palette = paletteButton.dataset.palette;
      commitState();
      render();
      return;
    }
    if (roleButton) {
      toggleRole(roleButton.dataset.networkRole);
      return;
    }
    if (actionButton) {
      runAction(actionButton.dataset.networkAction);
      return;
    }
    if (node && !state.drag?.moved) selectNode(node.dataset.nodeId, event.shiftKey);
  });

  root.addEventListener("keydown", (event) => {
    const node = event.target.closest("[data-node-id]");
    if (!node || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    selectNode(node.dataset.nodeId, event.shiftKey);
  });

  svg.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const displayPoint = svgPoint(event);
    const nodeElement = event.target.closest("[data-node-id]");
    if (nodeElement) {
      const graphNode = state.graph.nodes.find((node) => node.id === nodeElement.dataset.nodeId);
      if (!graphNode) return;
      const origin = sharedState.manualPositions.get(graphNode.id) || { x: graphNode.x, y: graphNode.y };
      const linkedEdges = sharedState.layout === "force"
        ? state.graph.edges.filter((edge) => edge.source === graphNode.id || edge.target === graphNode.id)
        : [];
      const maxWeight = Math.max(1, ...linkedEdges.map((edge) => edge.weight));
      const positions = new Map([[graphNode.id, { ...origin }]]);
      const strengths = new Map([[graphNode.id, 1]]);
      linkedEdges.forEach((edge) => {
        const neighborId = edge.source === graphNode.id ? edge.target : edge.source;
        const neighbor = state.graph.nodes.find((node) => node.id === neighborId);
        if (!neighbor) return;
        positions.set(neighborId, { ...(sharedState.manualPositions.get(neighborId) || { x: neighbor.x, y: neighbor.y }) });
        strengths.set(neighborId, .16 + Math.sqrt(edge.weight / maxWeight) * .18);
      });
      positions.forEach((position, id) => sharedState.manualPositions.set(id, { ...position }));
      state.drag = { type: "node", id: graphNode.id, start: graphPoint(displayPoint), positions, strengths, moved: false };
    } else state.drag = { type: "pan", start: displayPoint, origin: { ...sharedState.pan }, moved: false };
    svg.setPointerCapture(event.pointerId);
    svg.classList.add("is-dragging");
  });

  svg.addEventListener("pointermove", (event) => {
    if (!state.drag) return;
    const displayPoint = svgPoint(event);
    const point = state.drag.type === "node" ? graphPoint(displayPoint) : displayPoint;
    const dx = point.x - state.drag.start.x;
    const dy = point.y - state.drag.start.y;
    state.drag.moved ||= Math.hypot(dx, dy) > 2;
    if (state.drag.type === "pan") sharedState.pan = { x: state.drag.origin.x + dx, y: state.drag.origin.y + dy };
    else {
      const draggedStart = state.drag.positions.get(state.drag.id);
      sharedState.manualPositions.set(state.drag.id, {
        x: clamp(draggedStart.x + dx, 24, WIDTH - 24),
        y: clamp(draggedStart.y + dy, 24, HEIGHT - 24),
      });
      state.drag.positions.forEach((position, id) => {
        if (id === state.drag.id) return;
        const strength = state.drag.strengths.get(id) || .2;
        state.elasticTargets.set(id, {
          x: clamp(position.x + dx * strength, 24, WIDTH - 24),
          y: clamp(position.y + dy * strength, 24, HEIGHT - 24),
        });
      });
    }
    updateGraphPositions();
  });

  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);
  svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const point = svgPoint(event);
    const oldZoom = sharedState.zoom;
    const nextZoom = clamp(oldZoom * (event.deltaY < 0 ? 1.12 : 0.89), 0.35, 8);
    const graphX = CENTER.x + (point.x - CENTER.x - sharedState.pan.x) / oldZoom;
    const graphY = CENTER.y + (point.y - CENTER.y - sharedState.pan.y) / oldZoom;
    sharedState.zoom = nextZoom;
    sharedState.pan = {
      x: point.x - CENTER.x - (graphX - CENTER.x) * nextZoom,
      y: point.y - CENTER.y - (graphY - CENTER.y) * nextZoom,
    };
    updateGraphPositions();
  }, { passive: false });

  function rebuildGraph(clearManualPositions = false) {
    if (clearManualPositions) {
      sharedState.manualPositions = new Map();
      state.elasticTargets.clear();
      state.elasticVelocities.clear();
    }
    const visibleRoleIds = availableRoleIds.filter((id) => sharedState.visibleRoleIds.has(id));
    const rawGraph = sharedState.layout === "bipartite"
      ? createBipartiteGraph(data.model, sharedState.bipartiteRoleIds[0], sharedState.bipartiteRoleIds[1], data.records)
      : createMultilayerGraph(data.model, visibleRoleIds, data.records);
    if (!rawGraph) {
      state.graph = { nodes: [], edges: [], roles: [] };
      return;
    }
    state.graph = sharedState.layout === "bipartite"
      ? layoutBipartite(rawGraph)
      : sharedState.layout === "hierarchical"
        ? layoutHierarchically(rawGraph)
        : layoutNodes(rawGraph);
    const availableNodes = new Set(state.graph.nodes.map((node) => node.id));
    sharedState.selectedNodeIds = sharedState.selectedNodeIds.filter((id) => availableNodes.has(id));
    sharedState.manualPositions = new Map([...sharedState.manualPositions].filter(([id]) => availableNodes.has(id)));
  }

  function toggleRole(roleId) {
    if (sharedState.visibleRoleIds.has(roleId)) {
      if (sharedState.visibleRoleIds.size === 1) return;
      sharedState.visibleRoleIds.delete(roleId);
    } else sharedState.visibleRoleIds.add(roleId);
    sharedState.selectedNodeIds = [];
    rebuildGraph(true);
    commitState();
    render();
  }

  function finishDrag(event) {
    if (!state.drag) return;
    const interaction = state.drag;
    const wasMoved = state.drag.moved;
    state.drag = wasMoved ? { moved: true } : null;
    svg.classList.remove("is-dragging");
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (wasMoved) setTimeout(() => { state.drag = null; }, 0);
    if (!wasMoved && interaction.type === "pan" && sharedState.selectedNodeIds.length) {
      sharedState.selectedNodeIds = [];
      commitState();
      render();
      return;
    }
    commitState();
  }

  function runAction(action) {
    if (action === "zoom-in") sharedState.zoom = clamp(sharedState.zoom * 1.35, 0.35, 8);
    if (action === "zoom-out") sharedState.zoom = clamp(sharedState.zoom / 1.35, 0.35, 8);
    if (action === "motion") sharedState.motionFrozen = !sharedState.motionFrozen;
    if (action === "labels") {
      const modes = ["active", "all", "none"];
      sharedState.labelMode = modes[(modes.indexOf(sharedState.labelMode) + 1) % modes.length];
      announce(`Nosaukumi: ${{ all: "visi", active: "atlasītie", none: "paslēpti" }[sharedState.labelMode]}.`);
    }
    if (action === "label-size") {
      const sizes = [1, 1.25, 1.5];
      sharedState.labelScale = sizes[(sizes.indexOf(sharedState.labelScale) + 1) % sizes.length];
      announce(`Nosaukumu izmērs: ${Math.round(sharedState.labelScale * 100)}%.`);
    }
    if (action === "scatter") scatterNodes();
    if (action === "reset") {
      sharedState.zoom = sharedState.layout === "force" ? 0.84 : 1;
      sharedState.pan = { x: 0, y: 0 };
      sharedState.selectedNodeIds = [];
      sharedState.manualPositions = new Map();
      announce("Tīkla novietojums atjaunots.");
    }
    commitState();
    render();
  }

  function scatterNodes() {
    const positions = state.graph.nodes.map((node) => {
      const current = sharedState.manualPositions.get(node.id) || node;
      return { x: current.x, y: current.y };
    });
    for (let iteration = 0; iteration < 48; iteration += 1) {
      const shifts = positions.map(() => ({ x: 0, y: 0 }));
      for (let left = 0; left < positions.length; left += 1) {
        for (let right = left + 1; right < positions.length; right += 1) {
          let dx = positions[right].x - positions[left].x;
          let dy = positions[right].y - positions[left].y;
          let distance = Math.hypot(dx, dy);
          const minimum = nodeRadius(state.graph.nodes[left], sharedState.layout) + nodeRadius(state.graph.nodes[right], sharedState.layout) + 9;
          const influence = minimum + 34;
          if (distance >= influence) continue;
          if (distance < 0.01) {
            const angle = (Math.abs(hash(`${state.graph.nodes[left].id}:${state.graph.nodes[right].id}`)) % 628) / 100;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const push = Math.min(8, Math.max(0, minimum - distance) * 0.34 + (influence - Math.max(distance, minimum)) * 0.035);
          const pushX = dx / distance * push;
          const pushY = dy / distance * push;
          shifts[left].x -= pushX;
          shifts[left].y -= pushY;
          shifts[right].x += pushX;
          shifts[right].y += pushY;
        }
      }
      positions.forEach((position, index) => {
        position.x = clamp(position.x + clamp(shifts[index].x, -10, 10), 24, WIDTH - 24);
        position.y = clamp(position.y + clamp(shifts[index].y, -10, 10), 24, HEIGHT - 24);
      });
    }
    sharedState.manualPositions = new Map(state.graph.nodes.map((node, index) => [node.id, positions[index]]));
  }

  function selectNode(id, additive) {
    const selected = new Set(sharedState.selectedNodeIds);
    if (!additive) sharedState.selectedNodeIds = selected.size === 1 && selected.has(id) ? [] : [id];
    else {
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      sharedState.selectedNodeIds = [...selected];
    }
    commitState();
    render();
  }

  function resetViewportAndPositions() {
    sharedState.pan = { x: 0, y: 0 };
    sharedState.selectedNodeIds = [];
    sharedState.manualPositions = new Map();
    state.elasticTargets.clear();
    state.elasticVelocities.clear();
  }

  function commitState() {
    onStateChange(sharedState);
  }

  function render() {
    root.dataset.palette = sharedState.palette;
    root.dataset.style = sharedState.style;
    root.dataset.animation = sharedState.animation;
    layoutSelect.value = sharedState.layout;
    styleSelect.value = sharedState.style;
    animationSelect.value = sharedState.animation;
    leftRoleSelect.value = sharedState.bipartiteRoleIds[0] || "";
    rightRoleSelect.value = sharedState.bipartiteRoleIds[1] || "";
    root.querySelector(".syd-bipartite-options").hidden = sharedState.layout !== "bipartite";
    root.querySelector(".syd-network-layers").hidden = sharedState.layout === "bipartite";
    root.querySelectorAll("[data-network-role]").forEach((button) => button.setAttribute("aria-pressed", String(sharedState.visibleRoleIds.has(button.dataset.networkRole))));
    root.querySelectorAll(".syd-palette[data-palette]").forEach((button) => {
      const active = button.dataset.palette === sharedState.palette;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const motionButton = root.querySelector('[data-network-action="motion"]');
    motionButton.hidden = sharedState.layout !== "force";
    motionButton.setAttribute("aria-pressed", String(sharedState.motionFrozen));
    motionButton.setAttribute("aria-label", sharedState.motionFrozen ? "Ieslēgt kustību" : "Apturēt kustību");
    motionButton.innerHTML = `<i data-lucide="${sharedState.motionFrozen ? "play" : "pause"}"></i>`;
    root.querySelector('[data-network-action="scatter"]').hidden = sharedState.layout !== "force";
    const labelButton = root.querySelector('[data-network-action="labels"]');
    labelButton.className = `label-mode-button is-${sharedState.labelMode}`;
    labelButton.setAttribute("aria-pressed", String(sharedState.labelMode !== "none"));
    root.querySelector(".syd-network-tools output").textContent = `${Math.round(sharedState.zoom * 100)}%`;
    renderLegend();
    renderGraph();
    renderInspector();
    window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
  }

  function renderLegend() {
    root.querySelector(".syd-network-legend").innerHTML = state.graph.roles
      .map((role) => `<span><i class="node-swatch ${role.paletteSlot}"></i>${escapeHtml(role.label)}</span>`)
      .join("");
  }

  function renderGraph() {
    const selected = new Set(sharedState.selectedNodeIds);
    const activeIds = relatedIds(state.graph, selected);
    const displayNodes = state.graph.nodes.map(displayNode);
    const positionById = new Map(displayNodes.map((node) => [node.id, node]));
    const edges = state.graph.edges.map((edge, index) => edgeMarkup(edge, index, positionById, selected)).join("");
    const nodes = displayNodes.map((node) => nodeMarkup(node, selected, activeIds)).join("");
    svg.className.baseVal = ["syd-network-svg", "network-canvas", sharedState.layout !== "force" ? "is-structured" : "", sharedState.layout === "bipartite" ? "is-bipartite" : "", selected.size ? "has-selection" : "", `animation-${sharedState.animation}`, `style-${sharedState.style}`, sharedState.motionFrozen ? "is-motion-paused" : "", state.drag ? "is-dragging" : ""].filter(Boolean).join(" ");
    svg.style.setProperty("--graph-label-scale", sharedState.labelScale);
    const colors = visualizationPalette(sharedState.palette).colors;
    root.style.setProperty("--node-person", colors.blue);
    root.style.setProperty("--node-artifact", colors.orange);
    root.style.setProperty("--node-format", colors.green);
    root.style.setProperty("--node-group", colors.magenta);
    root.style.setProperty("--node-institution", colors.teal);
    graphLayer.innerHTML = `${definitionsMarkup()}<g class="network-edges">${edges}</g><g class="network-nodes">${nodes}</g>`;
  }

  function updateGraphPositions() {
    const displayNodes = state.graph.nodes.map(displayNode);
    const positionById = new Map(displayNodes.map((node) => [node.id, node]));
    const nodeElements = new Map([...graphLayer.querySelectorAll("[data-node-id]")].map((element) => [element.dataset.nodeId, element]));
    const edgeElements = [...graphLayer.querySelectorAll("[data-edge-index]")];
    displayNodes.forEach((node) => {
      nodeElements.get(node.id)?.setAttribute("transform", `translate(${node.x} ${node.y})`);
    });
    state.graph.edges.forEach((edge, index) => {
      const source = positionById.get(edge.source);
      const target = positionById.get(edge.target);
      if (!source || !target) return;
      const sourceSelected = sharedState.selectedNodeIds.includes(edge.source);
      const targetSelected = sharedState.selectedNodeIds.includes(edge.target);
      const reverse = sourceSelected !== targetSelected ? targetSelected : sharedState.layout === "hierarchical" && source.y > target.y;
      const startNode = reverse ? target : source;
      const endNode = reverse ? source : target;
      const endpoints = lineEndpoints(startNode, endNode, nodeRadius(startNode, sharedState.layout), nodeRadius(endNode, sharedState.layout));
      edgeElements[index]?.querySelectorAll("line").forEach((line) => {
        line.setAttribute("x1", endpoints.start.x);
        line.setAttribute("y1", endpoints.start.y);
        line.setAttribute("x2", endpoints.end.x);
        line.setAttribute("y2", endpoints.end.y);
      });
    });
  }

  function displayNode(node) {
    const base = sharedState.manualPositions.get(node.id) || node;
    let x = base.x;
    let y = base.y;
    if (sharedState.layout === "force" && !sharedState.motionFrozen && state.drag?.id !== node.id) {
      const phase = Math.abs(hash(node.id)) % 628 / 100;
      const amplitude = 6 + (Math.abs(hash(`${node.id}:drift`)) % 35) / 10;
      const orbit = state.driftClock * 0.00013 + phase;
      x += Math.sin(state.driftClock * 0.000065) * 4 + Math.sin(orbit) * amplitude;
      y += Math.cos(state.driftClock * 0.000055) * 3 + Math.cos(orbit) * amplitude * 0.76;
    }
    return { ...node, x: CENTER.x + (x - CENTER.x) * sharedState.zoom + sharedState.pan.x, y: CENTER.y + (y - CENTER.y) * sharedState.zoom + sharedState.pan.y };
  }

  function edgeMarkup(edge, index, positionById, selected) {
    const source = positionById.get(edge.source);
    const target = positionById.get(edge.target);
    if (!source || !target) return "";
    const sourceSelected = selected.has(edge.source);
    const targetSelected = selected.has(edge.target);
    const active = selected.size > 0 && (sourceSelected || targetSelected);
    const threadType = source.type === "artifact" ? target.type : target.type === "artifact" ? source.type : target.type;
    const reverse = sourceSelected !== targetSelected ? targetSelected : sharedState.layout === "hierarchical" && source.y > target.y;
    const startNode = reverse ? target : source;
    const endNode = reverse ? source : target;
    const endpoints = lineEndpoints(startNode, endNode, nodeRadius(startNode, sharedState.layout), nodeRadius(endNode, sharedState.layout));
    const baseWidth = active ? Math.min(1.65, 0.45 + Math.sqrt(edge.weight) * 0.32) : 0.62;
    const showFlow = sharedState.animation === "rain" || selected.size === 0 || active;
    const line = `x1="${endpoints.start.x}" y1="${endpoints.start.y}" x2="${endpoints.end.x}" y2="${endpoints.end.y}"`;
    return `<g data-edge-index="${index}" data-source="${escapeHtml(edge.source)}" data-target="${escapeHtml(edge.target)}" class="edge-${threadType}${active ? " is-active" : ""}"><line class="network-edge-base" ${line} style="stroke-width:${baseWidth};--wave-delay:${-(((startNode.x + endNode.x) / 2) / WIDTH) * 4.8}s"></line>${sharedState.style === "pencil" ? `<line class="network-edge-pencil" ${line} style="stroke-width:${baseWidth}"></line>` : ""}${sharedState.layout !== "force" && showFlow ? `<line class="network-edge-flow" ${line} pathLength="100" style="stroke-width:${active ? Math.min(1.9, baseWidth + 0.25) : 0.72};--rain-duration:${4.4 + (index % 5) * 0.32}s;--rain-delay:${-(index % 9) * 0.43}s"></line>` : ""}</g>`;
  }

  function nodeMarkup(node, selected, activeIds) {
    const radius = nodeRadius(node, sharedState.layout);
    const isSelected = selected.has(node.id);
    const active = !selected.size || activeIds.has(node.id);
    const showLabel = sharedState.labelMode === "all" || (sharedState.labelMode === "active" && selected.size > 0 && active);
    const emphasis = selected.size ? (active ? "is-active" : "is-dimmed") : "is-ambient";
    const placement = labelPlacement(node, radius, state.graph.nodes);
    const shape = nodeShape(node.type, radius, "node-shape");
    const outline = sharedState.style === "pencil" ? nodeShape(node.type, radius, "pencil-node-outline") : "";
    return `<g class="graph-node ${node.type}${isSelected ? " is-selected" : ""} ${emphasis}" data-node-id="${escapeHtml(node.id)}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-pressed="${isSelected}" aria-label="${escapeHtml(`${node.label}: ${node.degree} saites`)}" style="--wave-delay:${-(node.x / WIDTH) * 4.8}s">${shape}${outline}${showLabel ? `<text x="${placement.x}" y="${placement.y}" text-anchor="${placement.anchor}"${placement.rotation ? ` transform="rotate(${placement.rotation} ${placement.x} ${placement.y})"` : ""}>${escapeHtml(shorten(node.label))}</text>` : ""}<title>${escapeHtml(`${node.label}: ${node.degree} saites`)}</title></g>`;
  }

  function labelPlacement(node, radius, nodes) {
    if (sharedState.layout === "force") return { x: node.x < CENTER.x ? radius + 7 : -radius - 7, y: 4, anchor: node.x < CENTER.x ? "start" : "end" };
    if (sharedState.layout === "bipartite") {
      const left = node.x < CENTER.x;
      return { x: left ? -radius - 8 : radius + 8, y: 3, anchor: left ? "end" : "start" };
    }
    const sameRole = nodes.filter((item) => item.roleId === node.roleId);
    const diagonal = sameRole.length > 10;
    const inside = diagonal && node.x > 765;
    return { x: diagonal ? (inside ? -radius - 6 : radius + 6) : 0, y: -radius - 8, anchor: diagonal ? (inside ? "end" : "start") : "middle", rotation: diagonal ? -45 : 0 };
  }

  function renderInspector() {
    const selectedNodes = state.graph.nodes.filter((node) => sharedState.selectedNodeIds.includes(node.id));
    if (!selectedNodes.length) {
      inspector.innerHTML = `<strong>${state.graph.nodes.length} mezgli · ${state.graph.edges.length} saites · ${data.records.length} ieraksti</strong><span>Izvēlieties mezglu, lai izceltu saiknes un saistītos ierakstus.</span>`;
      return;
    }
    const recordIds = recordIdsForSelection(state.graph, sharedState.selectedNodeIds, sharedState.selectionLogic);
    inspector.innerHTML = `<strong>${escapeHtml(selectedNodes.map((node) => node.label).join(", "))}</strong><span>${recordIds.size} saistīti ieraksti · ${sharedState.selectionLogic === "all" ? "atbilst visiem atlasītajiem mezgliem" : "atbilst vismaz vienam atlasītajam mezglam"}.</span>`;
  }

  function announce(message) {
    status.textContent = message;
  }

  function graphPoint(point) {
    return { x: CENTER.x + (point.x - CENTER.x - sharedState.pan.x) / sharedState.zoom, y: CENTER.y + (point.y - CENTER.y - sharedState.pan.y) / sharedState.zoom };
  }

  function svgPoint(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  function startDriftLoop() {
    const tick = (time) => {
      let shouldPaint = updateElasticPositions();
      if (sharedState.layout === "force" && !sharedState.motionFrozen) {
        if (state.lastFrame === null) state.lastFrame = time;
        if (time - state.lastFrame >= 32) {
          state.driftClock += Math.min(50, time - state.lastFrame);
          state.lastFrame = time;
          shouldPaint = true;
        }
      } else state.lastFrame = null;
      if (shouldPaint) updateGraphPositions();
      if (root.isConnected) state.animationFrame = requestAnimationFrame(tick);
    };
    state.animationFrame = requestAnimationFrame(tick);
  }

  function updateElasticPositions() {
    if (!state.elasticTargets.size) return false;
    state.elasticTargets.forEach((target, id) => {
      const position = sharedState.manualPositions.get(id) || target;
      const velocity = state.elasticVelocities.get(id) || { x: 0, y: 0 };
      const vx = (velocity.x + (target.x - position.x) * .085) * .76;
      const vy = (velocity.y + (target.y - position.y) * .085) * .76;
      const next = { x: position.x + vx, y: position.y + vy };
      sharedState.manualPositions.set(id, next);
      state.elasticVelocities.set(id, { x: vx, y: vy });
      if (state.drag?.type !== "node" && Math.hypot(target.x - next.x, target.y - next.y) < .12 && Math.hypot(vx, vy) < .08) {
        state.elasticTargets.delete(id);
        state.elasticVelocities.delete(id);
      }
    });
    return true;
  }
}

function layoutNodes(graph) {
  const roleIds = graph.roles.map((role) => role.id);
  const centralRole = graph.roles.find((role) => role.paletteSlot === "artifact")?.id || roleIds[0];
  const anchorFor = (roleId) => {
    if (roleId === centralRole || roleIds.length === 1) return CENTER;
    const categories = roleIds.filter((id) => id !== centralRole);
    const index = Math.max(0, categories.indexOf(roleId));
    const angle = -Math.PI / 2 + index * ((Math.PI * 2) / Math.max(categories.length, 1));
    return { x: CENTER.x + Math.cos(angle) * 335, y: CENTER.y + Math.sin(angle) * 225 };
  };
  const nodes = graph.nodes.map((node, index) => {
    const sameRole = graph.nodes.filter((item) => item.roleId === node.roleId);
    const itemIndex = sameRole.findIndex((item) => item.id === node.id);
    const anchor = anchorFor(node.roleId);
    const angle = itemIndex * 2.39996 + (Math.abs(hash(node.id)) % 29) / 29;
    const radius = 24 + Math.sqrt(itemIndex) * 24;
    return { ...node, x: anchor.x + Math.cos(angle) * radius, y: anchor.y + Math.sin(angle) * radius + (index % 3) * 2 };
  });
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const vx = new Array(nodes.length).fill(0);
  const vy = new Array(nodes.length).fill(0);
  for (let iteration = 0; iteration < 95; iteration += 1) {
    for (let left = 0; left < nodes.length; left += 1) for (let right = left + 1; right < nodes.length; right += 1) {
      const dx = nodes[right].x - nodes[left].x;
      const dy = nodes[right].y - nodes[left].y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const minimum = 36 + Math.min(15, Math.sqrt(nodes[left].degree + nodes[right].degree));
      if (distance < minimum) {
        const force = (minimum - distance) * 0.035;
        vx[left] -= dx / distance * force; vy[left] -= dy / distance * force;
        vx[right] += dx / distance * force; vy[right] += dy / distance * force;
      }
    }
    for (const edge of graph.edges) {
      const left = indexById.get(edge.source);
      const right = indexById.get(edge.target);
      if (left === undefined || right === undefined) continue;
      const dx = nodes[right].x - nodes[left].x;
      const dy = nodes[right].y - nodes[left].y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = (distance - 148) * 0.00165;
      vx[left] += dx / distance * force; vy[left] += dy / distance * force;
      vx[right] -= dx / distance * force; vy[right] -= dy / distance * force;
    }
    nodes.forEach((node, index) => {
      const anchor = anchorFor(node.roleId);
      vx[index] += (anchor.x - node.x) * 0.0025;
      vy[index] += (anchor.y - node.y) * 0.0025;
      node.x = clamp(node.x + vx[index], 34, WIDTH - 34);
      node.y = clamp(node.y + vy[index], 32, HEIGHT - 32);
      vx[index] *= 0.72; vy[index] *= 0.72;
    });
  }
  return { ...graph, nodes };
}

function layoutHierarchically(graph) {
  const orderedRoles = graph.roles.map((role) => role.id);
  const nodes = graph.nodes.map((node) => {
    const roleIndex = orderedRoles.indexOf(node.roleId);
    const sameRole = graph.nodes.filter((item) => item.roleId === node.roleId).sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label, "lv"));
    const itemIndex = sameRole.findIndex((item) => item.id === node.id);
    return { ...node, x: sameRole.length === 1 ? CENTER.x : 58 + itemIndex * (784 / (sameRole.length - 1)), y: orderedRoles.length === 1 ? CENTER.y : 110 + roleIndex * (400 / (orderedRoles.length - 1)) };
  });
  return { ...graph, nodes };
}

function layoutBipartite(graph) {
  const [leftRole, rightRole] = graph.roles;
  if (!leftRole || !rightRole) return { ...graph, nodes: [] };
  const positionColumn = (role, x) => graph.nodes.filter((node) => node.roleId === role.id).sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label, "lv")).map((node, index, column) => ({ ...node, x, y: column.length === 1 ? CENTER.y : 35 + index * (500 / (column.length - 1)) }));
  return { ...graph, nodes: [...positionColumn(leftRole, 230), ...positionColumn(rightRole, 670)] };
}

function nodeRadius(node, layout) {
  return layout === "force" ? Math.min(27, 6 + Math.sqrt(node.degree) * 2.2) : Math.min(15, 3.5 + Math.sqrt(node.degree) * 1.45);
}

function nodeShape(type, radius, className) {
  if (type === "person") return `<circle class="${className}" r="${radius}"></circle>`;
  if (type === "artifact") return `<polygon class="${className}" points="0,${-radius} ${radius},0 0,${radius} ${-radius},0"></polygon>`;
  if (type === "format") return `<rect class="${className}" x="${-radius}" y="${-radius}" width="${radius * 2}" height="${radius * 2}" rx="${Math.max(2, radius * 0.2)}"></rect>`;
  if (type === "group") return `<polygon class="${className}" points="0,${-radius} ${radius * 0.92},${radius * 0.82} ${-radius * 0.92},${radius * 0.82}"></polygon>`;
  return `<polygon class="${className}" points="${-radius * 0.88},${-radius * 0.5} 0,${-radius} ${radius * 0.88},${-radius * 0.5} ${radius * 0.88},${radius * 0.5} 0,${radius} ${-radius * 0.88},${radius * 0.5}"></polygon>`;
}

function lineEndpoints(source, target, sourceRadius, targetRadius) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  return { start: { x: source.x + dx / distance * sourceRadius, y: source.y + dy / distance * sourceRadius }, end: { x: target.x - dx / distance * targetRadius, y: target.y - dy / distance * targetRadius } };
}

function relatedIds(graph, selected) {
  const related = new Set(selected);
  for (const edge of graph.edges) {
    if (selected.has(edge.source)) related.add(edge.target);
    if (selected.has(edge.target)) related.add(edge.source);
  }
  return related;
}

function shellMarkup(data, state) {
  const roles = data.roleIds.map((id) => data.model.roleById.get(id)).filter(Boolean);
  const options = roles.map((role) => `<option value="${escapeHtml(role.id)}">${escapeHtml(role.label)}</option>`).join("");
  const roleButtons = roles.map((role) => `<button type="button" class="syd-layer-chip" data-network-role="${escapeHtml(role.id)}" aria-pressed="${state.visibleRoleIds.has(role.id)}"><i class="node-swatch ${role.paletteSlot}"></i>${escapeHtml(role.label)}</button>`).join("");
  const palettes = Object.entries(VISUALIZATION_PALETTES).map(([id, palette]) => `<button class="syd-palette" type="button" data-palette="${id}" aria-label="Palete ${palette.label}" title="${palette.label}"><span>${NETWORK_COLOR_KEYS.map((key) => `<i style="--swatch:${palette.colors[key]}"></i>`).join("")}</span></button>`).join("");
  return `<section class="syd-network" data-palette="${state.palette}" data-style="${state.style}" data-animation="${state.animation}"><div class="syd-network-toolbar network-toolbar network-toolbar-secondary" aria-label="Tīkla iestatījumi"><div class="syd-network-toolbar-tools toolbar-tools"><div class="syd-network-view-options network-view-options"><label class="syd-network-select network-select"><span>Izkārtojums</span><select data-network-layout><option value="force">Brīvais</option><option value="hierarchical">Hierarhisks</option><option value="bipartite">Divdaļīgs</option></select></label><div class="syd-bipartite-options" hidden><label class="syd-network-select network-select"><span>Kreisā puse</span><select data-network-left-role>${options}</select></label><label class="syd-network-select network-select"><span>Labā puse</span><select data-network-right-role>${options}</select></label></div><label class="syd-network-select network-select"><span>Stils</span><select data-network-style><option value="standard">Standarta</option><option value="pencil">Zīmulis</option></select></label><label class="syd-network-select network-select"><span>Kustība</span><select data-network-animation><option value="none">Nav</option><option value="rain">Lietus</option><option value="echo">Atbalss</option><option value="wave">Vilnis</option></select></label><fieldset class="syd-network-palettes"><legend>Palete</legend><div>${palettes}</div></fieldset></div><div class="syd-network-tools network-controls" aria-label="Tīkla darbības"><button type="button" data-network-action="motion" aria-label="Apturēt kustību" title="Apturēt kustību"><i data-lucide="pause"></i></button><button type="button" data-network-action="labels" class="label-mode-button" aria-label="Mainīt nosaukumu režīmu" title="Mainīt nosaukumu režīmu"><i data-lucide="eye"></i></button><button type="button" data-network-action="label-size" class="graph-text-size-button" aria-label="Mainīt nosaukumu izmēru" title="Mainīt nosaukumu izmēru">A+</button><button type="button" data-network-action="scatter" class="node-scatter-button" aria-label="Izkliedēt mezglus" title="Izkliedēt mezglus"><i data-lucide="scatter-chart"></i></button><button type="button" data-network-action="zoom-out" aria-label="Attālināt" title="Attālināt"><i data-lucide="zoom-out"></i></button><output aria-label="Mērogs">100%</output><button type="button" data-network-action="zoom-in" aria-label="Pietuvināt" title="Pietuvināt"><i data-lucide="zoom-in"></i></button><button type="button" data-network-action="reset" aria-label="Atjaunot novietojumu" title="Atjaunot novietojumu"><i data-lucide="rotate-ccw"></i></button></div></div><fieldset class="syd-network-layers"><legend>Datu slāņi</legend><div>${roleButtons}</div></fieldset><div class="syd-network-legend legend" aria-label="Leģenda"></div></div><div class="syd-network-canvas network-stage"><svg class="syd-network-svg network-canvas" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Daudzslāņu saikņu tīkls"><rect class="network-hit-area" width="${WIDTH}" height="${HEIGHT}"></rect><g class="syd-network-graph"></g></svg></div><div class="syd-network-inspector network-hint" aria-live="polite"></div><p class="visually-hidden syd-network-status" aria-live="polite"></p></section>`;
}

function definitionsMarkup() {
  const angles = [-18, 22, -32, 28, -24];
  const patterns = TYPE_ORDER.map((type, index) => `<pattern id="pencil-${type}" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(${angles[index]})"><rect width="5" height="5" fill="#fffdf7"></rect><path d="M 0 1 L 5 1 M 0 3.7 L 5 3.7" stroke="var(--node-${type})" stroke-width=".75" opacity=".82"></path></pattern>`).join("");
  return `<defs><filter id="pencil-wobble" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" seed="17" result="noise"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.25" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>${patterns}</defs>`;
}

function hash(value) {
  return [...value].reduce((result, character) => ((result << 5) - result + character.charCodeAt(0)) | 0, 0);
}

function shorten(value) {
  return value.length > 38 ? `${value.slice(0, 37)}…` : value;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
