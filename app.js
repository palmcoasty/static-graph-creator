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
const previewTitle = document.getElementById("previewTitle");
const themePill = document.getElementById("themePill");
const nodeCountPill = document.getElementById("nodeCountPill");
const edgeCountPill = document.getElementById("edgeCountPill");
const statusMessage = document.getElementById("statusMessage");
const graphSvg = document.getElementById("graphSvg");

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
    graphInput.value = JSON.stringify(parsed, null, 2);
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
  const parsedGraph = parseGraphInput();
  if (!parsedGraph) {
    return null;
  }

  const direction = directionSelect.value;
  const title = titleInput.value.trim() || "Untitled Graph";
  const theme = THEME_DEFINITIONS.some((item) => item.id === state.theme) ? state.theme : DEFAULT_STATE.theme;

  return { graph: parsedGraph, direction, title, theme };
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

  const graphDimensions = graph.graph();
  const titleOffset = currentState.title ? 18 : 0;

  if (currentState.title) {
    inner
      .append("text")
      .attr("class", "graph-title")
      .attr("x", graphDimensions.width / 2)
      .attr("y", -titleOffset)
      .attr("text-anchor", "middle")
      .text(currentState.title);
  }

  inner.attr("transform", `translate(24, ${currentState.title ? 48 : 24})`);
  svgSelection.attr("width", graphDimensions.width + 48);
  svgSelection.attr("height", graphDimensions.height + (currentState.title ? 96 : 48));
  svgSelection.attr("viewBox", `0 0 ${graphDimensions.width + 48} ${graphDimensions.height + (currentState.title ? 96 : 48)}`);

  previewTitle.textContent = currentState.title;
  nodeCountPill.textContent = `${currentState.graph.nodes.length} nodes`;
  edgeCountPill.textContent = `${currentState.graph.edges.length} edges`;
  themePill.textContent = theme.name;
}

function getThemeById(themeId) {
  return THEME_DEFINITIONS.find((theme) => theme.id === themeId) || THEME_DEFINITIONS[0];
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
