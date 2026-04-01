const THEME_DEFINITIONS = [
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark slate architecture map",
    svgClass: "theme-midnight",
    previewClass: "preview-midnight"
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm contrast for presentations",
    svgClass: "theme-sunset",
    previewClass: "preview-sunset"
  },
  {
    id: "neon",
    name: "Neon",
    description: "Bright cyber glow accents",
    svgClass: "theme-neon",
    previewClass: "preview-neon"
  },
  {
    id: "paper",
    name: "Paper",
    description: "Light printable documentation style",
    svgClass: "theme-paper",
    previewClass: "preview-paper"
  }
];

const DEFAULT_STATE = {
  title: "Email Platform Overview",
  direction: "LR",
  theme: "midnight",
  mode: "easy",
  graph: {
    nodes: [
      { id: "BrowserClient", label: "BrowserClient" },
      { id: "APIGateway", label: "APIGateway" },
      { id: "AuthService", label: "AuthService" },
      { id: "MailQueryService", label: "MailQueryService" },
      { id: "SendService", label: "SendService" },
      { id: "MailboxSyncWorkers", label: "MailboxSyncWorkers" },
      { id: "AuditLogs", label: "AuditLogs" },
      { id: "IndexStore", label: "IndexStore" },
      { id: "HotCache", label: "HotCache" },
      { id: "AttachmentStore", label: "AttachmentStore" },
      { id: "ProviderAdapters", label: "ProviderAdapters" },
      { id: "IMAPSMTP", label: "IMAP/SMTP" },
      { id: "Microsoft365", label: "Microsoft365" },
      { id: "GmailAPI", label: "GmailAPI" }
    ],
    edges: [
      { from: "BrowserClient", to: "APIGateway" },
      { from: "APIGateway", to: "AuthService" },
      { from: "APIGateway", to: "MailQueryService" },
      { from: "APIGateway", to: "SendService" },
      { from: "APIGateway", to: "AuditLogs" },
      { from: "MailQueryService", to: "IndexStore" },
      { from: "MailQueryService", to: "HotCache" },
      { from: "MailQueryService", to: "AttachmentStore" },
      { from: "SendService", to: "IndexStore" },
      { from: "SendService", to: "HotCache" },
      { from: "MailboxSyncWorkers", to: "AttachmentStore" },
      { from: "MailboxSyncWorkers", to: "ProviderAdapters" },
      { from: "AttachmentStore", to: "IMAPSMTP" },
      { from: "ProviderAdapters", to: "Microsoft365" },
      { from: "ProviderAdapters", to: "GmailAPI" }
    ]
  }
};

const state = loadStateFromUrl() || structuredClone(DEFAULT_STATE);

const graphInput = document.getElementById("graphInput");
const directionSelect = document.getElementById("directionSelect");
const titleInput = document.getElementById("titleInput");
const themePicker = document.getElementById("themePicker");
const easyModeButton = document.getElementById("easyModeButton");
const expertModeButton = document.getElementById("expertModeButton");
const modeHelpText = document.getElementById("modeHelpText");
const easyEditorPanel = document.getElementById("easyEditorPanel");
const expertEditorPanel = document.getElementById("expertEditorPanel");
const templateBlankButton = document.getElementById("templateBlankButton");
const templateChainButton = document.getElementById("templateChainButton");
const templateHubButton = document.getElementById("templateHubButton");
const templateLayersButton = document.getElementById("templateLayersButton");
const nodeNameInput = document.getElementById("nodeNameInput");
const addNodeButton = document.getElementById("addNodeButton");
const edgeFromSelect = document.getElementById("edgeFromSelect");
const edgeToSelect = document.getElementById("edgeToSelect");
const edgeLabelInput = document.getElementById("edgeLabelInput");
const addEdgeButton = document.getElementById("addEdgeButton");
const easyNodeList = document.getElementById("easyNodeList");
const easyEdgeList = document.getElementById("easyEdgeList");
const easyNodeCount = document.getElementById("easyNodeCount");
const easyEdgeCount = document.getElementById("easyEdgeCount");
const previewTitle = document.getElementById("previewTitle");
const themePill = document.getElementById("themePill");
const nodeCountPill = document.getElementById("nodeCountPill");
const edgeCountPill = document.getElementById("edgeCountPill");
const statusMessage = document.getElementById("statusMessage");
const graphSvg = document.getElementById("graphSvg");
const resetLayoutButton = document.getElementById("resetLayoutButton");

initialize();

function initialize() {
  populateThemePicker();
  syncStateToControls();
  renderGraphFromControls({ updateUrl: false });
  if (!window.location.hash) {
    persistStateToUrl(state);
  }

  document.getElementById("formatJsonButton").addEventListener("click", () => {
    const parsed = parseGraphInput();
    if (!parsed) {
      return;
    }
    state.graph = parsed;
    graphInput.value = JSON.stringify(parsed, null, 2);
    syncEasyEditorFromGraph();
    showStatus("JSON formatted.", "success");
  });

  document.getElementById("updateUrlButton").addEventListener("click", () => {
    renderGraphFromControls({ updateUrl: true, announce: "Share URL updated." });
  });

  document.getElementById("copyLinkButton").addEventListener("click", async () => {
    const nextState = buildStateFromControls();
    if (!nextState) {
      return;
    }
    persistStateToUrl(nextState);

    try {
      await navigator.clipboard.writeText(window.location.href);
      showStatus("Share link copied to clipboard.", "success");
    } catch (error) {
      showStatus(`Could not copy link: ${error.message}`, "error");
    }
  });

  document.getElementById("exportJsonButton").addEventListener("click", () => {
    const nextState = buildStateFromControls();
    if (!nextState) {
      return;
    }
    downloadFile("graph.json", "application/json", JSON.stringify(nextState, null, 2));
    showStatus("Graph JSON exported.", "success");
  });

  document.getElementById("exportSvgButton").addEventListener("click", () => {
    const svgMarkup = getSerializedSvg();
    if (!svgMarkup) {
      showStatus("Nothing to export yet.", "error");
      return;
    }
    downloadFile("graph.svg", "image/svg+xml", svgMarkup);
    showStatus("SVG exported.", "success");
  });

  document.getElementById("exportPngButton").addEventListener("click", async () => {
    const svgMarkup = getSerializedSvg();
    if (!svgMarkup) {
      showStatus("Nothing to export yet.", "error");
      return;
    }

    try {
      const pngBlob = await svgToPngBlob(svgMarkup);
      downloadBlob("graph.png", pngBlob);
      showStatus("PNG exported.", "success");
    } catch (error) {
      showStatus(`PNG export failed: ${error.message}`, "error");
    }
  });

  document.getElementById("resetButton").addEventListener("click", () => {
    Object.assign(state, structuredClone(DEFAULT_STATE));
    syncStateToControls();
    renderGraphFromControls({ updateUrl: true, announce: "Reset to example graph." });
  });

  resetLayoutButton.addEventListener("click", () => {
    clearManualLayout();
    syncStateToControls();
    renderGraphFromControls({ updateUrl: true, announce: "Layout reset to automatic placement." });
  });

  easyModeButton.addEventListener("click", () => {
    state.mode = "easy";
    updateModeUi();
    renderGraphFromControls({ updateUrl: true, announce: "Easy mode enabled." });
  });

  expertModeButton.addEventListener("click", () => {
    state.mode = "expert";
    updateModeUi();
    renderGraphFromControls({ updateUrl: true, announce: "Expert mode enabled." });
  });

  templateBlankButton.addEventListener("click", () => applyStarterTemplate("blank"));
  templateChainButton.addEventListener("click", () => applyStarterTemplate("chain"));
  templateHubButton.addEventListener("click", () => applyStarterTemplate("hub"));
  templateLayersButton.addEventListener("click", () => applyStarterTemplate("layers"));
  addNodeButton.addEventListener("click", handleAddNode);
  addEdgeButton.addEventListener("click", handleAddEdge);
  nodeNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddNode();
    }
  });

  graphInput.addEventListener("input", debounce(() => renderGraphFromControls({ updateUrl: true }), 350));
  directionSelect.addEventListener("change", () => renderGraphFromControls({ updateUrl: true }));
  titleInput.addEventListener("input", debounce(() => renderGraphFromControls({ updateUrl: true }), 250));

  window.addEventListener("hashchange", () => {
    const incomingState = loadStateFromUrl();
    if (!incomingState) {
      return;
    }
    Object.assign(state, incomingState);
    syncStateToControls();
    renderGraphFromControls({ updateUrl: false, announce: "Loaded graph from URL." });
  });
}

function populateThemePicker() {
  const template = document.getElementById("themeCardTemplate");

  THEME_DEFINITIONS.forEach((theme) => {
    const fragment = template.content.cloneNode(true);
    const button = fragment.querySelector(".theme-card");
    const preview = fragment.querySelector(".theme-preview");

    button.dataset.themeId = theme.id;
    button.setAttribute("role", "option");
    fragment.querySelector(".theme-name").textContent = theme.name;
    fragment.querySelector(".theme-description").textContent = theme.description;
    preview.classList.add(theme.previewClass);

    button.addEventListener("click", () => {
      state.theme = theme.id;
      updateThemePickerSelection();
      renderGraphFromControls({ updateUrl: true, announce: `${theme.name} theme applied.` });
    });

    themePicker.appendChild(fragment);
  });
}

function syncStateToControls() {
  graphInput.value = JSON.stringify(state.graph, null, 2);
  directionSelect.value = state.direction;
  titleInput.value = state.title;
  updateThemePickerSelection();
  updateModeUi();
  syncEasyEditorFromGraph();
}

function updateThemePickerSelection() {
  const selectedTheme = state.theme;
  themePicker.querySelectorAll(".theme-card").forEach((button) => {
    const isActive = button.dataset.themeId === selectedTheme;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function renderGraphFromControls(options = {}) {
  const nextState = buildStateFromControls();
  if (!nextState) {
    return;
  }

  Object.assign(state, nextState);
  graphInput.value = JSON.stringify(state.graph, null, 2);
  syncEasyEditorFromGraph();
  renderGraph(state);

  if (options.updateUrl) {
    persistStateToUrl(state);
  }

  if (options.announce) {
    showStatus(options.announce, "success");
  } else {
    clearStatus();
  }
}

function buildStateFromControls() {
  const parsedGraph = state.mode === "expert" ? parseGraphInput() : structuredClone(state.graph);
  if (!parsedGraph) {
    return null;
  }

  const direction = directionSelect.value;
  const title = titleInput.value.trim() || "Untitled Graph";
  const theme = THEME_DEFINITIONS.some((item) => item.id === state.theme) ? state.theme : DEFAULT_STATE.theme;
  const mode = state.mode === "expert" ? "expert" : "easy";

  return { graph: parsedGraph, direction, title, theme, mode };
}

function parseGraphInput() {
  try {
    const parsed = JSON.parse(graphInput.value);
    validateGraph(parsed);
    return parsed;
  } catch (error) {
    showStatus(error.message, "error");
    return null;
  }
}

function validateGraph(graph) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Graph must be a JSON object.");
  }

  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error("Graph must include arrays named nodes and edges.");
  }

  const ids = new Set();
  graph.nodes.forEach((node, index) => {
    if (!node || typeof node.id !== "string" || !node.id.trim()) {
      throw new Error(`Node ${index + 1} needs a non-empty id.`);
    }
    if (ids.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }
    if (node.position) {
      if (typeof node.position.x !== "number" || typeof node.position.y !== "number") {
        throw new Error(`Node ${node.id} has an invalid position.`);
      }
    }
    ids.add(node.id);
  });

  graph.edges.forEach((edge, index) => {
    if (!edge || typeof edge.from !== "string" || typeof edge.to !== "string") {
      throw new Error(`Edge ${index + 1} needs string from and to values.`);
    }
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      throw new Error(`Edge ${index + 1} references a missing node.`);
    }
  });
}

function renderGraph(currentState) {
  if (currentState.mode === "easy") {
    renderEasyGraph(currentState);
    return;
  }

  const svgSelection = d3.select(graphSvg);
  svgSelection.selectAll("*").remove();

  const inner = svgSelection.append("g").attr("class", "graph-theme");
  const theme = getThemeById(currentState.theme);
  inner.classed(theme.svgClass, true);

  const graph = new dagreD3.graphlib.Graph({ multigraph: false }).setGraph({
    rankdir: currentState.direction,
    ranksep: 72,
    nodesep: 34,
    marginx: 40,
    marginy: currentState.title ? 64 : 40
  });

  graph.setDefaultEdgeLabel(() => ({}));

  currentState.graph.nodes.forEach((node) => {
    graph.setNode(node.id, {
      label: node.label || node.id,
      class: "graph-node",
      padding: 18
    });
  });

  currentState.graph.edges.forEach((edge, index) => {
    graph.setEdge(edge.from, edge.to, {
      label: edge.label || "",
      curve: d3.curveBasis,
      class: "graph-edge-path",
      arrowheadClass: "graph-edge-arrowhead",
      id: `edge-${index}`
    });
  });

  const renderer = new dagreD3.render();
  renderer(inner, graph);

  const hasManualLayout = applySavedManualPositions(inner, currentState.graph);
  enableNodeDragging(inner, currentState.graph);
  if (hasManualLayout) {
    updateManualEdges(inner, currentState.graph);
  }
  const titleOffset = currentState.title ? 18 : 0;

  if (currentState.title) {
    inner
      .append("text")
      .attr("class", "graph-title")
      .attr("x", graph.graph().width / 2)
      .attr("y", -titleOffset)
      .attr("text-anchor", "middle")
      .text(currentState.title);
  }

  const graphDimensions = measureGraphBounds(inner, currentState.title);
  inner.attr("transform", `translate(${graphDimensions.offsetX}, ${graphDimensions.offsetY})`);
  svgSelection.attr("width", graphDimensions.width);
  svgSelection.attr("height", graphDimensions.height);
  svgSelection.attr("viewBox", `0 0 ${graphDimensions.width} ${graphDimensions.height}`);

  previewTitle.textContent = currentState.title;
  nodeCountPill.textContent = `${currentState.graph.nodes.length} nodes`;
  edgeCountPill.textContent = `${currentState.graph.edges.length} edges`;
  themePill.textContent = theme.name;
}

function renderEasyGraph(currentState) {
  const svgSelection = d3.select(graphSvg);
  svgSelection.selectAll("*").remove();

  const theme = getThemeById(currentState.theme);
  const defs = svgSelection.append("defs");
  defs
    .append("marker")
    .attr("id", "easy-arrowhead")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 9)
    .attr("refY", 5)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("class", "easy-arrowhead");

  const inner = svgSelection.append("g").attr("class", `graph-theme ${theme.svgClass}`);
  const edgesLayer = inner.append("g").attr("class", "easy-edges");
  const nodesLayer = inner.append("g").attr("class", "easy-nodes");

  const layout = buildEasyLayout(currentState.graph, currentState.direction, currentState.title);

  currentState.graph.edges.forEach((edge) => {
    const fromNode = layout.nodesById.get(edge.from);
    const toNode = layout.nodesById.get(edge.to);
    if (!fromNode || !toNode) {
      return;
    }

    const path = buildEasyEdgePath(fromNode, toNode, currentState.direction);
    edgesLayer
      .append("path")
      .attr("class", "easy-edge")
      .attr("d", path)
      .attr("marker-end", "url(#easy-arrowhead)");

    if (edge.label) {
      const midpoint = getEasyEdgeMidpoint(fromNode, toNode);
      edgesLayer
        .append("text")
        .attr("class", "easy-edge-label")
        .attr("x", midpoint.x)
        .attr("y", midpoint.y - 10)
        .attr("text-anchor", "middle")
        .text(edge.label);
    }
  });

  const nodeGroups = nodesLayer
    .selectAll("g.easy-node")
    .data(layout.nodes)
    .enter()
    .append("g")
    .attr("class", "graph-node easy-node")
    .attr("transform", (node) => `translate(${node.position.x},${node.position.y})`);

  nodeGroups
    .append("rect")
    .attr("x", (node) => -node.width / 2)
    .attr("y", (node) => -node.height / 2)
    .attr("width", (node) => node.width)
    .attr("height", (node) => node.height);

  nodeGroups
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((node) => node.label);

  enableEasyNodeDragging(nodeGroups, edgesLayer, currentState);

  if (currentState.title) {
    inner
      .append("text")
      .attr("class", "graph-title")
      .attr("x", layout.width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text(currentState.title);
  }

  svgSelection.attr("width", layout.width);
  svgSelection.attr("height", layout.height);
  svgSelection.attr("viewBox", `0 0 ${layout.width} ${layout.height}`);

  previewTitle.textContent = currentState.title;
  nodeCountPill.textContent = `${currentState.graph.nodes.length} nodes`;
  edgeCountPill.textContent = `${currentState.graph.edges.length} edges`;
  themePill.textContent = theme.name;
}

function buildEasyLayout(graphData, direction, hasTitle) {
  const nodeWidth = 180;
  const nodeHeight = 88;
  const padding = 56;
  const titleSpace = hasTitle ? 90 : 32;
  const columnGap = 220;
  const rowGap = 130;
  const nodes = graphData.nodes.map((node) => ({ ...node, width: nodeWidth, height: nodeHeight }));
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));

  graphData.edges.forEach((edge) => {
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  });

  const queue = nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
  const rankById = new Map(nodes.map((node) => [node.id, 0]));
  const visited = new Set();

  while (queue.length) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const nextNodes = outgoing.get(nodeId) || [];
    nextNodes.forEach((nextId) => {
      rankById.set(nextId, Math.max(rankById.get(nextId) || 0, (rankById.get(nodeId) || 0) + 1));
      incoming.set(nextId, (incoming.get(nextId) || 0) - 1);
      if ((incoming.get(nextId) || 0) <= 0) {
        queue.push(nextId);
      }
    });
  }

  let fallbackRank = 0;
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      rankById.set(node.id, fallbackRank);
      fallbackRank += 1;
    }
  });

  const columns = new Map();
  nodes.forEach((node) => {
    const rank = rankById.get(node.id) || 0;
    if (!columns.has(rank)) {
      columns.set(rank, []);
    }
    columns.get(rank).push(node);
  });

  const sortedRanks = [...columns.keys()].sort((left, right) => left - right);
  sortedRanks.forEach((rank) => {
    columns.get(rank).sort((left, right) => left.label.localeCompare(right.label));
  });

  let maxRows = 1;
  sortedRanks.forEach((rank) => {
    maxRows = Math.max(maxRows, columns.get(rank).length);
  });

  const horizontal = direction === "LR" || direction === "RL";
  const width = horizontal
    ? Math.max(420, padding * 2 + sortedRanks.length * nodeWidth + Math.max(0, sortedRanks.length - 1) * (columnGap - nodeWidth))
    : Math.max(420, padding * 2 + maxRows * nodeWidth + Math.max(0, maxRows - 1) * 40);
  const height = horizontal
    ? Math.max(280, titleSpace + padding + maxRows * nodeHeight + Math.max(0, maxRows - 1) * (rowGap - nodeHeight))
    : Math.max(280, titleSpace + padding + sortedRanks.length * nodeHeight + Math.max(0, sortedRanks.length - 1) * (rowGap - nodeHeight));

  sortedRanks.forEach((rank, rankIndex) => {
    const columnNodes = columns.get(rank);
    const orderedNodes = direction === "RL" || direction === "BT" ? [...columnNodes].reverse() : columnNodes;

    orderedNodes.forEach((node, rowIndex) => {
      if (node.position) {
        return;
      }

      if (horizontal) {
        const x = padding + nodeWidth / 2 + rankIndex * columnGap;
        const columnHeight = orderedNodes.length * nodeHeight + Math.max(0, orderedNodes.length - 1) * (rowGap - nodeHeight);
        const startY = titleSpace + Math.max(0, (Math.max(columnHeight, nodeHeight) - columnHeight) / 2) + nodeHeight / 2;
        const y = startY + rowIndex * rowGap;
        node.position = direction === "RL"
          ? { x: width - x, y }
          : { x, y };
      } else {
        const y = titleSpace + nodeHeight / 2 + rankIndex * rowGap;
        const rowWidth = orderedNodes.length * nodeWidth + Math.max(0, orderedNodes.length - 1) * 40;
        const startX = padding + Math.max(0, (Math.max(rowWidth, nodeWidth) - rowWidth) / 2) + nodeWidth / 2;
        const x = startX + rowIndex * (nodeWidth + 40);
        node.position = direction === "BT"
          ? { x, y: height - y }
          : { x, y };
      }
    });
  });

  return { nodes, nodesById, width, height };
}

function buildEasyEdgePath(fromNode, toNode, direction) {
  const start = getEasyNodeAnchor(fromNode, toNode, direction, true);
  const end = getEasyNodeAnchor(fromNode, toNode, direction, false);
  const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);

  if (horizontal) {
    const curve = (end.x - start.x) * 0.35;
    return `M ${start.x} ${start.y} C ${start.x + curve} ${start.y}, ${end.x - curve} ${end.y}, ${end.x} ${end.y}`;
  }

  const curve = (end.y - start.y) * 0.35;
  return `M ${start.x} ${start.y} C ${start.x} ${start.y + curve}, ${end.x} ${end.y - curve}, ${end.x} ${end.y}`;
}

function getEasyEdgeMidpoint(fromNode, toNode) {
  return {
    x: (fromNode.position.x + toNode.position.x) / 2,
    y: (fromNode.position.y + toNode.position.y) / 2
  };
}

function getEasyNodeAnchor(fromNode, toNode, direction, isStart) {
  const source = isStart ? fromNode : toNode;
  const target = isStart ? toNode : fromNode;
  const deltaX = target.position.x - source.position.x;
  const deltaY = target.position.y - source.position.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return {
      x: source.position.x + (deltaX >= 0 ? source.width / 2 : -source.width / 2),
      y: source.position.y
    };
  }

  return {
    x: source.position.x,
    y: source.position.y + (deltaY >= 0 ? source.height / 2 : -source.height / 2)
  };
}

function enableEasyNodeDragging(nodeGroups, edgesLayer, currentState) {
  const nodesById = new Map(currentState.graph.nodes.map((node) => [node.id, node]));

  nodeGroups.call(
    d3.drag()
      .on("start", function() {
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function(event, node) {
        const actualNode = nodesById.get(node.id);
        if (!actualNode) {
          return;
        }

        actualNode.position = {
          x: (actualNode.position?.x ?? node.position.x) + event.dx,
          y: (actualNode.position?.y ?? node.position.y) + event.dy
        };
        node.position = { ...actualNode.position };
        d3.select(this).attr("transform", `translate(${node.position.x},${node.position.y})`);
        redrawEasyEdges(edgesLayer, currentState.graph);
      })
      .on("end", function() {
        d3.select(this).classed("is-dragging", false);
        persistGraphState();
      })
  );
}

function redrawEasyEdges(edgesLayer, graphData) {
  const nodeLookup = new Map(graphData.nodes.map((node) => [
    node.id,
    {
      ...node,
      width: 180,
      height: 88
    }
  ]));

  edgesLayer.selectAll("path.easy-edge").each(function(edge, index) {
    const graphEdge = graphData.edges[index];
    if (!graphEdge) {
      return;
    }
    const fromNode = nodeLookup.get(graphEdge.from);
    const toNode = nodeLookup.get(graphEdge.to);
    if (!fromNode || !toNode) {
      return;
    }
    d3.select(this).attr("d", buildEasyEdgePath(fromNode, toNode));
  });

  edgesLayer.selectAll("text.easy-edge-label").each(function(edge, index) {
    const graphEdge = graphData.edges.filter((item) => item.label)[index];
    if (!graphEdge) {
      return;
    }
    const fromNode = nodeLookup.get(graphEdge.from);
    const toNode = nodeLookup.get(graphEdge.to);
    if (!fromNode || !toNode) {
      return;
    }
    const midpoint = getEasyEdgeMidpoint(fromNode, toNode);
    d3.select(this).attr("x", midpoint.x).attr("y", midpoint.y - 10);
  });
}

function getThemeById(themeId) {
  return THEME_DEFINITIONS.find((theme) => theme.id === themeId) || THEME_DEFINITIONS[0];
}

function clearManualLayout() {
  state.graph.nodes.forEach((node) => {
    delete node.position;
  });
}

function applySavedManualPositions(inner, graphData) {
  let hasManualLayout = false;

  inner.selectAll("g.node").each(function(nodeId) {
    const node = graphData.nodes.find((item) => item.id === nodeId);
    if (!node || !node.position) {
      return;
    }

    hasManualLayout = true;
    const selection = d3.select(this);
    selection.attr("transform", `translate(${node.position.x},${node.position.y})`);
  });

  return hasManualLayout;
}

function enableNodeDragging(inner, graphData) {
  const nodesById = new Map(graphData.nodes.map((node) => [node.id, node]));

  inner.selectAll("g.node").call(
    d3.drag()
      .on("start", function() {
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function(event, nodeId) {
        const node = nodesById.get(nodeId);
        if (!node) {
          return;
        }

        const current = getNodeTransform(d3.select(this));
        const nextX = current.x + event.dx;
        const nextY = current.y + event.dy;
        node.position = { x: nextX, y: nextY };
        d3.select(this).attr("transform", `translate(${nextX},${nextY})`);
        updateManualEdges(inner, graphData);
      })
      .on("end", function(event, nodeId) {
        d3.select(this).classed("is-dragging", false);
        const node = nodesById.get(nodeId);
        if (node) {
          persistGraphState();
        }
      })
  );
}

function updateManualEdges(inner, graphData) {
  const boxes = new Map();

  inner.selectAll("g.node").each(function(nodeId) {
    const selection = d3.select(this);
    const transform = getNodeTransform(selection);
    const rect = this.querySelector("rect");

    if (!rect) {
      return;
    }

    const rectX = Number(rect.getAttribute("x") || 0);
    const rectY = Number(rect.getAttribute("y") || 0);
    const width = Number(rect.getAttribute("width"));
    const height = Number(rect.getAttribute("height"));

    boxes.set(nodeId, {
      x: transform.x + rectX,
      y: transform.y + rectY,
      width,
      height,
      centerX: transform.x,
      centerY: transform.y
    });
  });

  inner.selectAll("g.edgePath").each(function(edgeInfo) {
    const fromBox = boxes.get(edgeInfo.v);
    const toBox = boxes.get(edgeInfo.w);

    if (!fromBox || !toBox) {
      return;
    }

    const points = computeEdgePoints(fromBox, toBox);
    const path = d3.select(this).select("path");
    path.attr("d", buildEdgePath(points));
  });

  inner.selectAll("g.edgeLabel").each(function(edgeInfo) {
    const fromBox = boxes.get(edgeInfo.v);
    const toBox = boxes.get(edgeInfo.w);

    if (!fromBox || !toBox) {
      return;
    }

    const midX = (fromBox.centerX + toBox.centerX) / 2;
    const midY = (fromBox.centerY + toBox.centerY) / 2;
    d3.select(this).attr("transform", `translate(${midX},${midY})`);
  });
}

function computeEdgePoints(fromBox, toBox) {
  const fromCenter = {
    x: fromBox.centerX,
    y: fromBox.centerY
  };
  const toCenter = {
    x: toBox.centerX,
    y: toBox.centerY
  };
  const deltaX = toCenter.x - fromCenter.x;
  const deltaY = toCenter.y - fromCenter.y;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return [
      {
        x: fromCenter.x + (deltaX >= 0 ? fromBox.width / 2 : -fromBox.width / 2),
        y: fromCenter.y
      },
      {
        x: toCenter.x + (deltaX >= 0 ? -toBox.width / 2 : toBox.width / 2),
        y: toCenter.y
      }
    ];
  }

  return [
    {
      x: fromCenter.x,
      y: fromCenter.y + (deltaY >= 0 ? fromBox.height / 2 : -fromBox.height / 2)
    },
    {
      x: toCenter.x,
      y: toCenter.y + (deltaY >= 0 ? -toBox.height / 2 : toBox.height / 2)
    }
  ];
}

function buildEdgePath(points) {
  const [start, end] = points;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

function getNodeTransform(selection) {
  const transform = selection.attr("transform") || "translate(0,0)";
  const match = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(transform);

  return {
    x: match ? Number(match[1]) : 0,
    y: match ? Number(match[2]) : 0
  };
}

function measureGraphBounds(inner, hasTitle) {
  const bounds = inner.node().getBBox();
  const padding = 32;
  const titlePad = hasTitle ? 32 : 0;
  const offsetX = padding - bounds.x;
  const offsetY = padding + titlePad - bounds.y;

  return {
    offsetX,
    offsetY,
    width: Math.max(320, Math.ceil(bounds.width + padding * 2)),
    height: Math.max(240, Math.ceil(bounds.height + padding * 2 + titlePad))
  };
}

function persistGraphState() {
  graphInput.value = JSON.stringify(state.graph, null, 2);
  syncEasyEditorFromGraph();
  persistStateToUrl(state);
}

function updateModeUi() {
  const isEasy = state.mode !== "expert";
  easyModeButton.classList.toggle("active", isEasy);
  expertModeButton.classList.toggle("active", !isEasy);
  easyModeButton.setAttribute("aria-selected", String(isEasy));
  expertModeButton.setAttribute("aria-selected", String(!isEasy));
  easyEditorPanel.classList.toggle("hidden-panel", !isEasy);
  expertEditorPanel.classList.toggle("hidden-panel", isEasy);
  modeHelpText.textContent = isEasy
    ? "Easy mode uses forms and quick builders so people can create graphs without touching JSON."
    : "Expert mode gives direct control over the JSON model for precise editing.";
}

function syncEasyEditorFromGraph() {
  const graph = state.graph;
  easyNodeCount.textContent = `${graph.nodes.length} boxes`;
  easyEdgeCount.textContent = `${graph.edges.length} connections`;
  renderNodeList(graph.nodes);
  renderEdgeList(graph.edges, graph.nodes);
  populateNodeSelects(graph.nodes);
}

function renderNodeList(nodes) {
  easyNodeList.innerHTML = "";

  if (!nodes.length) {
    easyNodeList.innerHTML = '<div class="empty-state">No boxes yet. Start with a template or add your first box above.</div>';
    return;
  }

  nodes.forEach((node) => {
    const card = document.createElement("div");
    card.className = "item-card";

    const header = document.createElement("div");
    header.className = "item-card-header";

    const title = document.createElement("div");
    title.className = "item-card-title";
    title.textContent = node.label || node.id;

    const actions = document.createElement("div");
    actions.className = "item-card-actions";

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "muted-button";
    renameButton.textContent = "Rename";
    renameButton.addEventListener("click", () => renameNode(node.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteNode(node.id));

    actions.append(renameButton, deleteButton);
    header.append(title, actions);

    const meta = document.createElement("div");
    meta.className = "theme-description";
    meta.textContent = `ID: ${node.id}`;

    card.append(header, meta);
    easyNodeList.appendChild(card);
  });
}

function renderEdgeList(edges, nodes) {
  easyEdgeList.innerHTML = "";

  if (!edges.length) {
    easyEdgeList.innerHTML = '<div class="empty-state">No connections yet. Pick two boxes above and press Connect.</div>';
    return;
  }

  const labelMap = new Map(nodes.map((node) => [node.id, node.label || node.id]));

  edges.forEach((edge, index) => {
    const card = document.createElement("div");
    card.className = "item-card";

    const header = document.createElement("div");
    header.className = "item-card-header";

    const title = document.createElement("div");
    title.className = "item-card-title";
    title.textContent = `${labelMap.get(edge.from) || edge.from} -> ${labelMap.get(edge.to) || edge.to}`;

    const actions = document.createElement("div");
    actions.className = "item-card-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteEdge(index));

    actions.append(deleteButton);
    header.append(title, actions);

    const meta = document.createElement("div");
    meta.className = "theme-description";
    meta.textContent = edge.label ? `Label: ${edge.label}` : "No label";

    card.append(header, meta);
    easyEdgeList.appendChild(card);
  });
}

function populateNodeSelects(nodes) {
  const currentFrom = edgeFromSelect.value;
  const currentTo = edgeToSelect.value;

  edgeFromSelect.innerHTML = "";
  edgeToSelect.innerHTML = "";

  if (!nodes.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Add nodes first";
    edgeFromSelect.appendChild(option.cloneNode(true));
    edgeToSelect.appendChild(option);
    return;
  }

  nodes.forEach((node) => {
    const label = node.label || node.id;
    const fromOption = document.createElement("option");
    fromOption.value = node.id;
    fromOption.textContent = label;

    const toOption = document.createElement("option");
    toOption.value = node.id;
    toOption.textContent = label;

    edgeFromSelect.appendChild(fromOption);
    edgeToSelect.appendChild(toOption);
  });

  edgeFromSelect.value = nodes.some((node) => node.id === currentFrom) ? currentFrom : nodes[0].id;
  edgeToSelect.value = nodes.some((node) => node.id === currentTo) ? currentTo : nodes[Math.min(1, nodes.length - 1)].id;
}

function handleAddNode() {
  const name = nodeNameInput.value.trim();
  if (!name) {
    showStatus("Type a box name first.", "error");
    return;
  }

  const id = makeUniqueId(name, state.graph.nodes.map((node) => node.id));
  state.graph.nodes.push({ id, label: name });
  clearManualLayout();
  nodeNameInput.value = "";
  syncStateToControls();
  renderGraphFromControls({ updateUrl: true, announce: `Added box ${name}.` });
}

function handleAddEdge() {
  const from = edgeFromSelect.value;
  const to = edgeToSelect.value;
  const label = edgeLabelInput.value.trim();

  if (!from || !to) {
    showStatus("Choose both connection endpoints.", "error");
    return;
  }

  const alreadyExists = state.graph.edges.some((edge) => edge.from === from && edge.to === to && (edge.label || "") === label);
  if (alreadyExists) {
    showStatus("That connection already exists.", "error");
    return;
  }

  const edge = { from, to };
  if (label) {
    edge.label = label;
  }
  state.graph.edges.push(edge);
  clearManualLayout();
  edgeLabelInput.value = "";
  syncStateToControls();
  renderGraphFromControls({ updateUrl: true, announce: "Connection added." });
}

function renameNode(nodeId) {
  const node = state.graph.nodes.find((item) => item.id === nodeId);
  if (!node) {
    return;
  }

  const nextLabel = window.prompt("Rename node", node.label || node.id);
  if (!nextLabel) {
    return;
  }

  node.label = nextLabel.trim();
  if (!node.label) {
    node.label = node.id;
  }
  clearManualLayout();
  syncStateToControls();
  renderGraphFromControls({ updateUrl: true, announce: "Node renamed." });
}

function deleteNode(nodeId) {
  const node = state.graph.nodes.find((item) => item.id === nodeId);
  if (!node) {
    return;
  }

  const confirmed = window.confirm(`Delete ${node.label || node.id} and its connections?`);
  if (!confirmed) {
    return;
  }

  state.graph.nodes = state.graph.nodes.filter((item) => item.id !== nodeId);
  state.graph.edges = state.graph.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
  clearManualLayout();
  syncStateToControls();
  renderGraphFromControls({ updateUrl: true, announce: "Node deleted." });
}

function deleteEdge(index) {
  state.graph.edges.splice(index, 1);
  clearManualLayout();
  syncStateToControls();
  renderGraphFromControls({ updateUrl: true, announce: "Connection deleted." });
}

function applyStarterTemplate(templateId) {
  const templates = {
    blank: { nodes: [], edges: [] },
    chain: buildChainGraph("Step 1\nStep 2\nStep 3"),
    hub: buildHubGraph("Main Service", "Client App\nAuth\nData Store\nWorker"),
    layers: buildLayerGraph("Browser\nAPI\nServices\nStorage")
  };

  state.graph = structuredClone(templates[templateId] || templates.blank);
  clearManualLayout();
  syncStateToControls();
  renderGraphFromControls({ updateUrl: true, announce: "Starter layout applied." });
}

function buildChainGraph(raw) {
  const names = splitLines(raw);
  if (names.length < 2) {
    throw new Error("A chain needs at least two names.");
  }

  const nodes = names.map((name, index) => ({ id: makeUniqueId(name, names.slice(0, index).map(makeSafeId)), label: name }));
  const edges = [];

  for (let index = 0; index < nodes.length - 1; index += 1) {
    edges.push({ from: nodes[index].id, to: nodes[index + 1].id });
  }

  return { nodes, edges };
}

function buildHubGraph(centerName, raw) {
  const spokes = splitLines(raw);
  if (!centerName) {
    throw new Error("Hub and spoke needs a main node.");
  }
  if (!spokes.length) {
    throw new Error("Add at least one spoke.");
  }

  const allIds = [];
  const centerId = makeUniqueId(centerName, allIds);
  allIds.push(centerId);
  const nodes = [{ id: centerId, label: centerName }];
  const edges = [];

  spokes.forEach((name) => {
    const spokeId = makeUniqueId(name, allIds);
    allIds.push(spokeId);
    nodes.push({ id: spokeId, label: name });
    edges.push({ from: centerId, to: spokeId });
  });

  return { nodes, edges };
}

function buildLayerGraph(raw) {
  const layerLines = splitLines(raw);
  if (layerLines.length < 2) {
    throw new Error("Layered flow needs at least two lines.");
  }

  const allIds = [];
  const layers = layerLines.map((line) => {
    const names = line.split(",").map((part) => part.trim()).filter(Boolean);
    if (!names.length) {
      throw new Error("Each layer line must contain at least one node name.");
    }

    return names.map((name) => {
      const id = makeUniqueId(name, allIds);
      allIds.push(id);
      return { id, label: name };
    });
  });

  const nodes = layers.flat();
  const edges = [];

  for (let index = 0; index < layers.length - 1; index += 1) {
    layers[index].forEach((fromNode) => {
      layers[index + 1].forEach((toNode) => {
        edges.push({ from: fromNode.id, to: toNode.id });
      });
    });
  }

  return { nodes, edges };
}

function splitLines(raw) {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function makeSafeId(value) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "node";
}

function makeUniqueId(value, existingIds) {
  const existing = new Set(existingIds);
  const baseId = makeSafeId(value);
  let candidate = baseId;
  let suffix = 2;

  while (existing.has(candidate)) {
    candidate = `${baseId}_${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function loadStateFromUrl() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) {
    return null;
  }

  try {
    const json = LZString.decompressFromEncodedURIComponent(raw);
    if (!json) {
      return null;
    }
    const parsed = JSON.parse(json);
    validateGraph(parsed.graph);
    return {
      title: typeof parsed.title === "string" ? parsed.title : DEFAULT_STATE.title,
      direction: typeof parsed.direction === "string" ? parsed.direction : DEFAULT_STATE.direction,
      theme: typeof parsed.theme === "string" ? parsed.theme : DEFAULT_STATE.theme,
      mode: parsed.mode === "expert" ? "expert" : "easy",
      graph: parsed.graph
    };
  } catch (error) {
    showStatus(`Could not load URL graph: ${error.message}`, "error");
    return null;
  }
}

function persistStateToUrl(nextState) {
  const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(nextState));
  const nextHash = `#${encoded}`;

  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", nextHash);
  }
}

function getSerializedSvg() {
  if (!graphSvg.getAttribute("viewBox")) {
    return "";
  }

  const clonedSvg = graphSvg.cloneNode(true);
  const theme = getThemeById(state.theme);
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const styleSheet = document.createElement("style");
  styleSheet.textContent = buildEmbeddedSvgStyles(theme);
  clonedSvg.prepend(styleSheet);

  return new XMLSerializer().serializeToString(clonedSvg);
}

function buildEmbeddedSvgStyles(theme) {
  const themeVars = {
    midnight: {
      nodeFill: "#1e293b",
      nodeStroke: "#475569",
      nodeText: "#f8fafc",
      edge: "#64748b",
      label: "#cbd5e1",
      title: "#e2e8f0"
    },
    sunset: {
      nodeFill: "#3f1d2e",
      nodeStroke: "#fb7185",
      nodeText: "#fff1f2",
      edge: "#fdba74",
      label: "#ffe4e6",
      title: "#fff7ed"
    },
    neon: {
      nodeFill: "#091a1d",
      nodeStroke: "#2dd4bf",
      nodeText: "#ccfbf1",
      edge: "#67e8f9",
      label: "#a5f3fc",
      title: "#ecfeff"
    },
    paper: {
      nodeFill: "#f8fafc",
      nodeStroke: "#cbd5e1",
      nodeText: "#0f172a",
      edge: "#475569",
      label: "#334155",
      title: "#0f172a"
    }
  };

  const palette = themeVars[theme.id] || themeVars.midnight;

  return `
    svg { background: transparent; }
    .graph-node rect {
      rx: 12px;
      ry: 12px;
      fill: ${palette.nodeFill};
      stroke: ${palette.nodeStroke};
      stroke-width: 1.5px;
    }
    .graph-node text,
    .edgeLabel text,
    .graph-title {
      font-family: Inter, Arial, sans-serif;
    }
    .graph-node text {
      fill: ${palette.nodeText};
      font-size: 14px;
      font-weight: 600;
    }
    .graph-edge-path path {
      fill: none;
      stroke: ${palette.edge};
      stroke-width: 2px;
    }
    .graph-edge-arrowhead path {
      fill: ${palette.edge};
      stroke: none;
    }
    .edgeLabel text {
      fill: ${palette.label};
      font-size: 12px;
    }
    .graph-title {
      fill: ${palette.title};
      font-size: 24px;
      font-weight: 700;
    }
  `;
}

async function svgToPngBlob(svgMarkup) {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const viewBox = graphSvg.viewBox.baseVal;
    const canvas = document.createElement("canvas");
    const scale = window.devicePixelRatio > 1 ? 2 : 1;
    canvas.width = viewBox.width * scale;
    canvas.height = viewBox.height * scale;

    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.fillStyle = getComputedStyle(document.body).backgroundColor || "#0b1220";
    context.fillRect(0, 0, viewBox.width, viewBox.height);
    context.drawImage(image, 0, 0, viewBox.width, viewBox.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((output) => {
        if (output) {
          resolve(output);
        } else {
          reject(new Error("Canvas export returned an empty file."));
        }
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not render SVG to image."));
    image.src = url;
  });
}

function downloadFile(filename, contentType, content) {
  const blob = new Blob([content], { type: contentType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showStatus(message, variant) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${variant}`;
}

function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.className = "status-message";
}

function debounce(callback, delayMs) {
  let timeoutId = null;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delayMs);
  };
}
