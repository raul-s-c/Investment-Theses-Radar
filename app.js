const STORAGE_KEY = "thesis-radar-state-v4";
const DATA_SOURCES = [
  { id: "stooq", label: "Stooq CSV" },
  { id: "yahoo-chart", label: "Yahoo chart" },
];

const catalog = [
  {
    ticker: "0388.HK",
    name: "HKEX",
    company: "Hong Kong Exchanges & Clearing",
    sector: "Bolsa / Infraestructura de mercado",
    currency: "HK$",
    price: 392.4,
    change: 1.2,
    score: 78,
    previousScore: 76,
    thesisScore: 91,
    fundamentalsScore: 86,
    valuationScore: 68,
    newsScore: 82,
    technicalScore: 57,
    signal: "tesis fuerte",
    thesis: "China continua aumentando su peso economico y financiero global. Hong Kong mantiene su papel como mercado de capital entre China y los mercados internacionales.",
    drivers: ["Actividad de IPOs en China y Hong Kong", "Volumenes de Stock Connect en aumento", "Inversion hacia China Southbound", "Crecimiento de derivados y productos"],
    breakers: ["Hong Kong pierde relevancia frente a Shanghai/Shenzhen", "Restricciones relevantes al capital extranjero", "Caida estructural en volumenes de negociacion"],
    risks: ["Intervencion regulatoria/politica", "Tensiones geopoliticas", "Ciclos bajistas en mercados de capitales"],
    keyLevels: [["Precio de compra", "< HK$400.00"], ["Compra fuerte", "< HK$360.00"], ["Maximo 52 semanas", "HK$469.00"], ["Minimo 52 semanas", "HK$275.00"]],
    events: [["Resultados", "27 ago", "Volumen, margen y guidance"], ["Dividendo", "05 sep", "Pago estimado y payout"]],
    history: [55, 58, 60, 63, 68, 72, 66, 61, 70, 73, 78, 76, 79, 84, 78],
  },
  {
    ticker: "D05.SI",
    name: "DBS Group",
    company: "DBS Group Holdings",
    sector: "Banca / Gestion de riqueza",
    currency: "S$",
    price: 75.6,
    change: -0.3,
    score: 71,
    previousScore: 72,
    thesisScore: 78,
    fundamentalsScore: 84,
    valuationScore: 62,
    newsScore: 66,
    technicalScore: 58,
    signal: "estable",
    thesis: "DBS mantiene una franquicia bancaria lider en Singapur y Asia, con buenos retornos sobre capital y exposicion a crecimiento patrimonial regional.",
    drivers: ["ROE alto y estable", "Crecimiento de wealth management", "Balance solido", "Disciplina de costes"],
    breakers: ["Deterioro fuerte del credito", "Caida sostenida de margen financiero", "Exceso de exposicion inmobiliaria problematica"],
    risks: ["Tipos a la baja", "Riesgo crediticio regional", "Ciclo inmobiliario asiatico"],
    keyLevels: [["Precio de compra", "< S$73.00"], ["Compra fuerte", "< S$68.00"], ["Maximo 52 semanas", "S$78.90"], ["Minimo 52 semanas", "S$54.20"]],
    events: [["Resultados", "08 nov", "NIM, coste de riesgo y depositos"], ["Dividendo", "18 sep", "Dividendo trimestral esperado"]],
    history: [62, 63, 65, 68, 69, 74, 72, 70, 71, 73, 72, 70, 71, 72, 71],
  },
  {
    ticker: "M44U.SI",
    name: "Mapletree Log. Trust",
    company: "Mapletree Logistics Trust",
    sector: "Logistica / Infraestructura",
    currency: "S$",
    price: 1.17,
    change: 0.6,
    score: 81,
    previousScore: 80,
    thesisScore: 87,
    fundamentalsScore: 74,
    valuationScore: 79,
    newsScore: 75,
    technicalScore: 69,
    signal: "tesis fuerte",
    thesis: "La demanda de activos logisticos en Asia sigue apoyada por comercio regional, e-commerce y cadenas de suministro mas resilientes.",
    drivers: ["Portfolio diversificado", "Activos logisticos criticos", "Yield atractivo", "Sponsor de calidad"],
    breakers: ["Recorte estructural de DPU", "Apalancamiento persistentemente alto", "Ocupacion por debajo de niveles objetivo"],
    risks: ["Tipos de interes", "Refinanciacion", "Debilidad de alquileres logisticos"],
    keyLevels: [["Precio de compra", "< S$1.20"], ["Compra fuerte", "< S$1.05"], ["Maximo 52 semanas", "S$1.62"], ["Minimo 52 semanas", "S$1.03"]],
    events: [["Resultados", "24 oct", "Ocupacion, DPU y deuda"], ["Dividendo", "12 nov", "Distribucion trimestral"]],
    history: [68, 69, 70, 72, 71, 74, 76, 75, 78, 80, 79, 81, 83, 80, 81],
  },
  {
    ticker: "0700.HK",
    name: "Tencent",
    company: "Tencent Holdings",
    sector: "Internet / Entretenimiento",
    currency: "HK$",
    price: 602.0,
    change: 0.8,
    score: 84,
    previousScore: 83,
    thesisScore: 88,
    fundamentalsScore: 87,
    valuationScore: 72,
    newsScore: 80,
    technicalScore: 73,
    signal: "tesis fuerte",
    thesis: "Tencent combina ecosistema social, gaming y pagos con monetizacion publicitaria y disciplina de recompras.",
    drivers: ["Recompras", "Gaming internacional", "WeChat como infraestructura", "Margen publicitario"],
    breakers: ["Nueva presion regulatoria severa", "Caida estructural de gaming", "Deterioro de monetizacion en WeChat"],
    risks: ["Regulacion china", "Competencia en IA", "Ciclo publicitario"],
    keyLevels: [["Precio de compra", "< HK$590"], ["Compra fuerte", "< HK$520"], ["Maximo 52 semanas", "HK$640"], ["Minimo 52 semanas", "HK$342"]],
    events: [["Resultados", "13 nov", "Gaming, ads y recompras"]],
    history: [70, 72, 74, 76, 78, 75, 79, 82, 81, 83, 84, 86, 83, 85, 84],
  },
  {
    ticker: "9988.HK",
    name: "Alibaba",
    company: "Alibaba Group Holding",
    sector: "E-commerce / Cloud",
    currency: "HK$",
    price: 141.6,
    change: -0.4,
    score: 81,
    previousScore: 79,
    thesisScore: 82,
    fundamentalsScore: 79,
    valuationScore: 86,
    newsScore: 73,
    technicalScore: 68,
    signal: "estable",
    thesis: "Alibaba ofrece valoracion contenida, opcion de recuperacion en consumo chino y potencial de cloud si mejora la ejecucion.",
    drivers: ["Valoracion baja", "Cloud e IA", "Recompras", "Recuperacion de consumo"],
    breakers: ["Perdida de cuota acelerada", "Cloud sin crecimiento rentable", "Nueva intervencion regulatoria"],
    risks: ["Competencia domestica", "Macroeconomia china", "Gobernanza"],
    keyLevels: [["Precio de compra", "< HK$135"], ["Compra fuerte", "< HK$115"], ["Maximo 52 semanas", "HK$162"], ["Minimo 52 semanas", "HK$68"]],
    events: [["Resultados", "15 nov", "Cloud, take rate y recompras"]],
    history: [58, 60, 64, 66, 70, 73, 74, 76, 78, 75, 77, 80, 79, 82, 81],
  },
  {
    ticker: "600519.SS",
    name: "Kweichow Moutai",
    company: "Kweichow Moutai",
    sector: "Consumo premium",
    currency: "CNY ",
    price: 1508.2,
    change: 0.2,
    score: 76,
    previousScore: 76,
    thesisScore: 80,
    fundamentalsScore: 91,
    valuationScore: 54,
    newsScore: 69,
    technicalScore: 60,
    signal: "estable",
    thesis: "Marca premium con poder de precios, retornos excepcionales y caja neta, aunque la valoracion exige crecimiento sostenido.",
    drivers: ["Marca dominante", "Margen alto", "Caja neta", "Distribucion controlada"],
    breakers: ["Deterioro de demanda premium", "Presion politica sobre precios", "Inventario excesivo en canal"],
    risks: ["Consumo chino", "Valoracion", "Regulacion de lujo"],
    keyLevels: [["Precio de compra", "< CNY 1450"], ["Compra fuerte", "< CNY 1300"], ["Maximo 52 semanas", "CNY 1888"], ["Minimo 52 semanas", "CNY 1240"]],
    events: [["Resultados", "30 oct", "Crecimiento y canal"]],
    history: [80, 81, 82, 79, 78, 77, 75, 74, 76, 77, 75, 76, 77, 76, 76],
  },
  {
    ticker: "005930.KS",
    name: "Samsung Electronics",
    company: "Samsung Electronics",
    sector: "Semiconductores / Hardware",
    currency: "KRW ",
    price: 87600,
    change: 1.5,
    score: 80,
    previousScore: 78,
    thesisScore: 81,
    fundamentalsScore: 82,
    valuationScore: 73,
    newsScore: 78,
    technicalScore: 76,
    signal: "tesis fuerte",
    thesis: "Samsung se beneficia del ciclo de memoria, IA en centros de datos y normalizacion de inventarios.",
    drivers: ["Ciclo DRAM/NAND", "HBM e IA", "Balance solido", "Escala de fabricacion"],
    breakers: ["Perdida sostenida en HBM", "Caida de precios de memoria", "Capex improductivo"],
    risks: ["Ciclo semiconductor", "Competencia TSMC/SK Hynix", "Geopolitica"],
    keyLevels: [["Precio de compra", "< KRW 85000"], ["Compra fuerte", "< KRW 76000"], ["Maximo 52 semanas", "KRW 93000"], ["Minimo 52 semanas", "KRW 65000"]],
    events: [["Resultados", "31 oct", "Memoria, HBM y capex"]],
    history: [61, 64, 67, 69, 72, 75, 78, 77, 79, 82, 80, 78, 79, 81, 80],
  },
  {
    ticker: "ASML.AS",
    name: "ASML",
    company: "ASML Holding",
    sector: "Semiconductores / Equipos",
    currency: "EUR ",
    price: 731.5,
    change: -0.7,
    score: 79,
    previousScore: 80,
    thesisScore: 86,
    fundamentalsScore: 88,
    valuationScore: 57,
    newsScore: 70,
    technicalScore: 62,
    signal: "estable",
    thesis: "ASML conserva una posicion casi monopolistica en litografia avanzada, clave para nodos punteros de semiconductores.",
    drivers: ["Monopolio EUV", "Backlog profundo", "Demanda IA", "Pricing power"],
    breakers: ["Restricciones exportacion mucho mas duras", "Retraso estructural High-NA", "Cancelacion de capex de clientes clave"],
    risks: ["China export controls", "Ciclo de capex", "Valoracion exigente"],
    keyLevels: [["Precio de compra", "< EUR 720"], ["Compra fuerte", "< EUR 640"], ["Maximo 52 semanas", "EUR 1021"], ["Minimo 52 semanas", "EUR 580"]],
    events: [["Resultados", "16 oct", "Pedidos y guidance"]],
    history: [72, 74, 78, 80, 83, 82, 81, 79, 80, 78, 77, 79, 81, 80, 79],
  },
];

const routes = ["watchlist", "detail", "report", "thesis", "history", "calendar", "add", "discovery", "settings"];
const routeHistory = ["watchlist"];
const screenTitle = document.querySelector("#screenTitle");
const screenSubtitle = document.querySelector("#screenSubtitle");
const backButton = document.querySelector("#backButton");
const topAction = document.querySelector("#topAction");
const watchlistRows = document.querySelector("#watchlistRows");
const searchResults = document.querySelector("#searchResults");
const discoveryResults = document.querySelector("#discoveryResults");
const tickerSearch = document.querySelector("#tickerSearch");

let state = loadState();

function loadState() {
  const fallback = {
    portfolio: ["0388.HK", "D05.SI", "M44U.SI"],
    selectedTicker: "0388.HK",
    lastReviewByTicker: {},
    overridesByTicker: {},
    positionByTicker: {
      "0388.HK": { shares: 12, averageCost: 365 },
      "D05.SI": { shares: 60, averageCost: 68 },
      "M44U.SI": { shares: 1200, averageCost: 1.12 },
    },
    customCatalog: [],
    dataStatusByTicker: {},
    lastDataRefresh: null,
    settings: {
      webSearch: false,
      autoReviews: false,
      dataSource: "Stooq/Yahoo manual",
    },
  };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      ...fallback,
      ...stored,
      lastReviewByTicker: { ...fallback.lastReviewByTicker, ...stored.lastReviewByTicker },
      overridesByTicker: { ...fallback.overridesByTicker, ...stored.overridesByTicker },
      positionByTicker: { ...fallback.positionByTicker, ...stored.positionByTicker },
      customCatalog: Array.isArray(stored.customCatalog) ? stored.customCatalog : fallback.customCatalog,
      dataStatusByTicker: { ...fallback.dataStatusByTicker, ...stored.dataStatusByTicker },
      settings: { ...fallback.settings, ...stored.settings },
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function allAssets() {
  return [...catalog, ...(state.customCatalog || [])];
}

function assetByTicker(ticker = state.selectedTicker) {
  const base = allAssets().find((asset) => asset.ticker === ticker) || catalog[0];
  const override = state.overridesByTicker?.[base.ticker] || {};
  return { ...base, ...override };
}

function portfolioAssets() {
  return state.portfolio.map((ticker) => assetByTicker(ticker)).filter(Boolean);
}

function formatPrice(asset) {
  return `${asset.currency}${asset.price.toLocaleString("es-ES", { maximumFractionDigits: asset.price > 100 ? 1 : 2 })}`;
}

function positionValue(asset) {
  const position = state.positionByTicker?.[asset.ticker] || { shares: 0, averageCost: 0 };
  return position.shares * asset.price;
}

function formatCompactValue(value) {
  if (!Number.isFinite(value) || value <= 0) return "Sin posicion";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
}

function formatTimestamp(value) {
  if (!value) return "Pendiente";
  return new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toneForScore(score) {
  if (score >= 78) return "good";
  if (score >= 63) return "warn";
  return "bad";
}

function signalForScore(score) {
  if (score >= 80) return "tesis fuerte";
  if (score >= 68) return "estable";
  if (score >= 55) return "vigilar";
  return "tesis rota";
}

function logoText(ticker) {
  if (ticker.includes("0388")) return "HKEX";
  if (ticker.includes("D05")) return "DBS";
  if (ticker.includes("M44")) return "MLT";
  return ticker.split(".")[0].slice(0, 4);
}

function actionIcon(kind) {
  const icons = {
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />',
    share: '<path d="M4 12v8h16v-8" /><path d="M12 16V3" /><path d="m8 7 4-4 4 4" />',
    none: "",
  };
  return icons[kind] || icons.none;
}

function assetRow(asset, mode = "portfolio") {
  const tone = toneForScore(asset.score);
  const signalClass = tone === "good" ? "good-bg" : tone === "warn" ? "warn-bg" : "bad-bg";
  const inPortfolio = state.portfolio.includes(asset.ticker);

  if (mode === "search") {
    return `
      <article class="asset-row">
        <div>
          <h3>${asset.ticker}</h3>
          <p>${asset.company}</p>
        </div>
        <button class="add-mini" type="button" data-add-ticker="${asset.ticker}" aria-label="${inPortfolio ? "Ya anadido" : "Anadir"} ${asset.ticker}">${inPortfolio ? "✓" : "+"}</button>
      </article>
    `;
  }

  return `
    <article class="asset-row asset-row-action">
      <button class="asset-main" type="button" data-open-ticker="${asset.ticker}" data-route="detail">
        <span class="logo-mark">${logoText(asset.ticker)}</span>
        <span>
          <h3>${asset.ticker}</h3>
          <p>${asset.name}<br><span class="${tone}">Score ${asset.score}/100</span></p>
        </span>
        <span class="asset-price">
          <strong>${formatPrice(asset)}</strong>
          <span class="${signalClass}">${signalForScore(asset.score)}</span>
          <p class="${asset.change >= 0 ? "good" : "bad"}">${asset.change >= 0 ? "+" : ""}${asset.change}% · ${formatCompactValue(positionValue(asset))}</p>
        </span>
      </button>
      <button class="remove-mini" type="button" data-remove-ticker="${asset.ticker}" aria-label="Quitar activo">x</button>
    </article>
  `;
}

function eventRow(event, asset) {
  const [type, date, note] = event;
  return `
    <button class="calendar-row" type="button" data-open-ticker="${asset.ticker}" data-route="detail">
      <span class="calendar-date">${date}</span>
      <span>
        <h3>${asset.ticker}</h3>
        <p>${type} · ${note}</p>
      </span>
      <strong class="${toneForScore(asset.score)}">${asset.score}</strong>
    </button>
  `;
}

function renderWatchlist() {
  const assets = portfolioAssets();
  const refreshLabel = state.lastDataRefresh ? `Ultima actualizacion: ${formatTimestamp(state.lastDataRefresh)}` : "Ultima actualizacion: manual";
  document.querySelector("#screen-watchlist .tiny").textContent = `${refreshLabel}. Sin web search.`;
  const counts = assets.reduce(
    (acc, asset) => {
      const signal = signalForScore(asset.score);
      if (signal === "tesis fuerte") acc.strong += 1;
      if (signal === "estable") acc.stable += 1;
      if (signal === "vigilar") acc.watch += 1;
      if (signal === "tesis rota") acc.broken += 1;
      return acc;
    },
    { strong: 0, stable: 0, watch: 0, broken: 0 }
  );

  document.querySelector(".day-summary").innerHTML = `
    <div><strong class="good">${counts.strong}</strong><span>tesis fuerte</span></div>
    <div><strong class="good">${counts.stable}</strong><span>estable</span></div>
    <div><strong class="warn">${counts.watch}</strong><span>vigilar</span></div>
    <div><strong class="bad">${counts.broken}</strong><span>rota</span></div>
  `;

  const quickActions = document.querySelector("#screen-watchlist .quick-actions");
  if (quickActions) {
    quickActions.innerHTML = `
      <button data-route="history" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></svg>
        <span>Historico de scores</span>
      </button>
      <button data-route="calendar" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4" /><path d="M17 3v4" /><path d="M4 8h16" /><path d="M5 5h14v15H5z" /></svg>
        <span>Calendario</span>
      </button>
      <button data-route="discovery" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3" /><path d="M12 18v3" /><path d="M3 12h3" /><path d="M18 12h3" /><path d="m7.8 7.8 2.1 2.1" /><path d="m14.1 14.1 2.1 2.1" /><path d="m16.2 7.8-2.1 2.1" /><path d="m9.9 14.1-2.1 2.1" /></svg>
        <span>Thesis Discovery</span>
      </button>
      <button type="button" data-refresh-local>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14.9 4M4 12A8 8 0 0 1 18.9 8M18 4v4h-4M6 20v-4h4" /></svg>
        <span>Actualizar datos</span>
      </button>
    `;
  }

  watchlistRows.innerHTML = assets.length
    ? assets.map((asset) => assetRow(asset)).join("")
    : '<article class="panel empty-state"><h2>Portfolio vacio</h2><p>Anade un ticker para empezar a monitorizar su tesis.</p></article>';
}

function sparkline(values, className = "") {
  const width = 320;
  const height = 150;
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min)) * (height - 18) - 9;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<polyline class="${className}" points="${points}" />`;
}

function renderDetail() {
  const asset = assetByTicker();
  const dataStatus = state.dataStatusByTicker?.[asset.ticker];
  document.querySelector("#screen-detail").innerHTML = `
    <article class="asset-hero">
      <div class="logo-mark">${logoText(asset.ticker)}</div>
      <div><h2>${asset.ticker}</h2><p>${asset.company}</p></div>
    </article>
    <div class="price-row">
      <div>
        <strong>${formatPrice(asset)}</strong>
        <span class="${asset.change >= 0 ? "good" : "bad"}">${asset.change >= 0 ? "+" : ""}${asset.change}% hoy</span>
      </div>
      <button class="signal-button ${toneForScore(asset.score) === "good" ? "good-bg" : "warn-bg"}" type="button">${signalForScore(asset.score)}</button>
    </div>
    <nav class="tabs" aria-label="Detalle de activo">
      <button class="is-selected" type="button">Resumen</button>
      <button type="button" data-route="thesis">Analisis</button>
      <button type="button" data-route="report">Informe</button>
      <button type="button" data-route="history">Scores</button>
    </nav>
    <div class="quick-actions compact-actions" aria-label="Accesos del activo">
      <button data-route="history" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></svg>
        <span>Historico</span>
      </button>
      <button data-route="thesis" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v10l8 4 8-4V7z" /><path d="M12 7v14" /></svg>
        <span>Ver tesis</span>
      </button>
      <button data-route="calendar" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4" /><path d="M17 3v4" /><path d="M4 8h16" /><path d="M5 5h14v15H5z" /></svg>
        <span>Calendario</span>
      </button>
      <button type="button" data-edit-position="${asset.ticker}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16" /><path d="M7 16l9-9 3 3-9 9H7z" /></svg>
        <span>Posicion</span>
      </button>
    </div>
    <article class="panel">
      <h2>Posicion</h2>
      <dl class="metric-list">${positionMetrics(asset)}</dl>
    </article>
    <article class="panel data-status-card">
      <h2>Datos financieros</h2>
      <dl class="metric-list">
        <div><dt>Fuente</dt><dd>${dataStatus?.source || "Catalogo local"}</dd></div>
        <div><dt>Actualizado</dt><dd>${formatTimestamp(dataStatus?.at)}</dd></div>
        <div><dt>Estado</dt><dd class="${dataStatus?.ok === false ? "warn" : "good"}">${dataStatus?.message || "Listo para actualizar manualmente"}</dd></div>
      </dl>
    </article>
    <article class="panel">
      <h2>Grafico de precio</h2>
      <div class="range-tabs"><span>1D</span><span>1S</span><span class="is-on">1M</span><span>3M</span><span>1A</span><span>5A</span></div>
      <svg class="line-chart" viewBox="0 0 320 150" role="img" aria-label="Grafico de precio de ${asset.ticker}">
        <path class="gridline" d="M0 35h320M0 75h320M0 115h320" />
        ${sparkline(asset.history)}
      </svg>
    </article>
    <article class="panel">
      <h2>Niveles clave</h2>
      <dl class="metric-list">${asset.keyLevels.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("")}</dl>
    </article>
    <article class="panel event-list">
      <h2>Eventos proximos</h2>
      ${asset.events.map(([type, date, note]) => `<p><strong>${date}</strong><span>${type}</span>${note}</p>`).join("")}
    </article>
  `;
}

function positionMetrics(asset) {
  const position = state.positionByTicker?.[asset.ticker] || { shares: 0, averageCost: 0 };
  const value = position.shares * asset.price;
  const cost = position.shares * position.averageCost;
  const pnl = cost ? ((value - cost) / cost) * 100 : 0;
  return [
    ["Titulos", position.shares || 0],
    ["Coste medio", position.averageCost ? `${asset.currency}${position.averageCost}` : "No definido"],
    ["Valor estimado", value ? `${asset.currency}${value.toLocaleString("es-ES", { maximumFractionDigits: 0 })}` : "No definido"],
    ["Rentabilidad", cost ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%` : "No definida"],
  ]
    .map(([key, valueText]) => `<div><dt>${key}</dt><dd>${valueText}</dd></div>`)
    .join("");
}

function reviewSummary(asset) {
  if (asset.score >= 78) return `La tesis de ${asset.name} se mantiene solida. Los drivers principales siguen activos y ningun breaker local ha sido activado.`;
  if (asset.score >= 65) return `La tesis de ${asset.name} sigue en pie, pero requiere vigilancia por valoracion, tecnico o sensibilidad a eventos proximos.`;
  return `La tesis de ${asset.name} necesita revision profunda antes de aumentar exposicion. Hay senales que podrian debilitar la conviccion.`;
}

function scoreLine(label, value) {
  return `<div><span>${label}</span><meter min="0" max="100" value="${value}"></meter><strong>${value}/100</strong></div>`;
}

function renderReport() {
  const asset = assetByTicker();
  const last = state.lastReviewByTicker[asset.ticker];
  const dataStatus = state.dataStatusByTicker?.[asset.ticker];
  const scoreDelta = asset.score - asset.previousScore;
  document.querySelector("#screen-report").innerHTML = `
    <article class="panel report-card">
      <div>
        <h2>${asset.ticker} - ${asset.name}</h2>
        <p>Score <strong>${asset.score}</strong>/100</p>
        <span class="${scoreDelta >= 0 ? "good" : "bad"}">Anterior: ${asset.previousScore}/100 ${scoreDelta >= 0 ? "+" : ""}${scoreDelta}</span>
      </div>
      <button class="signal-button ${toneForScore(asset.score) === "good" ? "good-bg" : "warn-bg"}" type="button">${signalForScore(asset.score)}</button>
    </article>
    <article class="panel">
      <h2>Resumen ejecutivo</h2>
      <p>${reviewSummary(asset)}</p>
      <div class="score-bars">
        ${scoreLine("Tesis", asset.thesisScore)}
        ${scoreLine("Fundamentales", asset.fundamentalsScore)}
        ${scoreLine("Valoracion", asset.valuationScore)}
        ${scoreLine("Noticias", asset.newsScore)}
        ${scoreLine("Tecnico", asset.technicalScore)}
      </div>
    </article>
    <article class="panel">
      <h2>Revision manual</h2>
      <p id="manualReviewText">${last ? last.message : "Pulsa revisar para validar la tesis con los datos locales disponibles. No se haran busquedas web."}</p>
      <button class="wide-button" id="manualReviewButton" type="button">${last ? "Revisar de nuevo" : "Revisar tesis ahora"}</button>
    </article>
    <article class="panel insight-list">
      <h2>Que cambio desde la ultima revision</h2>
      <p><span class="ok-dot"></span>Eventos guardados revisados contra drivers y breakers.</p>
      <p><span class="${dataStatus?.ok ? "ok-dot" : "warn-dot"}"></span>${dataStatus?.message || "Datos financieros pendientes de actualizar manualmente."}</p>
    </article>
  `;
  document.querySelector("#manualReviewButton").addEventListener("click", runManualReview);
}

function renderThesis() {
  const asset = assetByTicker();
  document.querySelector("#screen-thesis").innerHTML = `
    <article class="asset-hero">
      <div class="logo-mark">${logoText(asset.ticker)}</div>
      <div><h2>${asset.ticker}</h2><p>${asset.company}</p></div>
    </article>
    <div class="quick-actions compact-actions">
      <button type="button" data-edit-thesis="${asset.ticker}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16" /><path d="M7 16l9-9 3 3-9 9H7z" /></svg>
        <span>Editar tesis</span>
      </button>
      <button type="button" data-run-review="${asset.ticker}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14.9 4M4 12A8 8 0 0 1 18.9 8M18 4v4h-4M6 20v-4h4" /></svg>
        <span>Revisar ahora</span>
      </button>
    </div>
    <article class="panel">
      <h2>Resumen de la tesis</h2>
      <p>${asset.thesis}</p>
    </article>
    <article class="panel checklist">
      <h2>Drivers positivos</h2>
      ${asset.drivers.map((item) => `<p><span class="ok-dot"></span>${item}</p>`).join("")}
    </article>
    <article class="panel checklist">
      <h2>Thesis breakers</h2>
      ${asset.breakers.map((item) => `<p><span class="bad-dot"></span>${item}</p>`).join("")}
    </article>
    <article class="panel checklist">
      <h2>Riesgos principales</h2>
      ${asset.risks.map((item) => `<p><span class="warn-dot"></span>${item}</p>`).join("")}
    </article>
    <article class="panel event-list">
      <h2>Eventos que alimentan la tesis</h2>
      ${asset.events.map(([type, date, note]) => `<p><strong>${date}</strong><span>${type}</span>${note}</p>`).join("")}
    </article>
  `;
}

function renderHistory() {
  const asset = assetByTicker();
  document.querySelector("#screen-history").innerHTML = `
    <div class="range-tabs large"><span class="is-on">1M</span><span>3M</span><span>6M</span><span>1A</span><span>Todo</span></div>
    <article class="panel">
      <h2>Score total</h2>
      <svg class="line-chart tall" viewBox="0 0 320 180" role="img" aria-label="Historico de score total de ${asset.ticker}">
        <path class="gridline" d="M0 35h320M0 75h320M0 115h320M0 155h320" />
        ${sparkline(asset.history, "green")}
      </svg>
    </article>
    <article class="panel">
      <h2>Desglose de scores</h2>
      <svg class="line-chart tall multi" viewBox="0 0 320 180" role="img" aria-label="Historico desglosado de ${asset.ticker}">
        <path class="gridline" d="M0 35h320M0 75h320M0 115h320M0 155h320" />
        ${sparkline(asset.history.map((v) => Math.min(100, v + 8)), "green")}
        ${sparkline(asset.history.map((v, i) => Math.max(0, v - 5 + (i % 3) * 2)), "cyan")}
        ${sparkline(asset.history.map((v, i) => Math.max(0, v - 14 + (i % 4))), "yellow")}
        ${sparkline(asset.history.map((v, i) => Math.max(0, v - 10 - (i % 2) * 3)), "purple")}
      </svg>
      <div class="legend"><span class="good">Tesis</span><span>Fundamentales</span><span class="warn">Valoracion</span><span class="purple-text">Noticias</span></div>
    </article>
  `;
}

function renderCalendar() {
  const items = portfolioAssets()
    .flatMap((asset) => asset.events.map((event) => ({ asset, event })))
    .sort((a, b) => a.event[1].localeCompare(b.event[1]));
  document.querySelector("#screen-calendar").innerHTML = `
    <div class="range-tabs large"><span class="is-on">Todos</span><span>Resultados</span><span>Dividendos</span><span>Watchlist</span></div>
    <article class="panel">
      <h2>Eventos que alimentan la tesis</h2>
      <p>Resultados, dividendos y catalizadores se usan como contexto en la revision manual. No se consulta internet automaticamente.</p>
    </article>
    <div class="calendar-list">
      ${items.length ? items.map(({ asset, event }) => eventRow(event, asset)).join("") : '<article class="panel"><h2>Sin eventos</h2><p>Edita una tesis y anade eventos para construir el calendario.</p></article>'}
    </div>
  `;
}

function renderSettings() {
  const failures = Object.values(state.dataStatusByTicker || {}).filter((item) => item.ok === false).length;
  document.querySelector("#screen-settings").innerHTML = `
    <article class="panel">
      <h2>Cuenta</h2>
      <dl class="metric-list">
        <div><dt>Sincronizacion en la nube</dt><dd class="warn">Desactivada</dd></div>
        <div><dt>Datos guardados</dt><dd>${state.portfolio.length} activos</dd></div>
      </dl>
    </article>
    <article class="panel">
      <h2>Datos</h2>
      <dl class="metric-list">
        <div><dt>Fuente financiera MVP</dt><dd>${state.settings.dataSource}</dd></div>
        <div><dt>Ultima actualizacion</dt><dd>${formatTimestamp(state.lastDataRefresh)}</dd></div>
        <div><dt>Fallos de fuente</dt><dd class="${failures ? "warn" : "good"}">${failures}</dd></div>
        <div><dt>Revision automatica</dt><dd>Desactivada</dd></div>
        <div><dt>Web search</dt><dd class="warn">Siempre manual</dd></div>
      </dl>
      <button class="wide-button ghost" type="button" data-refresh-local>Actualizar precios gratis</button>
      <button class="wide-button ghost" type="button" data-simulate-local>Simular movimiento local</button>
    </article>
    <article class="panel">
      <h2>Backup local</h2>
      <p>Exporta el estado para moverlo entre navegadores o restaurarlo despues.</p>
      <textarea class="backup-box" id="backupBox" placeholder="Aqui aparecera o pegaras tu backup JSON"></textarea>
      <div class="button-grid">
        <button class="wide-button ghost" type="button" data-export-state>Exportar</button>
        <button class="wide-button ghost" type="button" data-import-state>Importar</button>
      </div>
      <button class="wide-button ghost danger-action" type="button" data-reset-state>Reset local</button>
    </article>
    <article class="panel">
      <h2>IA</h2>
      <dl class="metric-list">
        <div><dt>Modelo previsto</dt><dd>gpt-5.4-mini</dd></div>
        <div><dt>Modo por defecto</dt><dd>Sin busquedas</dd></div>
        <div><dt>Revision</dt><dd>Bajo demanda</dd></div>
      </dl>
    </article>
  `;
}

function listToText(items) {
  return (items || []).join("\n");
}

function textToList(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function eventsToText(events) {
  return (events || []).map(([type, date, note]) => `${type} | ${date} | ${note}`).join("\n");
}

function textToEvents(text) {
  return textToList(text).map((line) => {
    const [type = "Evento", date = "Sin fecha", note = "Pendiente de describir"] = line.split("|").map((item) => item.trim());
    return [type, date, note];
  });
}

function openDialog(title, bodyHtml) {
  closeDialog();
  const dialog = document.createElement("section");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `
    <form class="modal-card">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="icon-button" type="button" data-close-dialog aria-label="Cerrar">x</button>
      </div>
      ${bodyHtml}
    </form>
  `;
  document.body.appendChild(dialog);
  return dialog;
}

function closeDialog() {
  document.querySelector(".modal-backdrop")?.remove();
}

function openThesisEditor(ticker) {
  const asset = assetByTicker(ticker);
  const dialog = openDialog(
    `Editar ${asset.ticker}`,
    `
      <label class="form-field">Tesis<textarea name="thesis">${asset.thesis}</textarea></label>
      <label class="form-field">Drivers<textarea name="drivers">${listToText(asset.drivers)}</textarea></label>
      <label class="form-field">Breakers<textarea name="breakers">${listToText(asset.breakers)}</textarea></label>
      <label class="form-field">Riesgos<textarea name="risks">${listToText(asset.risks)}</textarea></label>
      <label class="form-field">Eventos<textarea name="events">${eventsToText(asset.events)}</textarea><small>Formato: Tipo | fecha | impacto en tesis</small></label>
      <button class="wide-button" type="submit">Guardar tesis</button>
    `
  );
  dialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.overridesByTicker[ticker] = {
      ...(state.overridesByTicker[ticker] || {}),
      thesis: form.get("thesis").trim(),
      drivers: textToList(form.get("drivers")),
      breakers: textToList(form.get("breakers")),
      risks: textToList(form.get("risks")),
      events: textToEvents(form.get("events")),
    };
    saveState();
    closeDialog();
    renderActiveScreen(document.querySelector(".screen.is-active").id.replace("screen-", ""));
    showToast("Tesis guardada");
  });
}

function openPositionEditor(ticker) {
  const asset = assetByTicker(ticker);
  const position = state.positionByTicker[ticker] || { shares: 0, averageCost: 0 };
  const dialog = openDialog(
    `Posicion ${asset.ticker}`,
    `
      <label class="form-field">Titulos<input name="shares" type="number" min="0" step="0.0001" value="${position.shares || 0}" /></label>
      <label class="form-field">Coste medio<input name="averageCost" type="number" min="0" step="0.0001" value="${position.averageCost || 0}" /></label>
      <button class="wide-button" type="submit">Guardar posicion</button>
      <button class="wide-button ghost danger-action" type="button" data-remove-ticker="${ticker}">Quitar del portfolio</button>
    `
  );
  dialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.positionByTicker[ticker] = {
      shares: Number(form.get("shares")) || 0,
      averageCost: Number(form.get("averageCost")) || 0,
    };
    saveState();
    closeDialog();
    renderActiveScreen(document.querySelector(".screen.is-active").id.replace("screen-", ""));
    showToast("Posicion guardada");
  });
}

function renderSearch() {
  const term = tickerSearch?.value?.trim().toLowerCase() || "";
  const portfolio = new Set(state.portfolio);
  const results = allAssets().filter((asset) => {
    const haystack = `${asset.ticker} ${asset.name} ${asset.company} ${asset.sector}`.toLowerCase();
    return !term || haystack.includes(term);
  });
  const rows = results
    .filter((asset) => !portfolio.has(asset.ticker) || term)
    .map((asset) => assetRow(asset, "search"))
    .join("");
  const normalizedTicker = tickerSearch?.value?.trim().toUpperCase();
  const canCreate = normalizedTicker && !allAssets().some((asset) => asset.ticker === normalizedTicker);
  searchResults.innerHTML = `${rows}${
    canCreate
      ? `<article class="panel empty-state"><h2>${normalizedTicker}</h2><p>No esta en el catalogo local. Puedes anadirlo y completar tesis, posicion y eventos.</p><button class="wide-button ghost" type="button" data-create-ticker="${normalizedTicker}">Crear ticker manual</button></article>`
      : ""
  }`;
}

function renderDiscovery() {
  const thesisText = document.querySelector("#thesisInput")?.value || "";
  const terms = thesisText.toLowerCase();
  const scored = allAssets()
    .map((asset) => {
      let fit = asset.score;
      if (terms.includes("china") && asset.ticker.endsWith(".HK")) fit += 4;
      if (terms.includes("logistica") && asset.sector.toLowerCase().includes("logistica")) fit += 8;
      if (terms.includes("finanzas") && asset.sector.toLowerCase().includes("banca")) fit += 7;
      if (terms.includes("semiconductores") && asset.sector.toLowerCase().includes("semiconductores")) fit += 8;
      return { ...asset, fit: Math.min(99, fit) };
    })
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 4);

  discoveryResults.innerHTML = scored
    .map(
      (asset) => `
        <button class="asset-row" type="button" data-open-ticker="${asset.ticker}" data-route="detail">
          <span class="logo-mark">${logoText(asset.ticker)}</span>
          <span><h3>${asset.name} <span class="muted">${asset.ticker}</span></h3><p>${asset.sector}</p></span>
          <span class="asset-price"><strong class="good">${asset.fit}</strong><p>Fit</p></span>
        </button>
      `
    )
    .join("");
}

function renderActiveScreen(route) {
  if (route === "watchlist") renderWatchlist();
  if (route === "detail") renderDetail();
  if (route === "report") renderReport();
  if (route === "thesis") renderThesis();
  if (route === "history") renderHistory();
  if (route === "calendar") renderCalendar();
  if (route === "add") renderSearch();
  if (route === "discovery") renderDiscovery();
  if (route === "settings") renderSettings();
}

function setRoute(route, push = true) {
  if (!routes.includes(route)) return;
  renderActiveScreen(route);
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("is-active"));
  const active = document.querySelector(`#screen-${route}`);
  const asset = assetByTicker();
  active.classList.add("is-active");
  screenTitle.textContent = route === "detail" ? asset.ticker : active.dataset.title;
  screenSubtitle.textContent = ["detail", "history"].includes(route) ? asset.company : active.dataset.subtitle;
  topAction.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${actionIcon(active.dataset.action)}</svg>`;
  topAction.style.visibility = active.dataset.action === "none" ? "hidden" : "visible";
  backButton.style.visibility = route === "watchlist" ? "hidden" : "visible";
  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  if (push && routeHistory[routeHistory.length - 1] !== route) routeHistory.push(route);
}

function runManualReview() {
  const asset = assetByTicker();
  const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const nextScore = calculateLocalScore(asset);
  const history = [...(asset.history || [])].slice(-14);
  history.push(nextScore);
  state.overridesByTicker[asset.ticker] = {
    ...(state.overridesByTicker[asset.ticker] || {}),
    previousScore: asset.score,
    score: nextScore,
    history,
  };
  const eventText = asset.events.length ? `${asset.events.length} evento(s) proximos incorporados al contexto.` : "Sin eventos proximos.";
  const message = `Revision local completada a las ${now}. La tesis queda <strong class="${toneForScore(nextScore)}">${signalForScore(nextScore)}</strong>: ${eventText} No se ha usado web search.`;
  state.lastReviewByTicker[asset.ticker] = { at: now, message };
  saveState();
  renderReport();
}

function calculateLocalScore(asset) {
  const structure =
    Math.min(asset.drivers.length, 6) * 3 -
    Math.max(asset.breakers.length - 2, 0) * 2 -
    Math.max(asset.risks.length - 3, 0);
  const eventSupport = Math.min(asset.events.length, 4) * 1.5;
  const componentScore =
    asset.thesisScore * 0.34 +
    asset.fundamentalsScore * 0.24 +
    asset.valuationScore * 0.16 +
    asset.newsScore * 0.14 +
    asset.technicalScore * 0.12;
  const trend = (asset.history.at(-1) || asset.score) - (asset.history.at(-4) || asset.score);
  return Math.max(0, Math.min(100, Math.round(componentScore + structure + eventSupport + trend * 0.25 - 14)));
}

function addTicker(ticker) {
  if (!state.portfolio.includes(ticker)) state.portfolio.push(ticker);
  state.selectedTicker = ticker;
  saveState();
  showToast(`${ticker} anadido al portfolio`);
  setRoute("detail");
}

function createTicker(ticker) {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return;
  if (!allAssets().some((asset) => asset.ticker === normalized)) {
    state.customCatalog.push({
      ticker: normalized,
      name: normalized,
      company: "Activo creado manualmente",
      sector: "Pendiente de clasificar",
      currency: "",
      price: 1,
      change: 0,
      score: 60,
      previousScore: 60,
      thesisScore: 60,
      fundamentalsScore: 55,
      valuationScore: 55,
      newsScore: 50,
      technicalScore: 50,
      signal: "vigilar",
      thesis: "Pendiente de redactar tesis de inversion.",
      drivers: ["Driver pendiente"],
      breakers: ["Breaker pendiente"],
      risks: ["Riesgo pendiente"],
      keyLevels: [["Precio de compra", "Pendiente"], ["Compra fuerte", "Pendiente"], ["Maximo 52 semanas", "Pendiente"], ["Minimo 52 semanas", "Pendiente"]],
      events: [["Resultados", "Sin fecha", "Completar calendario"], ["Dividendo", "Sin fecha", "Completar si aplica"]],
      history: [60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60],
    });
  }
  addTicker(normalized);
}

function removeTicker(ticker) {
  state.portfolio = state.portfolio.filter((item) => item !== ticker);
  if (state.selectedTicker === ticker) state.selectedTicker = state.portfolio[0] || "0388.HK";
  saveState();
  closeDialog();
  showToast(`${ticker} quitado del portfolio`);
  setRoute("watchlist");
}

function simulateLocalData() {
  portfolioAssets().forEach((asset, index) => {
    const movement = Number((((asset.ticker.length + index * 3) % 7) / 10 - 0.2).toFixed(1));
    const nextPrice = Math.max(0.01, asset.price * (1 + movement / 100));
    state.overridesByTicker[asset.ticker] = {
      ...(state.overridesByTicker[asset.ticker] || {}),
      price: Number(nextPrice.toFixed(nextPrice > 100 ? 1 : 2)),
      change: movement,
    };
    state.dataStatusByTicker[asset.ticker] = {
      ok: true,
      source: "Simulacion local",
      at: new Date().toISOString(),
      message: "Movimiento local simulado",
    };
  });
  state.lastDataRefresh = new Date().toISOString();
  saveState();
  renderWatchlist();
  showToast("Datos locales actualizados");
}

async function refreshMarketData() {
  const assets = portfolioAssets();
  if (!assets.length) {
    showToast("No hay activos que actualizar");
    return;
  }
  showToast("Actualizando precios...");
  const results = await Promise.all(assets.map((asset) => fetchMarketQuote(asset)));
  results.forEach(({ asset, quote, error }) => {
    if (quote) {
      state.overridesByTicker[asset.ticker] = {
        ...(state.overridesByTicker[asset.ticker] || {}),
        price: quote.price,
        change: quote.change,
        currency: quote.currency || asset.currency,
      };
      state.dataStatusByTicker[asset.ticker] = {
        ok: true,
        source: quote.source,
        at: new Date().toISOString(),
        message: `Precio actualizado: ${quote.price}${quote.currency ? ` ${quote.currency}` : ""}`,
      };
      return;
    }
    state.dataStatusByTicker[asset.ticker] = {
      ok: false,
      source: "Stooq/Yahoo",
      at: new Date().toISOString(),
      message: error || "No se pudo leer la fuente gratuita desde el navegador",
    };
  });
  state.lastDataRefresh = new Date().toISOString();
  saveState();
  renderActiveScreen(document.querySelector(".screen.is-active").id.replace("screen-", ""));
  const ok = results.filter((item) => item.quote).length;
  showToast(`${ok}/${results.length} precios actualizados`);
}

async function fetchMarketQuote(asset) {
  for (const source of DATA_SOURCES) {
    try {
      const quote = source.id === "stooq" ? await fetchStooqQuote(asset) : await fetchYahooChartQuote(asset);
      if (quote) return { asset, quote: { ...quote, source: source.label } };
    } catch (error) {
      if (source.id === DATA_SOURCES.at(-1).id) {
        return { asset, error: error.message };
      }
    }
  }
  return { asset, error: "Fuente sin datos para este ticker" };
}

function stooqSymbol(ticker) {
  const normalized = ticker.toLowerCase();
  const replacements = [
    [/\.hk$/, ".hk"],
    [/\.si$/, ".sg"],
    [/\.ss$/, ".cn"],
    [/\.sz$/, ".cn"],
    [/\.ks$/, ".kr"],
    [/\.as$/, ".nl"],
  ];
  const [pattern, suffix] = replacements.find(([pattern]) => pattern.test(normalized)) || [];
  if (pattern) return normalized.replace(pattern, suffix);
  if (!normalized.includes(".")) return `${normalized}.us`;
  return normalized;
}

async function fetchStooqQuote(asset) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol(asset.ticker))}&f=sd2t2c&e=csv`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Stooq HTTP ${response.status}`);
  const text = await response.text();
  const [, row] = text.trim().split(/\r?\n/);
  if (!row || row.includes("N/D")) return null;
  const [symbol, date, time, close] = row.split(",");
  const price = Number(close);
  if (!Number.isFinite(price)) return null;
  const previousPrice = Number(asset.price) || price;
  const change = previousPrice ? Number((((price - previousPrice) / previousPrice) * 100).toFixed(2)) : 0;
  return { price: Number(price.toFixed(price > 100 ? 2 : 4)), change, currency: asset.currency, meta: `${symbol} ${date} ${time}` };
}

async function fetchYahooChartQuote(asset) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.ticker)}?range=5d&interval=1d`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  const closes = (result?.indicators?.quote?.[0]?.close || []).filter((value) => Number.isFinite(value));
  if (!meta?.regularMarketPrice && !closes.length) return null;
  const price = Number(meta.regularMarketPrice || closes.at(-1));
  const previousPrice = Number(closes.at(-2) || meta.chartPreviousClose || asset.price || price);
  const change = previousPrice ? Number((((price - previousPrice) / previousPrice) * 100).toFixed(2)) : 0;
  return { price: Number(price.toFixed(price > 100 ? 2 : 4)), change, currency: meta.currency ? `${meta.currency} ` : asset.currency };
}

function exportState() {
  const backupBox = document.querySelector("#backupBox");
  if (backupBox) {
    backupBox.value = JSON.stringify(state, null, 2);
    backupBox.focus();
    backupBox.select();
  }
  showToast("Backup generado");
}

function importState() {
  const backupBox = document.querySelector("#backupBox");
  try {
    const imported = JSON.parse(backupBox.value);
    state = { ...state, ...imported };
    saveState();
    showToast("Backup importado");
    setRoute("watchlist");
  } catch {
    showToast("JSON invalido");
  }
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  showToast("Datos locales reiniciados");
  setRoute("watchlist");
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.querySelector(".phone").appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function ensureDynamicScreens() {
  if (!document.querySelector("#screen-calendar")) {
    const screen = document.createElement("section");
    screen.className = "screen";
    screen.id = "screen-calendar";
    screen.dataset.title = "Calendario";
    screen.dataset.subtitle = "Eventos de tesis";
    screen.dataset.action = "none";
    document.querySelector(".bottom-nav").before(screen);
  }
}

function installServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

ensureDynamicScreens();
renderWatchlist();
renderSearch();
renderDiscovery();
setRoute("watchlist", false);
installServiceWorker();

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) {
    closeDialog();
    return;
  }

  const addButton = event.target.closest("[data-add-ticker]");
  if (addButton) {
    addTicker(addButton.dataset.addTicker);
    return;
  }

  const createButton = event.target.closest("[data-create-ticker]");
  if (createButton) {
    createTicker(createButton.dataset.createTicker);
    return;
  }

  const removeButton = event.target.closest("[data-remove-ticker]");
  if (removeButton) {
    removeTicker(removeButton.dataset.removeTicker);
    return;
  }

  const editThesisButton = event.target.closest("[data-edit-thesis]");
  if (editThesisButton) {
    openThesisEditor(editThesisButton.dataset.editThesis);
    return;
  }

  const editPositionButton = event.target.closest("[data-edit-position]");
  if (editPositionButton) {
    openPositionEditor(editPositionButton.dataset.editPosition);
    return;
  }

  const reviewButton = event.target.closest("[data-run-review]");
  if (reviewButton) {
    state.selectedTicker = reviewButton.dataset.runReview;
    runManualReview();
    setRoute("report");
    return;
  }

  if (event.target.closest("[data-refresh-local]")) {
    refreshMarketData();
    return;
  }

  if (event.target.closest("[data-simulate-local]")) {
    simulateLocalData();
    return;
  }

  if (event.target.closest("[data-export-state]")) {
    exportState();
    return;
  }

  if (event.target.closest("[data-import-state]")) {
    importState();
    return;
  }

  if (event.target.closest("[data-reset-state]")) {
    resetState();
    return;
  }

  const openTicker = event.target.closest("[data-open-ticker]");
  if (openTicker) {
    state.selectedTicker = openTicker.dataset.openTicker;
    saveState();
  }

  const routeButton = event.target.closest("[data-route]");
  if (routeButton) setRoute(routeButton.dataset.route);
});

backButton.addEventListener("click", () => {
  routeHistory.pop();
  setRoute(routeHistory.pop() || "watchlist");
});

document.querySelector("#discoveryButton").addEventListener("click", () => {
  renderDiscovery();
  discoveryResults.animate(
    [{ opacity: 0.45, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 260, easing: "ease-out" }
  );
});

tickerSearch.addEventListener("input", renderSearch);
