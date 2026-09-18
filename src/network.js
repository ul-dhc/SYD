const WIDTH = 900;
const HEIGHT = 570;
const STORAGE_KEY = "syd-network-preferences-v2";

const PALETTES = {
  archive: { label: "Arhīvs", colors: ["#114b94", "#c83f00", "#2b783f", "#cf0060", "#02a49f"] },
  neon: { label: "Neons", colors: ["#1e90ff", "#00c96c", "#ff0099", "#b100ff", "#00bfb6"] },
  autumn: { label: "Dzintars", colors: ["#daa520", "#ff6f61", "#ff4500", "#b44d76", "#9b6f35"] },
  pastel: { label: "Pastelis", colors: ["#86c7cc", "#ffc1cc", "#b39cd0", "#d49abd", "#9bd8c6"] },
  vivid: { label: "Košums", colors: ["#673ab7", "#ff5722", "#e6c900", "#b51d84", "#008f9c"] },
};

export function renderInteractiveNetwork(container, data) {
  const preferences = readPreferences();
  const graph = makeGraph(data);
  const state = {
    layout: preferences.layout || "bipartite",
    palette: preferences.palette || "archive",
    style: preferences.style || "standard",
    animation: preferences.animation || "none",
    labelMode: preferences.labelMode || "active",
    graphLabelScale: preferences.graphLabelScale || 1,
    zoom: 1,
    pan: { x: 0, y: 0 },
    selected: new Set(),
    positions: new Map(),
    drag: null,
  };

  container.innerHTML = shellMarkup(data);
  const root = container.querySelector(".syd-network");
  const svg = root.querySelector(".syd-network-svg");
  const graphLayer = root.querySelector(".syd-network-graph");
  const inspector = root.querySelector(".syd-network-inspector");
  const status = root.querySelector(".syd-network-status");
  const layoutSelect = root.querySelector("[data-network-layout]");
  const styleSelect = root.querySelector("[data-network-style]");
  const animationSelect = root.querySelector("[data-network-animation]");

  layoutSelect.value = state.layout;
  styleSelect.value = state.style;
  animationSelect.value = state.animation;
  resetPositions();
  render();
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-network-layout]")) {
      state.layout = event.target.value;
      resetPositions();
      announce("Izkārtojums mainīts.");
    }
    if (event.target.matches("[data-network-style]")) state.style = event.target.value;
    if (event.target.matches("[data-network-animation]")) state.animation = event.target.value;
    savePreferences(state);
    render();
  });

  root.addEventListener("click", (event) => {
    const paletteButton = event.target.closest(".syd-palette[data-palette]");
    const actionButton = event.target.closest("[data-network-action]");
    const node = event.target.closest("[data-node-id]");
    if (paletteButton) {
      state.palette = paletteButton.dataset.palette;
      savePreferences(state);
      render();
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
    const point = svgPoint(event);
    const node = event.target.closest("[data-node-id]");
    state.drag = node
      ? { type: "node", id: node.dataset.nodeId, start: point, origin: { ...state.positions.get(node.dataset.nodeId) }, moved: false }
      : { type: "pan", start: point, origin: { ...state.pan }, moved: false };
    svg.setPointerCapture(event.pointerId);
    svg.classList.add("is-dragging");
  });

  svg.addEventListener("pointermove", (event) => {
    if (!state.drag) return;
    const point = svgPoint(event);
    const dx = point.x - state.drag.start.x;
    const dy = point.y - state.drag.start.y;
    state.drag.moved ||= Math.hypot(dx, dy) > 2;
    if (state.drag.type === "pan") {
      state.pan = { x: state.drag.origin.x + dx, y: state.drag.origin.y + dy };
    } else {
      state.positions.set(state.drag.id, {
        x: clamp(state.drag.origin.x + dx / state.zoom, 45, WIDTH - 45),
        y: clamp(state.drag.origin.y + dy / state.zoom, 45, HEIGHT - 45),
      });
    }
    renderGraph();
  });

  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);
  svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const point = svgPoint(event);
    const oldZoom = state.zoom;
    const nextZoom = clamp(oldZoom * (event.deltaY < 0 ? 1.12 : 0.89), 0.45, 4);
    const graphX = (point.x - state.pan.x) / oldZoom;
    const graphY = (point.y - state.pan.y) / oldZoom;
    state.zoom = nextZoom;
    state.pan = { x: point.x - graphX * nextZoom, y: point.y - graphY * nextZoom };
    renderGraph();
  }, { passive: false });

  function finishDrag(event) {
    if (!state.drag) return;
    const wasMoved = state.drag.moved;
    state.drag = wasMoved ? { moved: true } : null;
    svg.classList.remove("is-dragging");
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (wasMoved) setTimeout(() => { state.drag = null; }, 0);
  }

  function runAction(action) {
    if (action === "zoom-in") state.zoom = clamp(state.zoom * 1.2, 0.45, 4);
    if (action === "zoom-out") state.zoom = clamp(state.zoom / 1.2, 0.45, 4);
    if (action === "labels") {
      const modes = ["all", "active", "none"];
      state.labelMode = modes[(modes.indexOf(state.labelMode) + 1) % modes.length];
      savePreferences(state);
      announce(`Nosaukumi: ${{ all: "visi", active: "atlasītie", none: "paslēpti" }[state.labelMode]}.`);
    }
    if (action === "label-size") {
      const sizes = [0.85, 1, 1.2];
      state.graphLabelScale = sizes[(sizes.indexOf(state.graphLabelScale) + 1) % sizes.length];
      savePreferences(state);
      announce(`Nosaukumu izmērs: ${Math.round(state.graphLabelScale * 100)}%.`);
    }
    if (action === "reset") {
      state.zoom = 1;
      state.pan = { x: 0, y: 0 };
      state.selected.clear();
      resetPositions();
      announce("Tīkla novietojums atjaunots.");
    }
    render();
  }

  function selectNode(id, additive) {
    if (!additive) {
      if (state.selected.size === 1 && state.selected.has(id)) state.selected.clear();
      else state.selected = new Set([id]);
    } else if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    render();
  }

  function resetPositions() {
    state.positions = layoutPositions(graph.nodes, state.layout);
  }

  function render() {
    root.dataset.palette = state.palette;
    root.dataset.style = state.style;
    root.dataset.animation = state.animation;
    svg.className.baseVal = ["syd-network-svg", "network-canvas", state.layout === "free" ? "" : "is-structured", state.layout === "bipartite" ? "is-bipartite" : "", state.selected.size ? "has-selection" : "", `animation-${state.animation}`, `style-${state.style}`].filter(Boolean).join(" ");
    svg.style.setProperty("--graph-label-scale", state.graphLabelScale);
    root.style.setProperty("--node-a", PALETTES[state.palette].colors[0]);
    root.style.setProperty("--node-b", PALETTES[state.palette].colors[1]);
    root.querySelectorAll(".syd-palette[data-palette]").forEach((button) => {
      const active = button.dataset.palette === state.palette;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const labelButton = root.querySelector('[data-network-action="labels"]');
    labelButton.className = `label-mode-button is-${state.labelMode}`;
    labelButton.setAttribute("aria-pressed", String(state.labelMode !== "none"));
    root.querySelector(".syd-network-tools output").textContent = `${Math.round(state.zoom * 100)}%`;
    renderGraph();
    renderInspector();
  }

  function renderGraph() {
    const maxNode = Math.max(...graph.nodes.map((node) => node.count), 1);
    const maxEdge = Math.max(...graph.edges.map((edge) => edge.count), 1);
    const related = relatedIds(graph, state.selected);
    const hasSelection = state.selected.size > 0;
    const edges = graph.edges.map((edge, index) => edgeMarkup(edge, index, maxEdge, hasSelection)).join("");
    const nodes = graph.nodes.map((node) => nodeMarkup(node, maxNode, hasSelection, related)).join("");
    graphLayer.setAttribute("transform", `translate(${state.pan.x} ${state.pan.y}) scale(${state.zoom})`);
    graphLayer.innerHTML = `${definitionsMarkup()}<g class="syd-network-edges">${edges}</g><g class="syd-network-nodes">${nodes}</g>`;
  }

  function edgeMarkup(edge, index, maxEdge, hasSelection) {
    const from = state.positions.get(edge.from);
    const to = state.positions.get(edge.to);
    const curve = Math.max(35, Math.abs(to.x - from.x) * 0.42);
    const direction = to.x >= from.x ? 1 : -1;
    const path = `M ${from.x} ${from.y} C ${from.x + curve * direction} ${from.y}, ${to.x - curve * direction} ${to.y}, ${to.x} ${to.y}`;
    const active = hasSelection && (state.selected.has(edge.from) || state.selected.has(edge.to));
    const dimmed = hasSelection && !active;
    const edgeSide = state.selected.has(edge.to) ? "b" : "a";
    const width = Math.min(1.65, 0.45 + Math.sqrt(edge.count) * 0.32);
    const records = edge.count === 1 ? "1 kopīgs ieraksts" : `${edge.count} kopīgi ieraksti`;
    const classes = `${active ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}`;
    return `<g class="syd-network-edge-set edge-artifact${classes}"><path class="syd-network-edge network-edge-base edge-${edgeSide}" data-edge-index="${index}" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" d="${path}" style="stroke-width:${width};--wave-delay:${-(index % 8) * .18}s"><title>${escapeHtml(`${edge.fromLabel} un ${edge.toLabel}: ${records}`)}</title></path>${state.style === "pencil" ? `<path class="network-edge-pencil" d="${path}" style="stroke-width:${width}" aria-hidden="true"></path>` : ""}<path class="syd-network-edge-flow network-edge-flow" d="${path}" pathLength="100" style="stroke-width:${Math.min(1.9, width + .25)};--rain-duration:${4.4 + (index % 5) * .32}s;--rain-delay:${-(index % 9) * .43}s" aria-hidden="true"></path></g>`;
  }

  function nodeMarkup(node, maxNode, hasSelection, related) {
    const position = state.positions.get(node.id);
    const radius = state.layout === "free"
      ? Math.min(27, 6 + Math.sqrt(node.count) * 2.2)
      : Math.min(15, 3.5 + Math.sqrt(node.count) * 1.45);
    const selected = state.selected.has(node.id);
    const connected = related.has(node.id);
    const dimmed = hasSelection && !selected && !connected;
    const showLabel = state.labelMode === "all" || (state.labelMode === "active" && (selected || connected));
    const side = node.side === "first" ? "a" : "b";
    const labelX = node.side === "first" ? -radius - 9 : radius + 9;
    const anchor = node.side === "first" ? "end" : "start";
    const shape = node.side === "first"
      ? `<circle class="syd-network-node-shape node-shape" r="${radius}"></circle>`
      : `<polygon class="syd-network-node-shape node-shape" points="0,${-radius} ${radius},0 0,${radius} ${-radius},0"></polygon>`;
    const outline = state.style === "pencil" ? shape.replace("syd-network-node-shape node-shape", "syd-network-node-outline pencil-node-outline") : "";
    const records = node.count === 1 ? "1 ieraksts" : `${node.count} ieraksti`;
    const emphasis = hasSelection ? (selected || connected ? " is-active" : " is-dimmed") : " is-ambient";
    return `<g class="syd-network-node graph-node ${side === "a" ? "person" : "artifact"} node-${side}${selected ? " is-selected" : ""}${connected ? " is-connected" : ""}${emphasis}" data-node-id="${escapeHtml(node.id)}" transform="translate(${position.x} ${position.y})" tabindex="0" role="button" aria-pressed="${selected}" aria-label="${escapeHtml(`${node.label}: ${records}`)}">${shape}${outline}${showLabel ? `<text class="syd-network-label" x="${labelX}" y="4" text-anchor="${anchor}">${escapeHtml(shorten(node.label))}</text>` : ""}<title>${escapeHtml(`${node.label}: ${records}`)}</title></g>`;
  }

  function renderInspector() {
    const selectedNodes = graph.nodes.filter((node) => state.selected.has(node.id));
    if (!selectedNodes.length) {
      inspector.innerHTML = `<strong>${graph.nodes.length} mezgli · ${graph.edges.length} saiknes</strong><span>Izvēlieties mezglu, lai izceltu tā saiknes. Velciet mezglus vai tukšo laukumu un ritiniet, lai pietuvinātu.</span>`;
      return;
    }
    const relatedEdges = graph.edges.filter((edge) => state.selected.has(edge.from) || state.selected.has(edge.to));
    const names = selectedNodes.map((node) => node.label).join(", ");
    const neighbours = new Set(relatedEdges.flatMap((edge) => [edge.from, edge.to]).filter((id) => !state.selected.has(id)));
    inspector.innerHTML = `<strong>${escapeHtml(names)}</strong><span>${relatedEdges.length} saiknes ar ${neighbours.size} citiem mezgliem. Shift + klikšķis ļauj atlasīt vairākus mezglus.</span>`;
  }

  function announce(message) {
    status.textContent = message;
  }

  function svgPoint(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }
}

function makeGraph(data) {
  const nodes = [
    ...data.firstEntries.map(([label, count]) => ({ id: `first:${label}`, label, count, side: "first" })),
    ...data.secondEntries.map(([label, count]) => ({ id: `second:${label}`, label, count, side: "second" })),
  ];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = data.links.map((link) => ({
    from: `first:${link.firstValue}`,
    to: `second:${link.secondValue}`,
    fromLabel: link.firstValue,
    toLabel: link.secondValue,
    count: link.count,
  })).filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
  return { nodes, edges };
}

function layoutPositions(nodes, layout) {
  const positions = new Map();
  const first = nodes.filter((node) => node.side === "first");
  const second = nodes.filter((node) => node.side === "second");
  if (layout === "hierarchical") {
    spread(first, 120, 130, 770, true, positions);
    spread(second, 450, 130, 770, true, positions);
  } else if (layout === "free") {
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = index % 2 ? 205 : 150;
      positions.set(node.id, { x: WIDTH / 2 + Math.cos(angle) * radius, y: HEIGHT / 2 + Math.sin(angle) * radius });
    });
  } else {
    spread(first, 245, 76, HEIGHT - 58, false, positions);
    spread(second, 655, 76, HEIGHT - 58, false, positions);
  }
  return positions;
}

function spread(nodes, fixed, start, end, horizontal, positions) {
  nodes.forEach((node, index) => {
    const variable = nodes.length === 1 ? (start + end) / 2 : start + (index * (end - start)) / (nodes.length - 1);
    positions.set(node.id, horizontal ? { x: variable, y: fixed } : { x: fixed, y: variable });
  });
}

function relatedIds(graph, selected) {
  const related = new Set(selected);
  graph.edges.forEach((edge) => {
    if (selected.has(edge.from)) related.add(edge.to);
    if (selected.has(edge.to)) related.add(edge.from);
  });
  return related;
}

function shellMarkup(data) {
  const paletteButtons = Object.entries(PALETTES).map(([id, palette]) => `<button class="syd-palette" type="button" data-palette="${id}" aria-label="Palete ${palette.label}" title="${palette.label}"><span>${palette.colors.map((color) => `<i style="--swatch:${color}"></i>`).join("")}</span></button>`).join("");
  return `<section class="syd-network" data-palette="archive" data-style="standard" data-animation="none">
    <div class="syd-network-toolbar network-toolbar network-toolbar-secondary" aria-label="Tīkla iestatījumi">
      <div class="syd-network-toolbar-tools toolbar-tools">
        <div class="syd-network-view-options network-view-options">
          <label class="syd-network-select network-select"><span>Izkārtojums</span><select data-network-layout><option value="bipartite">Divdaļīgs</option><option value="hierarchical">Hierarhisks</option><option value="free">Brīvais</option></select></label>
          <label class="syd-network-select network-select"><span>Stils</span><select data-network-style><option value="standard">Standarta</option><option value="pencil">Zīmulis</option></select></label>
          <label class="syd-network-select network-select"><span>Kustība</span><select data-network-animation><option value="none">Nav</option><option value="rain">Lietus</option><option value="echo">Atbalss</option><option value="wave">Vilnis</option></select></label>
          <fieldset class="syd-network-palettes"><legend>Palete</legend><div>${paletteButtons}</div></fieldset>
        </div>
        <div class="syd-network-tools network-controls" aria-label="Tīkla darbības">
        <button type="button" data-network-action="labels" class="label-mode-button" aria-label="Mainīt nosaukumu režīmu" title="Mainīt nosaukumu režīmu"><i data-lucide="eye"></i></button>
        <button type="button" data-network-action="label-size" class="graph-text-size-button" aria-label="Mainīt nosaukumu izmēru" title="Mainīt nosaukumu izmēru">A+</button>
        <button type="button" data-network-action="zoom-out" aria-label="Attālināt" title="Attālināt"><i data-lucide="zoom-out"></i></button>
        <output aria-label="Mērogs">100%</output>
        <button type="button" data-network-action="zoom-in" aria-label="Pietuvināt" title="Pietuvināt"><i data-lucide="zoom-in"></i></button>
        <button type="button" data-network-action="reset" aria-label="Atjaunot novietojumu" title="Atjaunot novietojumu"><i data-lucide="rotate-ccw"></i></button>
        </div>
      </div>
      <div class="syd-network-legend legend" aria-label="Leģenda"><span><i class="node-swatch person"></i>${escapeHtml(data.firstField)}</span><span><i class="node-swatch artifact"></i>${escapeHtml(data.secondField)}</span></div>
    </div>
    <div class="syd-network-canvas network-stage">
      <svg class="syd-network-svg network-canvas is-structured is-bipartite animation-none style-standard" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Saikņu tīkls starp kolonnām ${escapeHtml(data.firstField)} un ${escapeHtml(data.secondField)}"><rect class="network-hit-area" width="${WIDTH}" height="${HEIGHT}"></rect><g class="syd-network-graph"></g></svg>
    </div>
    <div class="syd-network-inspector" aria-live="polite"></div>
    <p class="visually-hidden syd-network-status" aria-live="polite"></p>
  </section>`;
}

function definitionsMarkup() {
  return `<defs>
    <filter id="syd-pencil-wobble" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="noise"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>
    <pattern id="syd-hatch-a" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(17)"><rect width="7" height="7" fill="var(--network-paper)"></rect><path d="M0 1H7M0 5H7" stroke="var(--node-a)" stroke-width="2.1" opacity=".86"></path></pattern>
    <pattern id="syd-hatch-b" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><rect width="7" height="7" fill="var(--network-paper)"></rect><path d="M0 1H7M0 5H7" stroke="var(--node-b)" stroke-width="2.1" opacity=".86"></path></pattern>
  </defs>`;
}

function readPreferences() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function savePreferences(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout: state.layout, palette: state.palette, style: state.style, animation: state.animation, labelMode: state.labelMode, graphLabelScale: state.graphLabelScale }));
  } catch { /* Storage may be unavailable in a private browser context. */ }
}

function shorten(value) {
  return value.length > 31 ? `${value.slice(0, 30)}…` : value;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
