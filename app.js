const STORAGE_KEY = "thesis-radar-real-v1";
const APP_CONFIG = {
  supabaseUrl: "https://nasuybwjddcrrmekcslu.supabase.co",
  supabaseAnonKey: "sb_publishable_olGEIuWleNo6N-C-5HN3DA_dQ3VVYMw",
};

const routes = ["watchlist", "detail", "report", "thesis", "history", "add", "discovery", "settings"];
const routeHistory = ["watchlist"];
const screenTitle = document.querySelector("#screenTitle");
const screenSubtitle = document.querySelector("#screenSubtitle");
const backButton = document.querySelector("#backButton");
const topAction = document.querySelector("#topAction");

let state = sanitizeState(loadState());

function defaultState() {
  return {
    portfolio: [],
    selectedTicker: null,
    assetsByTicker: {},
    positionsByTicker: {},
    reportsByTicker: {},
    reportHistoryByTicker: {},
    priceHistoryByTicker: {},
    quoteStatusByTicker: {},
    lastDataRefresh: null,
    sync: {
      supabaseUrl: APP_CONFIG.supabaseUrl,
      supabaseAnonKey: APP_CONFIG.supabaseAnonKey,
      syncKey: crypto.randomUUID(),
      lastSyncAt: null,
      status: "Sin configurar",
    },
    ai: {
      model: "gpt-5.4-mini",
      lastError: "",
    },
    search: {
      country: "US",
      language: "en",
      monthlyLimit: 1000,
      usedThisMonth: 0,
      usageMonth: new Date().toISOString().slice(0, 7),
      lastResultsByTicker: {},
      lastError: "",
    },
  };
}

function loadState() {
  try {
    return mergeState(defaultState(), JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
  } catch {
    return defaultState();
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    portfolio: Array.isArray(saved.portfolio) ? saved.portfolio : base.portfolio,
    assetsByTicker: { ...base.assetsByTicker, ...saved.assetsByTicker },
    positionsByTicker: { ...base.positionsByTicker, ...saved.positionsByTicker },
    reportsByTicker: { ...base.reportsByTicker, ...saved.reportsByTicker },
    reportHistoryByTicker: { ...base.reportHistoryByTicker, ...saved.reportHistoryByTicker },
    priceHistoryByTicker: { ...base.priceHistoryByTicker, ...saved.priceHistoryByTicker },
    quoteStatusByTicker: { ...base.quoteStatusByTicker, ...saved.quoteStatusByTicker },
    sync: { ...base.sync, ...saved.sync },
    ai: { ...base.ai, ...saved.ai },
    search: { ...base.search, ...saved.search },
  };
}

function sanitizeState(nextState) {
  if (nextState.ai) delete nextState.ai.apiKey;
  if (nextState.search) delete nextState.search.braveApiKey;
  if (nextState.sync) {
    nextState.sync.supabaseUrl = APP_CONFIG.supabaseUrl || nextState.sync.supabaseUrl || "";
    nextState.sync.supabaseAnonKey = APP_CONFIG.supabaseAnonKey || nextState.sync.supabaseAnonKey || "";
  }
  return nextState;
}

function saveState() {
  sanitizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function maskKey(value = "") {
  if (!value) return "";
  if (value.length <= 14) return "********";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function toLines(value) {
  return (value || "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function fromLines(items) {
  return (items || []).join("\n");
}

function eventsToText(events) {
  return (events || []).map((event) => `${event.type || "Evento"} | ${event.date || ""} | ${event.note || ""}`).join("\n");
}

function textToEvents(text) {
  return toLines(text).map((line) => {
    const [type = "Evento", date = "", note = ""] = line.split("|").map((item) => item.trim());
    return { type, date, note };
  });
}

function activeTicker() {
  return state.selectedTicker || state.portfolio[0] || null;
}

function assetByTicker(ticker = activeTicker()) {
  return ticker ? state.assetsByTicker[ticker] : null;
}

function reportHistory(ticker = activeTicker()) {
  return ticker ? state.reportHistoryByTicker?.[ticker] || [] : [];
}

function latestReport(ticker = activeTicker()) {
  return reportHistory(ticker)[0] || state.reportsByTicker?.[ticker] || null;
}

function portfolioAssets() {
  return state.portfolio.map((ticker) => state.assetsByTicker[ticker]).filter(Boolean);
}

function formatTimestamp(value) {
  if (!value) return "Pendiente";
  return new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatPrice(asset) {
  if (!Number.isFinite(asset?.price)) return "Sin precio real";
  const currency = asset.currency ? `${asset.currency} ` : "";
  return `${currency}${asset.price.toLocaleString("es-ES", { maximumFractionDigits: asset.price > 100 ? 2 : 4 })}`;
}

function formatChange(asset) {
  if (!Number.isFinite(asset?.changePercent)) return "Cambio pendiente";
  return `${asset.changePercent >= 0 ? "+" : ""}${asset.changePercent.toFixed(2)}%`;
}

function formatPositionValue(asset) {
  const position = state.positionsByTicker[asset.ticker] || {};
  if (!Number.isFinite(asset.price) || !Number(position.shares)) return "Sin valor calculado";
  const value = asset.price * Number(position.shares);
  return `${asset.currency || ""} ${value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`.trim();
}

function signalFromReport(report) {
  if (!report?.score && report?.score !== 0) return "Sin informe";
  if (report.score >= 80) return "Tesis fuerte";
  if (report.score >= 65) return "Sigue en pie";
  if (report.score >= 50) return "Vigilar";
  return "Revisar tesis";
}

function reportTone(report) {
  if (!report?.score && report?.score !== 0) return "muted";
  if (report.score >= 65) return "good";
  if (report.score >= 50) return "warn";
  return "bad";
}

function mergeUnique(existing = [], incoming = []) {
  const seen = new Set();
  return [...incoming, ...existing].map((item) => String(item || "").trim()).filter((item) => item && !seen.has(item) && seen.add(item));
}

function mergeEvents(existing = [], incoming = []) {
  const seen = new Set();
  return [...incoming, ...existing].map((event) => ({
    type: String(event?.type || "Evento").trim(),
    date: String(event?.date || "").trim(),
    note: String(event?.note || "").trim(),
  })).filter((event) => {
    const key = `${event.type}|${event.date}|${event.note}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return event.type || event.date || event.note;
  });
}

function renderFundamentals(fundamentals) {
  const entries = Array.isArray(fundamentals) ? fundamentals.map((item) => [item.label, item.value]) : Object.entries(fundamentals || {});
  return entries.length
    ? `<dl class="metric-list">${entries.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`
    : "<p>Sin fundamentales guardados.</p>";
}

function priceHistory(ticker = activeTicker()) {
  return ticker ? state.priceHistoryByTicker?.[ticker] || [] : [];
}

function renderPriceChart(points = []) {
  const valid = points.filter((point) => Number.isFinite(point.close));
  if (valid.length < 2) return "<p>Sin historico de precios guardado.</p>";
  const width = 300;
  const height = 120;
  const min = Math.min(...valid.map((point) => point.close));
  const max = Math.max(...valid.map((point) => point.close));
  const range = max - min || 1;
  const coords = valid.map((point, index) => {
    const x = (index / (valid.length - 1)) * width;
    const y = height - ((point.close - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg class="price-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Historico de precios"><polyline points="${coords}" /></svg><p class="muted tiny">${valid.length} cierres. Min ${min.toFixed(2)} / Max ${max.toFixed(2)}.</p>`;
}

function logoText(ticker = "") {
  return ticker.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase() || "TR";
}

function icon(kind) {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14" />',
    refresh: '<path d="M20 12a8 8 0 0 1-14.9 4M4 12A8 8 0 0 1 18.9 8M18 4v4h-4M6 20v-4h4" />',
    calendar: '<path d="M7 3v4M17 3v4M4 8h16M5 5h14v15H5z" />',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a8 8 0 0 0 .1-6l2-1.5-2-3.5-2.4 1a8 8 0 0 0-5.2-3l-.4-2h-4l-.4 2a8 8 0 0 0-5.2 3l-2.4-1-2 3.5L4.5 9a8 8 0 0 0 .1 6l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 5.2 3l.4 2h4l.4-2a8 8 0 0 0 5.2-3l2.4 1 2-3.5Z" />',
    edit: '<path d="M4 19h16" /><path d="M7 16l9-9 3 3-9 9H7z" />',
    doc: '<path d="M7 3h10l3 3v15H7z" /><path d="M9 12h6M9 16h6M9 8h3" />',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[kind] || paths.plus}</svg>`;
}

function actionIcon(kind) {
  if (kind === "share") return '<path d="M4 12v8h16v-8" /><path d="M12 16V3" /><path d="m8 7 4-4 4 4" />';
  return "";
}

function ensureTicker(ticker) {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return null;
  if (!state.assetsByTicker[normalized]) {
    state.assetsByTicker[normalized] = {
      ticker: normalized,
      company: "",
      sector: "",
      currency: "",
      price: null,
      changePercent: null,
      thesis: "",
      drivers: [],
      breakers: [],
      risks: [],
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  if (!state.portfolio.includes(normalized)) state.portfolio.push(normalized);
  state.selectedTicker = normalized;
  saveState();
  return normalized;
}

function renderWatchlist() {
  const assets = portfolioAssets();
  const withPrices = assets.filter((asset) => Number.isFinite(asset.price)).length;
  const withReports = assets.filter((asset) => latestReport(asset.ticker)).length;
  document.querySelector("#screen-watchlist").innerHTML = `
    <p class="muted tiny">Datos reales primero. Actualizacion: ${formatTimestamp(state.lastDataRefresh)}.</p>
    <article class="panel">
      <h2>Resumen</h2>
      <div class="day-summary real-summary">
        <div><strong>${assets.length}</strong><span>activos</span></div>
        <div><strong>${withPrices}</strong><span>con precio</span></div>
        <div><strong>${withReports}</strong><span>informes IA</span></div>
        <div><strong>${state.sync.lastSyncAt ? "1" : "0"}</strong><span>sync</span></div>
      </div>
    </article>
    <div class="quick-actions" aria-label="Accesos rapidos">
      <button data-route="add" type="button">${icon("plus")}<span>Anadir activo</span></button>
      <button data-refresh-market type="button">${icon("refresh")}<span>Actualizar precios</span></button>
      <button data-route="thesis" type="button">${icon("calendar")}<span>Eventos</span></button>
      <button data-route="settings" type="button">${icon("settings")}<span>Sincronizacion</span></button>
    </div>
    <div class="section-row">
      <h2>Mi portfolio</h2>
      <button class="link-button" data-route="settings" type="button">Configurar</button>
    </div>
    <div class="asset-list">
      ${assets.length ? assets.map(assetRow).join("") : `<article class="panel empty-state"><h2>Sin activos todavia</h2><p>Anade tus tickers reales. No hay datos precargados ni puntuaciones inventadas.</p></article>`}
    </div>
  `;
}

function assetRow(asset) {
  const report = latestReport(asset.ticker);
  return `
    <article class="asset-row asset-row-action">
      <button class="asset-main" type="button" data-open-ticker="${asset.ticker}" data-route="detail">
        <span class="logo-mark">${logoText(asset.ticker)}</span>
        <span>
          <h3>${escapeHtml(asset.ticker)}</h3>
          <p>${escapeHtml(asset.company || "Empresa pendiente")}<br><span class="${reportTone(report)}">${escapeHtml(signalFromReport(report))}</span></p>
        </span>
        <span class="asset-price">
          <strong>${escapeHtml(formatPrice(asset))}</strong>
          <p class="${asset.changePercent >= 0 ? "good" : "bad"}">${escapeHtml(formatChange(asset))}</p>
        </span>
      </button>
      <button class="remove-mini" type="button" data-remove-ticker="${asset.ticker}" aria-label="Quitar activo">x</button>
    </article>
  `;
}

function renderDetail() {
  const asset = assetByTicker();
  if (!asset) return renderNoAsset("detail");
  const report = latestReport(asset.ticker);
  const quoteStatus = state.quoteStatusByTicker[asset.ticker];
  document.querySelector("#screen-detail").innerHTML = `
    <article class="asset-hero">
      <div class="logo-mark">${logoText(asset.ticker)}</div>
      <div><h2>${escapeHtml(asset.ticker)}</h2><p>${escapeHtml(asset.company || "Empresa pendiente")}</p></div>
    </article>
    <div class="price-row">
      <div>
        <strong>${escapeHtml(formatPrice(asset))}</strong>
        <span class="${asset.changePercent >= 0 ? "good" : "bad"}">${escapeHtml(formatChange(asset))}</span>
      </div>
      <button class="signal-button ghost-signal" type="button">${escapeHtml(signalFromReport(report))}</button>
    </div>
    <div class="quick-actions compact-actions">
      <button type="button" data-edit-asset="${asset.ticker}">${icon("edit")}<span>Editar datos</span></button>
      <button type="button" data-route="thesis">${icon("doc")}<span>Tesis</span></button>
      <button type="button" data-generate-report-web="${asset.ticker}">${icon("refresh")}<span>Analizar</span></button>
      <button type="button" data-refresh-one="${asset.ticker}">${icon("refresh")}<span>Precio</span></button>
      <button type="button" data-route="history">${icon("doc")}<span>Historico</span></button>
    </div>
    <article class="panel">
      <h2>Posicion</h2>
      <dl class="metric-list">
        <div><dt>Titulos</dt><dd>${escapeHtml(state.positionsByTicker[asset.ticker]?.shares || "Pendiente")}</dd></div>
        <div><dt>Coste medio</dt><dd>${escapeHtml(state.positionsByTicker[asset.ticker]?.averageCost || "Pendiente")}</dd></div>
        <div><dt>Valor estimado</dt><dd>${escapeHtml(formatPositionValue(asset))}</dd></div>
      </dl>
    </article>
    <article class="panel">
      <h2>Datos de mercado</h2>
      <dl class="metric-list">
        <div><dt>Fuente</dt><dd>${escapeHtml(quoteStatus?.source || "Pendiente")}</dd></div>
        <div><dt>Actualizado</dt><dd>${escapeHtml(formatTimestamp(quoteStatus?.at))}</dd></div>
        <div><dt>Estado</dt><dd class="${quoteStatus?.ok ? "good" : "warn"}">${escapeHtml(quoteStatus?.message || "Sin consulta realizada")}</dd></div>
      </dl>
    </article>
    <article class="panel">
      <h2>Fundamentales</h2>
      ${renderFundamentals(asset.fundamentals)}
    </article>
    <article class="panel">
      <h2>Historico real</h2>
      ${renderPriceChart(priceHistory(asset.ticker))}
    </article>
  `;
}

function renderReport() {
  const asset = assetByTicker();
  if (!asset) return renderNoAsset("report");
  const history = reportHistory(asset.ticker);
  const report = latestReport(asset.ticker);
  const searchResults = state.search.lastResultsByTicker?.[asset.ticker]?.results || [];
  document.querySelector("#screen-report").innerHTML = `
    <article class="panel">
      <h2>${escapeHtml(asset.ticker)} - Informe IA</h2>
      <p>${report ? `Ultimo: ${escapeHtml(formatTimestamp(report.createdAt))}. Modelo: ${escapeHtml(report.model || "No indicado")}.` : "Aun no hay informe real. Analizar usara Brave, OpenAI y datos disponibles."}</p>
      <button class="wide-button" type="button" data-generate-report-web="${asset.ticker}">Analizar ticker</button>
    </article>
    ${report ? `<article class="panel report-output"><h2>Resultado</h2>${renderReportBody(report)}</article>` : `<article class="panel empty-state"><h2>Sin informe</h2><p>El informe aparecera solo cuando lo genere la API con datos reales y fuentes.</p></article>`}
    <article class="panel source-list">
      <h2>Informes guardados</h2>
      ${history.length ? history.map((item) => `<p><strong>${escapeHtml(formatTimestamp(item.createdAt))} - ${Number.isFinite(item.score) ? `${item.score}/100` : "Sin score"}</strong><span>${escapeHtml(item.model || "")}</span>${escapeHtml(item.thesisStatus || item.summary || "Informe guardado")}</p>`).join("") : "<p>No hay historial guardado.</p>"}
    </article>
    <article class="panel source-list">
      <h2>Fuentes Brave</h2>
      ${
        searchResults.length
          ? searchResults.map((item) => `<p><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.url)}</span>${escapeHtml(item.description || "")}</p>`).join("")
          : "<p>No hay busqueda web guardada para este ticker.</p>"
      }
    </article>
  `;
}

function renderReportBody(report) {
  const rows = [];
  if (Number.isFinite(report.score)) rows.push(`<p><strong>Score:</strong> ${report.score}/100</p>`);
  if (report.summary) rows.push(`<p><strong>Resumen:</strong> ${escapeHtml(report.summary)}</p>`);
  if (report.thesisStatus) rows.push(`<p><strong>Estado de tesis:</strong> ${escapeHtml(report.thesisStatus)}</p>`);
  if (report.drivers?.length) rows.push(`<h2>Drivers</h2>${report.drivers.map((item) => `<p><span class="ok-dot"></span>${escapeHtml(item)}</p>`).join("")}`);
  if (report.risks?.length) rows.push(`<h2>Riesgos</h2>${report.risks.map((item) => `<p><span class="warn-dot"></span>${escapeHtml(item)}</p>`).join("")}`);
  if (report.actions?.length) rows.push(`<h2>Acciones sugeridas</h2>${report.actions.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}`);
  if (!rows.length && report.raw) rows.push(`<pre class="raw-output">${escapeHtml(report.raw)}</pre>`);
  return rows.join("");
}

function renderThesis() {
  const asset = assetByTicker();
  if (!asset) return renderNoAsset("thesis");
  document.querySelector("#screen-thesis").innerHTML = `
    <article class="asset-hero">
      <div class="logo-mark">${logoText(asset.ticker)}</div>
      <div><h2>${escapeHtml(asset.ticker)}</h2><p>${escapeHtml(asset.company || "Empresa pendiente")}</p></div>
    </article>
    <div class="quick-actions compact-actions">
      <button type="button" data-edit-asset="${asset.ticker}">${icon("edit")}<span>Editar tesis</span></button>
      <button type="button" data-generate-report-web="${asset.ticker}">${icon("refresh")}<span>Analizar</span></button>
    </div>
    <article class="panel"><h2>Tesis</h2><p>${escapeHtml(asset.thesis || "Pendiente de redactar.")}</p></article>
    <article class="panel checklist"><h2>Drivers</h2>${listItems(asset.drivers, "ok-dot", "Sin drivers definidos.")}</article>
    <article class="panel checklist"><h2>Breakers</h2>${listItems(asset.breakers, "bad-dot", "Sin breakers definidos.")}</article>
    <article class="panel checklist"><h2>Riesgos</h2>${listItems(asset.risks, "warn-dot", "Sin riesgos definidos.")}</article>
    <article class="panel event-list"><h2>Calendario</h2>${eventItems(asset.events)}</article>
  `;
}

function listItems(items, dotClass, empty) {
  return items?.length ? items.map((item) => `<p><span class="${dotClass}"></span>${escapeHtml(item)}</p>`).join("") : `<p>${escapeHtml(empty)}</p>`;
}

function eventItems(events) {
  return events?.length
    ? events.map((event) => `<p><strong>${escapeHtml(event.date || "Sin fecha")}</strong><span>${escapeHtml(event.type || "Evento")}</span>${escapeHtml(event.note || "")}</p>`).join("")
    : "<p>Sin resultados/dividendos/catalizadores guardados.</p>";
}

function renderHistory() {
  const asset = assetByTicker();
  if (!asset) return renderNoAsset("history");
  const history = reportHistory(asset.ticker);
  const prices = priceHistory(asset.ticker);
  document.querySelector("#screen-history").innerHTML = `
    <article class="panel">
      <h2>Historico de tesis</h2>
      <p>${history.length ? `${history.length} informes reales guardados para ${escapeHtml(asset.ticker)}.` : "Aun no hay informes guardados para este activo."}</p>
      <button class="wide-button" type="button" data-generate-report-web="${asset.ticker}">Analizar ahora</button>
    </article>
    <article class="panel">
      <h2>Precio historico</h2>
      ${renderPriceChart(prices)}
    </article>
    <div class="calendar-list">
      ${history.length ? history.map((report) => `<button class="calendar-row" type="button" data-route="report"><span class="calendar-date">${escapeHtml(formatTimestamp(report.createdAt))}</span><span><h3>${Number.isFinite(report.score) ? `${report.score}/100` : "Sin score"}</h3><p>${escapeHtml(report.thesisStatus || report.summary || "Informe guardado")}</p></span></button>`).join("") : `<article class="panel empty-state"><h2>Sin serie</h2><p>Analiza el ticker varias veces para construir la evolucion real de la tesis.</p></article>`}
    </div>
  `;
}

function renderSearch() {
  document.querySelector("#screen-add").innerHTML = `
    <label class="search-box">${icon("plus")}<input id="tickerInput" type="search" placeholder="Ticker real, ej. AAPL, ASML.AS, 0700.HK" /></label>
    <button class="wide-button" type="button" data-create-from-input>Anadir ticker</button>
    <button class="wide-button ghost" type="button" data-create-and-analyze>Rellenar con IA</button>
    <article class="panel"><h2>Alta de activo</h2><p>Introduce el ticker real. Puedes anadirlo vacio o pedir a la IA que rellene empresa, sector, eventos, precio/fundamentales disponibles e informe inicial.</p></article>
  `;
}

function renderDiscovery() {
  document.querySelector("#screen-discovery").innerHTML = `
    <article class="panel"><h2>Thesis Discovery</h2><p>Describe una tesis y la IA buscara candidatos usando Brave. No se muestran sugerencias si no hay respuesta real de la API.</p></article>
    <article class="step-card"><span>1</span><label>Idea de inversion</label><textarea id="discoveryPrompt" placeholder="Ej. Empresas europeas con moat en semiconductores, baja deuda y crecimiento estructural."></textarea></article>
    <button class="wide-button" type="button" data-discovery-ai>Buscar activos</button>
    <div id="discoveryResults"></div>
  `;
}

function renderSettings() {
  const hasIntegratedSupabase = Boolean(APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey);
  document.querySelector("#screen-settings").innerHTML = `
    <article class="panel">
      <h2>Supabase</h2>
      <p>${hasIntegratedSupabase ? "Supabase viene integrado en la app. Solo conserva la misma Sync key entre movil y PC." : "Falta integrar Supabase en APP_CONFIG. Mientras tanto puedes pegar Project URL y anon key aqui."}</p>
      ${hasIntegratedSupabase ? "" : `<label class="form-field">Project URL<input name="supabaseUrl" value="${escapeHtml(state.sync.supabaseUrl)}" placeholder="https://xxxx.supabase.co" /></label><label class="form-field">Anon public key<input name="supabaseAnonKey" value="${escapeHtml(state.sync.supabaseAnonKey)}" placeholder="eyJ..." /></label>`}
      <label class="form-field">Sync key<input name="syncKey" value="${escapeHtml(state.sync.syncKey)}" /></label>
      <div class="button-grid"><button class="wide-button ghost" type="button" data-save-settings>Guardar</button><button class="wide-button ghost" type="button" data-sync-pull>Descargar</button></div>
      <button class="wide-button ghost" type="button" data-sync-push>Subir estado</button>
      <p class="muted tiny">Estado: ${escapeHtml(state.sync.status)}. Ultima sync: ${escapeHtml(formatTimestamp(state.sync.lastSyncAt))}.</p>
    </article>
    <article class="panel">
      <h2>Analisis IA</h2>
      <p>OpenAI se ejecuta en Supabase Edge Functions. La clave privada va en secrets de Supabase, no en esta app.</p>
      <label class="form-field">Modelo<input name="openaiModel" value="${escapeHtml(state.ai.model)}" /></label>
      <button class="wide-button ghost" type="button" data-save-settings>Guardar modelo</button>
      ${state.ai.lastError ? `<p class="bad tiny">${escapeHtml(state.ai.lastError)}</p>` : ""}
    </article>
    <article class="panel">
      <h2>Brave Search</h2>
      <p>La busqueda web manual se ejecuta desde Supabase con <code>BRAVE_SEARCH_API_KEY</code> como secret.</p>
      <div class="button-grid">
        <label class="form-field">Pais<input name="braveCountry" value="${escapeHtml(state.search.country)}" placeholder="US" /></label>
        <label class="form-field">Idioma<input name="braveLanguage" value="${escapeHtml(state.search.language)}" placeholder="en" /></label>
      </div>
      <label class="form-field">Limite mensual<input name="braveMonthlyLimit" type="number" min="1" value="${escapeHtml(state.search.monthlyLimit)}" /></label>
      <button class="wide-button ghost" type="button" data-save-settings>Guardar Brave</button>
      <p class="muted tiny">Uso ${escapeHtml(state.search.usageMonth)}: ${state.search.usedThisMonth}/${state.search.monthlyLimit}. ${escapeHtml(state.search.lastError || "")}</p>
    </article>
    <article class="panel">
      <h2>Backup local</h2>
      <textarea class="backup-box" id="backupBox" placeholder="Export/import JSON"></textarea>
      <div class="button-grid"><button class="wide-button ghost" type="button" data-export-state>Exportar</button><button class="wide-button ghost" type="button" data-import-state>Importar</button></div>
      <button class="wide-button ghost danger-action" type="button" data-reset-state>Reset local</button>
    </article>
  `;
}

function renderNoAsset(route) {
  document.querySelector(`#screen-${route}`).innerHTML = `<article class="panel empty-state"><h2>Sin activo seleccionado</h2><p>Anade un ticker real para empezar.</p><button class="wide-button" data-route="add" type="button">Anadir ticker</button></article>`;
}

function renderActiveScreen(route) {
  if (route === "watchlist") renderWatchlist();
  if (route === "detail") renderDetail();
  if (route === "report") renderReport();
  if (route === "thesis") renderThesis();
  if (route === "history") renderHistory();
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
  screenTitle.textContent = route === "detail" && asset ? asset.ticker : active.dataset.title;
  screenSubtitle.textContent = route === "detail" && asset ? asset.company || "Datos reales" : active.dataset.subtitle;
  topAction.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${actionIcon(active.dataset.action)}</svg>`;
  topAction.style.visibility = active.dataset.action === "none" ? "hidden" : "visible";
  backButton.style.visibility = route === "watchlist" ? "hidden" : "visible";
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("is-active", button.dataset.route === route));
  if (push && routeHistory[routeHistory.length - 1] !== route) routeHistory.push(route);
}

function openDialog(title, bodyHtml) {
  closeDialog();
  const dialog = document.createElement("section");
  dialog.className = "modal-backdrop";
  dialog.innerHTML = `<form class="modal-card"><div class="modal-header"><h2>${escapeHtml(title)}</h2><button class="icon-button" type="button" data-close-dialog aria-label="Cerrar">x</button></div>${bodyHtml}</form>`;
  document.body.appendChild(dialog);
  return dialog;
}

function closeDialog() {
  document.querySelector(".modal-backdrop")?.remove();
}

function openAssetEditor(ticker) {
  const asset = assetByTicker(ticker);
  const position = state.positionsByTicker[ticker] || {};
  const dialog = openDialog(
    `Editar ${ticker}`,
    `
      <label class="form-field">Empresa<input name="company" value="${escapeHtml(asset.company || "")}" /></label>
      <label class="form-field">Sector<input name="sector" value="${escapeHtml(asset.sector || "")}" /></label>
      <label class="form-field">Moneda<input name="currency" value="${escapeHtml(asset.currency || "")}" placeholder="USD, EUR, HKD..." /></label>
      <label class="form-field">Titulos<input name="shares" type="number" min="0" step="0.0001" value="${escapeHtml(position.shares || "")}" /></label>
      <label class="form-field">Coste medio<input name="averageCost" type="number" min="0" step="0.0001" value="${escapeHtml(position.averageCost || "")}" /></label>
      <label class="form-field">Tesis<textarea name="thesis">${escapeHtml(asset.thesis || "")}</textarea></label>
      <label class="form-field">Drivers<textarea name="drivers">${escapeHtml(fromLines(asset.drivers))}</textarea></label>
      <label class="form-field">Breakers<textarea name="breakers">${escapeHtml(fromLines(asset.breakers))}</textarea></label>
      <label class="form-field">Riesgos<textarea name="risks">${escapeHtml(fromLines(asset.risks))}</textarea></label>
      <label class="form-field">Eventos<textarea name="events">${escapeHtml(eventsToText(asset.events))}</textarea><small>Formato: Tipo | fecha | nota</small></label>
      <button class="wide-button" type="submit">Guardar</button>
    `
  );
  dialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.assetsByTicker[ticker] = {
      ...asset,
      company: form.get("company").trim(),
      sector: form.get("sector").trim(),
      currency: form.get("currency").trim(),
      thesis: form.get("thesis").trim(),
      drivers: toLines(form.get("drivers")),
      breakers: toLines(form.get("breakers")),
      risks: toLines(form.get("risks")),
      events: textToEvents(form.get("events")),
      updatedAt: new Date().toISOString(),
    };
    state.positionsByTicker[ticker] = {
      shares: form.get("shares") ? Number(form.get("shares")) : "",
      averageCost: form.get("averageCost") ? Number(form.get("averageCost")) : "",
    };
    saveState();
    closeDialog();
    setRoute(document.querySelector(".screen.is-active").id.replace("screen-", ""), false);
    showToast("Activo guardado");
  });
}

async function refreshMarketData(ticker = null) {
  const assets = ticker ? [assetByTicker(ticker)].filter(Boolean) : portfolioAssets();
  if (!assets.length) return showToast("No hay activos que actualizar");
  showToast("Actualizando precios reales...");
  const results = await Promise.all(assets.map(async (asset) => {
    try {
      return { asset, marketData: await invokeMarketData(asset) };
    } catch (error) {
      return { asset, error: error.message };
    }
  }));
  results.forEach(({ asset, marketData, error }) => {
    if (marketData) {
      applyMarketData(asset.ticker, marketData);
    } else {
      state.quoteStatusByTicker[asset.ticker] = { ok: false, source: "Supabase/Yahoo", at: new Date().toISOString(), message: error || "Fuente no disponible" };
    }
  });
  state.lastDataRefresh = new Date().toISOString();
  saveState();
  setRoute(document.querySelector(".screen.is-active").id.replace("screen-", ""), false);
  showToast(`${results.filter((item) => item.quote).length}/${results.length} precios actualizados`);
}

async function generateReport(ticker, includeWeb = false) {
  const asset = assetByTicker(ticker);
  if (!asset) return;
  if (!hasSupabaseConfig()) {
    setRoute("settings");
    showToast("Configura Supabase");
    return;
  }
  showToast("Analizando ticker...");
  try {
    resetSearchUsageIfNeeded();
    if (Number(state.search.usedThisMonth) >= Number(state.search.monthlyLimit)) {
      throw new Error("Limite mensual de Brave alcanzado");
    }
    const data = await invokeAnalyzeThesis(state.assetsByTicker[ticker], true);
    if (data.marketData) applyMarketData(ticker, data.marketData);
    const report = data.report || {};
    const raw = typeof report.raw === "string" ? report.raw : JSON.stringify(report, null, 2);
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const savedReport = { ...report, raw, model: data.model || state.ai.model, createdAt: new Date().toISOString(), usedWebSearch: true, sourceCount: sources.length };
    applyAssetPatch(ticker, data.assetPatch || report.assetPatch || {});
    state.reportsByTicker[ticker] = savedReport;
    state.reportHistoryByTicker[ticker] = [savedReport, ...reportHistory(ticker)].slice(0, 50);
    state.search.usedThisMonth = Number(state.search.usedThisMonth || 0) + 1;
    state.search.lastResultsByTicker[ticker] = {
      at: new Date().toISOString(),
      query: data.query || buildBraveQuery(asset),
      results: sources,
    };
    state.search.lastError = "";
    state.ai.lastError = "";
    saveState();
    setRoute("report");
    showToast("Informe generado");
  } catch (error) {
    state.search.lastError = error.message;
    state.ai.lastError = error.message;
    saveState();
    setRoute("settings");
    showToast("Error OpenAI");
  }
}

function applyMarketData(ticker, marketData = {}) {
  const quote = marketData.quote || {};
  const asset = state.assetsByTicker[ticker];
  if (!asset) return;
  state.assetsByTicker[ticker] = {
    ...asset,
    company: quote.company || asset.company,
    sector: quote.sector || asset.sector,
    currency: quote.currency || asset.currency,
    price: Number.isFinite(Number(quote.price)) ? Number(quote.price) : asset.price,
    changePercent: Number.isFinite(Number(quote.changePercent)) ? Number(quote.changePercent) : asset.changePercent,
    fundamentals: mergeFundamentals(asset.fundamentals, marketData.fundamentals || []),
    updatedAt: new Date().toISOString(),
  };
  if (Array.isArray(marketData.history) && marketData.history.length) state.priceHistoryByTicker[ticker] = marketData.history;
  state.quoteStatusByTicker[ticker] = { ok: true, source: quote.source || "Supabase/Yahoo", at: new Date().toISOString(), message: "Datos de mercado actualizados" };
}

function mergeFundamentals(existing = [], incoming = []) {
  const map = new Map();
  [...existing, ...incoming].forEach((item) => {
    const label = String(item?.label || "").trim();
    const value = String(item?.value || "").trim();
    if (label && value) map.set(label, { label, value });
  });
  return [...map.values()];
}

function applyAssetPatch(ticker, patch = {}) {
  const asset = state.assetsByTicker[ticker];
  if (!asset) return;
  const fundamentals = mergeFundamentals(asset.fundamentals, patch.fundamentals || []);
  state.assetsByTicker[ticker] = {
    ...asset,
    company: patch.company || asset.company,
    sector: patch.sector || asset.sector,
    currency: patch.currency || asset.currency,
    price: Number.isFinite(Number(patch.price)) ? Number(patch.price) : asset.price,
    changePercent: Number.isFinite(Number(patch.changePercent)) ? Number(patch.changePercent) : asset.changePercent,
    thesis: patch.thesis || asset.thesis,
    drivers: mergeUnique(asset.drivers, patch.drivers || []),
    breakers: mergeUnique(asset.breakers, patch.breakers || []),
    risks: mergeUnique(asset.risks, patch.risks || []),
    events: mergeEvents(asset.events, patch.events || []),
    fundamentals,
    updatedAt: new Date().toISOString(),
  };
}

async function invokeAnalyzeThesis(asset, includeWeb) {
  const response = await fetch(`${supabaseUrl()}/functions/v1/analyze-thesis`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({
      asset,
      position: state.positionsByTicker[asset.ticker] || {},
      includeWeb,
      model: state.ai.model,
      search: {
        country: state.search.country || "US",
        language: state.search.language || "en",
        count: 8,
      },
    }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error || data?.message || `Supabase Function HTTP ${response.status}`);
  return data;
}

async function invokeMarketData(asset) {
  const response = await fetch(`${supabaseUrl()}/functions/v1/analyze-thesis`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ mode: "market", asset }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data?.error || data?.message || `Supabase Function HTTP ${response.status}`);
  return data.marketData;
}

async function discoverAssets() {
  const prompt = document.querySelector("#discoveryPrompt")?.value.trim();
  if (!prompt) return showToast("Describe una tesis");
  if (!hasSupabaseConfig()) return showToast("Configura Supabase");
  showToast("Buscando activos...");
  try {
    resetSearchUsageIfNeeded();
    if (Number(state.search.usedThisMonth) >= Number(state.search.monthlyLimit)) throw new Error("Limite mensual de Brave alcanzado");
    const response = await fetch(`${supabaseUrl()}/functions/v1/analyze-thesis`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({
        mode: "discovery",
        thesis: prompt,
        model: state.ai.model,
        search: { country: state.search.country || "US", language: state.search.language || "en", count: 8 },
      }),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(data?.error || `Supabase Function HTTP ${response.status}`);
    state.search.usedThisMonth = Number(state.search.usedThisMonth || 0) + 1;
    renderDiscoveryResults(data.suggestions || []);
    saveState();
    showToast("Discovery listo");
  } catch (error) {
    state.ai.lastError = error.message;
    saveState();
    showToast("Error Discovery");
  }
}

function renderDiscoveryResults(suggestions) {
  const box = document.querySelector("#discoveryResults");
  if (!box) return;
  box.innerHTML = suggestions.length
    ? suggestions.map((item) => `<article class="asset-row"><button class="asset-main" type="button" data-add-suggestion="${escapeHtml(item.ticker || "")}" data-company="${escapeHtml(item.company || "")}" data-sector="${escapeHtml(item.sector || item.assetType || "")}" data-thesis="${escapeHtml(`${item.thesisRole || item.assetType || "activo"}: ${item.rationale || ""}`)}"><span class="logo-mark">${logoText(item.ticker || "")}</span><span><h3>${escapeHtml(item.ticker || "")}</h3><p>${escapeHtml(item.assetType || item.sector || "Activo")} - ${escapeHtml(item.thesisRole || "encaje")}<br>${escapeHtml(item.rationale || "")}</p></span><span class="asset-price"><strong>${escapeHtml(String(item.score || ""))}</strong><p>score</p></span></button></article>`).join("")
    : `<article class="panel empty-state"><h2>Sin resultados</h2><p>La API no devolvio candidatos utilizables.</p></article>`;
}

function resetSearchUsageIfNeeded() {
  const month = new Date().toISOString().slice(0, 7);
  if (state.search.usageMonth !== month) {
    state.search.usageMonth = month;
    state.search.usedThisMonth = 0;
  }
}

function buildBraveQuery(asset) {
  const company = asset.company || asset.ticker;
  const base = `${asset.ticker} ${company}`;
  return `${base} latest results dividend earnings investment thesis risks`;
}

function buildReportPrompt(asset, webContext = []) {
  const webSection = webContext.length
    ? webContext.map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nSnippet: ${item.description}`).join("\n\n")
    : "No se aportan resultados web. No busques por tu cuenta.";

  return `Eres un analista de inversion. No uses web search propia ni herramientas externas. Analiza solo los datos proporcionados y las fuentes Brave incluidas. Devuelve JSON valido con estas claves: score number 0-100 si hay datos suficientes, thesisStatus string, summary string, drivers array, risks array, actions array.

Ticker: ${asset.ticker}
Empresa: ${asset.company || "no indicada"}
Sector: ${asset.sector || "no indicado"}
Precio real disponible: ${formatPrice(asset)}
Cambio: ${formatChange(asset)}
Posicion: ${JSON.stringify(state.positionsByTicker[asset.ticker] || {})}
Tesis del usuario: ${asset.thesis || "no indicada"}
Drivers del usuario: ${JSON.stringify(asset.drivers || [])}
Breakers del usuario: ${JSON.stringify(asset.breakers || [])}
Riesgos del usuario: ${JSON.stringify(asset.risks || [])}
Eventos: ${JSON.stringify(asset.events || [])}
Fuentes Brave:
${webSection}

Si faltan datos, dilo claramente y baja la confianza. No inventes fundamentales, noticias, dividendos ni precios. Cita en el resumen los datos de fuentes solo cuando esten en los snippets o en datos del usuario.`;
}

async function syncPush() {
  if (!hasSupabaseConfig()) return showToast("Configura Supabase");
  try {
    await supabaseRequest("user_sync_states?on_conflict=sync_key", {
      method: "POST",
      body: JSON.stringify({ sync_key: state.sync.syncKey, payload: stateForCloud(), updated_at: new Date().toISOString() }),
      prefer: "resolution=merge-duplicates",
    });
    state.sync.lastSyncAt = new Date().toISOString();
    state.sync.status = "Subido";
    saveState();
    setRoute("settings", false);
    showToast("Sincronizado");
  } catch (error) {
    state.sync.status = error.message;
    saveState();
    setRoute("settings", false);
    showToast("Error Supabase");
  }
}

async function syncPull() {
  if (!hasSupabaseConfig()) return showToast("Configura Supabase");
  try {
    const rows = await supabaseRequest(`user_sync_states?sync_key=eq.${encodeURIComponent(state.sync.syncKey)}&select=payload,updated_at&limit=1`);
    if (!rows.length) return showToast("No hay estado remoto");
    const secrets = { supabaseAnonKey: state.sync.supabaseAnonKey, supabaseUrl: state.sync.supabaseUrl };
    state = mergeState(defaultState(), rows[0].payload || {});
    state.sync.supabaseAnonKey = secrets.supabaseAnonKey;
    state.sync.supabaseUrl = secrets.supabaseUrl;
    state.sync.lastSyncAt = rows[0].updated_at;
    state.sync.status = "Descargado";
    saveState();
    setRoute("watchlist");
    showToast("Estado descargado");
  } catch (error) {
    state.sync.status = error.message;
    saveState();
    setRoute("settings", false);
    showToast("Error Supabase");
  }
}

function stateForCloud() {
  const clone = structuredClone(state);
  if (clone.ai) delete clone.ai.apiKey;
  if (clone.search) delete clone.search.braveApiKey;
  clone.sync.supabaseAnonKey = "";
  clone.sync.supabaseUrl = "";
  return clone;
}

function hasSupabaseConfig() {
  return supabaseUrl() && supabaseAnonKey() && state.sync.syncKey;
}

function supabaseUrl() {
  return (APP_CONFIG.supabaseUrl || state.sync.supabaseUrl || "").replace(/\/$/, "");
}

function supabaseAnonKey() {
  return APP_CONFIG.supabaseAnonKey || state.sync.supabaseAnonKey || "";
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      ...supabaseHeaders(),
      Prefer: options.prefer ? `${options.prefer},return=representation` : "return=representation",
    },
    body: options.body,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase HTTP ${response.status}`);
  return data || [];
}

function supabaseHeaders() {
  const key = supabaseAnonKey();
  const headers = {
    apikey: key,
    "Content-Type": "application/json",
  };
  if (key && !key.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function saveSettingsFromScreen() {
  const screen = document.querySelector("#screen-settings");
  if (!screen) return;
  state.sync.supabaseUrl = APP_CONFIG.supabaseUrl || screen.querySelector('[name="supabaseUrl"]')?.value.trim() || state.sync.supabaseUrl;
  state.sync.supabaseAnonKey = APP_CONFIG.supabaseAnonKey || screen.querySelector('[name="supabaseAnonKey"]')?.value.trim() || state.sync.supabaseAnonKey;
  state.sync.syncKey = screen.querySelector('[name="syncKey"]')?.value.trim() || state.sync.syncKey;
  state.ai.model = screen.querySelector('[name="openaiModel"]')?.value.trim() || state.ai.model;
  state.search.country = screen.querySelector('[name="braveCountry"]')?.value.trim() || state.search.country;
  state.search.language = screen.querySelector('[name="braveLanguage"]')?.value.trim() || state.search.language;
  state.search.monthlyLimit = Number(screen.querySelector('[name="braveMonthlyLimit"]')?.value || state.search.monthlyLimit) || 1000;
  saveState();
  showToast("Ajustes guardados");
}

function exportState() {
  const box = document.querySelector("#backupBox");
  if (box) box.value = JSON.stringify(stateForCloud(), null, 2);
  showToast("Backup generado");
}

function importState() {
  const box = document.querySelector("#backupBox");
  try {
    state = mergeState(state, JSON.parse(box.value));
    saveState();
    setRoute("watchlist");
    showToast("Backup importado");
  } catch {
    showToast("JSON invalido");
  }
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  saveState();
  setRoute("watchlist");
  showToast("Datos reiniciados");
}

function removeTicker(ticker) {
  state.portfolio = state.portfolio.filter((item) => item !== ticker);
  if (state.selectedTicker === ticker) state.selectedTicker = state.portfolio[0] || null;
  saveState();
  setRoute("watchlist");
  showToast("Activo quitado");
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
  window.setTimeout(() => toast.classList.remove("is-visible"), 2000);
}

function installServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-dialog]")) return closeDialog();
  if (event.target.closest("[data-create-from-input]")) {
    const created = ensureTicker(document.querySelector("#tickerInput")?.value || "");
    if (created) {
      setRoute("detail");
      openAssetEditor(created);
    }
    return;
  }
  if (event.target.closest("[data-create-and-analyze]")) {
    const created = ensureTicker(document.querySelector("#tickerInput")?.value || "");
    if (created) return generateReport(created, true);
    return;
  }
  const suggestion = event.target.closest("[data-add-suggestion]");
  if (suggestion) {
    const ticker = ensureTicker(suggestion.dataset.addSuggestion || "");
    if (ticker) {
      state.assetsByTicker[ticker] = {
        ...state.assetsByTicker[ticker],
        company: suggestion.dataset.company || state.assetsByTicker[ticker].company,
        sector: suggestion.dataset.sector || state.assetsByTicker[ticker].sector,
        thesis: suggestion.dataset.thesis || state.assetsByTicker[ticker].thesis,
      };
      saveState();
      setRoute("detail");
    }
    return;
  }
  const openTicker = event.target.closest("[data-open-ticker]");
  if (openTicker) {
    state.selectedTicker = openTicker.dataset.openTicker;
    saveState();
  }
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) return setRoute(routeButton.dataset.route);
  const editButton = event.target.closest("[data-edit-asset]");
  if (editButton) return openAssetEditor(editButton.dataset.editAsset);
  const removeButton = event.target.closest("[data-remove-ticker]");
  if (removeButton) return removeTicker(removeButton.dataset.removeTicker);
  const refreshOne = event.target.closest("[data-refresh-one]");
  if (refreshOne) return refreshMarketData(refreshOne.dataset.refreshOne);
  if (event.target.closest("[data-refresh-market]")) return refreshMarketData();
  const reportWebButton = event.target.closest("[data-generate-report-web]");
  if (reportWebButton) return generateReport(reportWebButton.dataset.generateReportWeb, true);
  if (event.target.closest("[data-save-settings]")) return saveSettingsFromScreen();
  if (event.target.closest("[data-sync-push]")) {
    saveSettingsFromScreen();
    return syncPush();
  }
  if (event.target.closest("[data-sync-pull]")) {
    saveSettingsFromScreen();
    return syncPull();
  }
  if (event.target.closest("[data-export-state]")) return exportState();
  if (event.target.closest("[data-import-state]")) return importState();
  if (event.target.closest("[data-reset-state]")) return resetState();
  if (event.target.closest("[data-discovery-ai]")) return discoverAssets();
});

backButton.addEventListener("click", () => {
  routeHistory.pop();
  setRoute(routeHistory.pop() || "watchlist");
});

renderActiveScreen("watchlist");
setRoute("watchlist", false);
installServiceWorker();
