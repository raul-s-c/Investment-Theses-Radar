const STORAGE_KEY = "thesis-radar-real-v1";
const routes = ["watchlist", "detail", "report", "thesis", "history", "calendar", "add", "discovery", "settings"];
const routeHistory = ["watchlist"];
const DATA_SOURCES = [
  { id: "stooq", label: "Stooq CSV" },
  { id: "yahoo-chart", label: "Yahoo chart" },
];

const screenTitle = document.querySelector("#screenTitle");
const screenSubtitle = document.querySelector("#screenSubtitle");
const backButton = document.querySelector("#backButton");
const topAction = document.querySelector("#topAction");

let state = loadState();

function defaultState() {
  return {
    portfolio: [],
    selectedTicker: null,
    assetsByTicker: {},
    positionsByTicker: {},
    reportsByTicker: {},
    quoteStatusByTicker: {},
    lastDataRefresh: null,
    sync: {
      supabaseUrl: "",
      supabaseAnonKey: "",
      syncKey: crypto.randomUUID(),
      lastSyncAt: null,
      status: "Sin configurar",
    },
    ai: {
      apiKey: "",
      model: "gpt-5.4-mini",
      lastError: "",
    },
    search: {
      braveApiKey: "",
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
    quoteStatusByTicker: { ...base.quoteStatusByTicker, ...saved.quoteStatusByTicker },
    sync: { ...base.sync, ...saved.sync },
    ai: { ...base.ai, ...saved.ai },
    search: { ...base.search, ...saved.search },
  };
}

function saveState() {
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
  const withReports = assets.filter((asset) => state.reportsByTicker[asset.ticker]).length;
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
      <button data-route="calendar" type="button">${icon("calendar")}<span>Calendario</span></button>
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
  const report = state.reportsByTicker[asset.ticker];
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
  const report = state.reportsByTicker[asset.ticker];
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
      <button type="button" data-generate-report="${asset.ticker}">${icon("refresh")}<span>Informe IA</span></button>
      <button type="button" data-refresh-one="${asset.ticker}">${icon("refresh")}<span>Precio</span></button>
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
      <h2>Historico real</h2>
      <p>No se muestra grafico hasta que exista una serie historica real guardada. Siguiente paso: guardar precios diarios en Supabase.</p>
    </article>
  `;
}

function renderReport() {
  const asset = assetByTicker();
  if (!asset) return renderNoAsset("report");
  const report = state.reportsByTicker[asset.ticker];
  const searchResults = state.search.lastResultsByTicker?.[asset.ticker]?.results || [];
  document.querySelector("#screen-report").innerHTML = `
    <article class="panel">
      <h2>${escapeHtml(asset.ticker)} - Informe IA</h2>
      <p>${report ? `Generado: ${escapeHtml(formatTimestamp(report.createdAt))}. Modelo: ${escapeHtml(report.model || "No indicado")}.` : "Aun no hay informe real. Introduce tu API key en Ajustes y genera uno bajo demanda."}</p>
      <button class="wide-button" type="button" data-generate-report="${asset.ticker}">Generar sin web search</button>
      <button class="wide-button ghost" type="button" data-generate-report-web="${asset.ticker}">Buscar con Brave + analizar</button>
    </article>
    ${report ? `<article class="panel report-output"><h2>Resultado</h2>${renderReportBody(report)}</article>` : `<article class="panel empty-state"><h2>Sin puntuacion</h2><p>No calculo scores simulados. El score aparecera solo si lo devuelve el informe de OpenAI.</p></article>`}
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
      <button type="button" data-generate-report="${asset.ticker}">${icon("refresh")}<span>Informe IA</span></button>
    </div>
    <article class="panel"><h2>Tesis</h2><p>${escapeHtml(asset.thesis || "Pendiente de redactar.")}</p></article>
    <article class="panel checklist"><h2>Drivers</h2>${listItems(asset.drivers, "ok-dot", "Sin drivers definidos.")}</article>
    <article class="panel checklist"><h2>Breakers</h2>${listItems(asset.breakers, "bad-dot", "Sin breakers definidos.")}</article>
    <article class="panel checklist"><h2>Riesgos</h2>${listItems(asset.risks, "warn-dot", "Sin riesgos definidos.")}</article>
    <article class="panel event-list"><h2>Eventos</h2>${eventItems(asset.events)}</article>
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
  document.querySelector("#screen-history").innerHTML = `<article class="panel"><h2>Historico real</h2><p>No hay graficos simulados. Cuando conectemos Supabase para guardar precios diarios y revisiones, aqui se mostrara la serie real.</p></article>`;
}

function renderCalendar() {
  const rows = portfolioAssets()
    .flatMap((asset) => (asset.events || []).map((event) => ({ asset, event })))
    .sort((a, b) => String(a.event.date || "").localeCompare(String(b.event.date || "")));
  document.querySelector("#screen-calendar").innerHTML = `
    <article class="panel"><h2>Calendario</h2><p>Solo contiene eventos que tu introduzcas o que importemos desde una fuente real.</p></article>
    <div class="calendar-list">
      ${rows.length ? rows.map(({ asset, event }) => `<button class="calendar-row" type="button" data-open-ticker="${asset.ticker}" data-route="detail"><span class="calendar-date">${escapeHtml(event.date || "Sin fecha")}</span><span><h3>${escapeHtml(asset.ticker)}</h3><p>${escapeHtml(event.type || "Evento")} - ${escapeHtml(event.note || "")}</p></span></button>`).join("") : `<article class="panel empty-state"><h2>Sin eventos</h2><p>Edita un activo para anadir resultados, dividendos o catalizadores.</p></article>`}
    </div>
  `;
}

function renderSearch() {
  document.querySelector("#screen-add").innerHTML = `
    <label class="search-box">${icon("plus")}<input id="tickerInput" type="search" placeholder="Ticker real, ej. AAPL, ASML.AS, 0700.HK" /></label>
    <button class="wide-button" type="button" data-create-from-input>Anadir ticker</button>
    <article class="panel"><h2>Sin catalogo inventado</h2><p>Introduce el ticker real. Despues podras actualizar precio, tesis, posicion y generar informe IA.</p></article>
  `;
}

function renderDiscovery() {
  document.querySelector("#screen-discovery").innerHTML = `
    <article class="panel"><h2>Thesis Discovery</h2><p>Desactivado hasta que usemos OpenAI con datos reales. No se generaran sugerencias heuristicas inventadas.</p></article>
    <article class="step-card"><span>1</span><label>Idea de inversion</label><textarea id="discoveryPrompt" placeholder="Describe una tesis para que la API proponga tickers cuando activemos esta funcion."></textarea></article>
    <button class="wide-button" type="button" data-discovery-ai>Preparado para IA</button>
  `;
}

function renderSettings() {
  document.querySelector("#screen-settings").innerHTML = `
    <article class="panel">
      <h2>Supabase</h2>
      <p>Para sincronizar movil y PC, crea un proyecto y ejecuta <code>supabase/solo_sync.sql</code>. Luego pega URL y anon key aqui.</p>
      <label class="form-field">Project URL<input name="supabaseUrl" value="${escapeHtml(state.sync.supabaseUrl)}" placeholder="https://xxxx.supabase.co" /></label>
      <label class="form-field">Anon public key<input name="supabaseAnonKey" value="${escapeHtml(state.sync.supabaseAnonKey)}" placeholder="eyJ..." /></label>
      <label class="form-field">Sync key<input name="syncKey" value="${escapeHtml(state.sync.syncKey)}" /></label>
      <div class="button-grid"><button class="wide-button ghost" type="button" data-save-settings>Guardar</button><button class="wide-button ghost" type="button" data-sync-pull>Descargar</button></div>
      <button class="wide-button ghost" type="button" data-sync-push>Subir estado</button>
      <p class="muted tiny">Estado: ${escapeHtml(state.sync.status)}. Ultima sync: ${escapeHtml(formatTimestamp(state.sync.lastSyncAt))}.</p>
    </article>
    <article class="panel">
      <h2>OpenAI</h2>
      <p>Modo prueba: la key se guarda solo en este navegador. No uses esto como arquitectura final publica.</p>
      <label class="form-field">API key<input name="openaiKey" type="password" value="${escapeHtml(state.ai.apiKey)}" placeholder="sk-..." /></label>
      <label class="form-field">Modelo<input name="openaiModel" value="${escapeHtml(state.ai.model)}" /></label>
      <button class="wide-button ghost" type="button" data-save-settings>Guardar API</button>
      ${state.ai.lastError ? `<p class="bad tiny">${escapeHtml(state.ai.lastError)}</p>` : ""}
    </article>
    <article class="panel">
      <h2>Brave Search</h2>
      <p>Busquedas manuales para enriquecer informes. Cada informe con Brave consume una consulta.</p>
      <label class="form-field">API key<input name="braveApiKey" type="password" value="${escapeHtml(state.search.braveApiKey)}" placeholder="BSA..." /></label>
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
  const results = await Promise.all(assets.map((asset) => fetchMarketQuote(asset)));
  results.forEach(({ asset, quote, error }) => {
    if (quote) {
      state.assetsByTicker[asset.ticker] = { ...asset, price: quote.price, changePercent: quote.changePercent, currency: quote.currency || asset.currency, updatedAt: new Date().toISOString() };
      state.quoteStatusByTicker[asset.ticker] = { ok: true, source: quote.source, at: new Date().toISOString(), message: "Precio real actualizado" };
    } else {
      state.quoteStatusByTicker[asset.ticker] = { ok: false, source: "Stooq/Yahoo", at: new Date().toISOString(), message: error || "Fuente no disponible desde navegador" };
    }
  });
  state.lastDataRefresh = new Date().toISOString();
  saveState();
  setRoute(document.querySelector(".screen.is-active").id.replace("screen-", ""), false);
  showToast(`${results.filter((item) => item.quote).length}/${results.length} precios actualizados`);
}

async function fetchMarketQuote(asset) {
  for (const source of DATA_SOURCES) {
    try {
      const quote = source.id === "stooq" ? await fetchStooqQuote(asset) : await fetchYahooChartQuote(asset);
      if (quote) return { asset, quote: { ...quote, source: source.label } };
    } catch (error) {
      if (source.id === DATA_SOURCES.at(-1).id) return { asset, error: error.message };
    }
  }
  return { asset, error: "Sin datos para este ticker" };
}

function stooqSymbol(ticker) {
  const normalized = ticker.toLowerCase();
  const replacements = [[/\.hk$/, ".hk"], [/\.si$/, ".sg"], [/\.ss$/, ".cn"], [/\.sz$/, ".cn"], [/\.ks$/, ".kr"], [/\.as$/, ".nl"]];
  const [pattern, suffix] = replacements.find(([pattern]) => pattern.test(normalized)) || [];
  if (pattern) return normalized.replace(pattern, suffix);
  if (!normalized.includes(".")) return `${normalized}.us`;
  return normalized;
}

async function fetchStooqQuote(asset) {
  const response = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol(asset.ticker))}&f=sd2t2c&e=csv`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Stooq HTTP ${response.status}`);
  const [, row] = (await response.text()).trim().split(/\r?\n/);
  if (!row || row.includes("N/D")) return null;
  const [, , , close] = row.split(",");
  const price = Number(close);
  if (!Number.isFinite(price)) return null;
  const previous = Number(asset.price) || price;
  return { price, changePercent: previous ? ((price - previous) / previous) * 100 : null, currency: asset.currency };
}

async function fetchYahooChartQuote(asset) {
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.ticker)}?range=5d&interval=1d`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
  const result = (await response.json())?.chart?.result?.[0];
  const meta = result?.meta;
  const closes = (result?.indicators?.quote?.[0]?.close || []).filter((value) => Number.isFinite(value));
  const price = Number(meta?.regularMarketPrice || closes.at(-1));
  if (!Number.isFinite(price)) return null;
  const previous = Number(closes.at(-2) || meta?.chartPreviousClose || asset.price || price);
  return { price, changePercent: previous ? ((price - previous) / previous) * 100 : null, currency: meta?.currency || asset.currency };
}

async function generateReport(ticker, includeWeb = false) {
  const asset = assetByTicker(ticker);
  if (!asset) return;
  if (!state.ai.apiKey) {
    setRoute("settings");
    showToast("Pega tu API key de OpenAI");
    return;
  }
  showToast("Generando informe...");
  try {
    let webContext = [];
    if (includeWeb) {
      webContext = await braveSearchForAsset(asset);
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.ai.apiKey}` },
      body: JSON.stringify({
        model: state.ai.model,
        input: buildReportPrompt(asset, webContext),
        text: {
          format: {
            type: "json_schema",
            name: "investment_thesis_report",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                score: { type: "number" },
                thesisStatus: { type: "string" },
                summary: { type: "string" },
                drivers: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } },
              },
              required: ["score", "thesisStatus", "summary", "drivers", "risks", "actions"],
            },
          },
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
    const outputText = data.output_text || data.output?.flatMap((item) => item.content || []).map((content) => content.text || "").join("\n") || "";
    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      parsed = { raw: outputText };
    }
    state.reportsByTicker[ticker] = { ...parsed, raw: parsed.raw || outputText, model: state.ai.model, createdAt: new Date().toISOString(), usedWebSearch: includeWeb, sourceCount: webContext.length };
    state.ai.lastError = "";
    saveState();
    setRoute("report");
    showToast("Informe generado");
  } catch (error) {
    if (includeWeb) state.search.lastError = error.message;
    state.ai.lastError = error.message;
    saveState();
    setRoute("settings");
    showToast("Error OpenAI");
  }
}

async function braveSearchForAsset(asset) {
  if (!state.search.braveApiKey) {
    setRoute("settings");
    throw new Error("Pega tu API key de Brave Search");
  }
  resetSearchUsageIfNeeded();
  if (Number(state.search.usedThisMonth) >= Number(state.search.monthlyLimit)) {
    throw new Error("Limite mensual de Brave alcanzado");
  }
  const query = buildBraveQuery(asset);
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "8");
  url.searchParams.set("country", state.search.country || "US");
  url.searchParams.set("search_lang", state.search.language || "en");
  url.searchParams.set("safesearch", "moderate");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": state.search.braveApiKey,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || data?.error || `Brave HTTP ${response.status}`);
  const results = (data.web?.results || []).slice(0, 8).map((item) => ({
    title: item.title || "",
    url: item.url || "",
    description: item.description || "",
    age: item.age || "",
  }));
  state.search.usedThisMonth = Number(state.search.usedThisMonth || 0) + 1;
  state.search.lastError = "";
  state.search.lastResultsByTicker[asset.ticker] = {
    at: new Date().toISOString(),
    query,
    results,
  };
  saveState();
  return results;
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
    const secrets = { apiKey: state.ai.apiKey, braveApiKey: state.search.braveApiKey, supabaseAnonKey: state.sync.supabaseAnonKey, supabaseUrl: state.sync.supabaseUrl };
    state = mergeState(defaultState(), rows[0].payload || {});
    state.ai.apiKey = secrets.apiKey;
    state.search.braveApiKey = secrets.braveApiKey;
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
  clone.ai.apiKey = "";
  clone.search.braveApiKey = "";
  clone.sync.supabaseAnonKey = "";
  clone.sync.supabaseUrl = "";
  return clone;
}

function hasSupabaseConfig() {
  return state.sync.supabaseUrl && state.sync.supabaseAnonKey && state.sync.syncKey;
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${state.sync.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: state.sync.supabaseAnonKey,
      Authorization: `Bearer ${state.sync.supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer ? `${options.prefer},return=representation` : "return=representation",
    },
    body: options.body,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase HTTP ${response.status}`);
  return data || [];
}

function saveSettingsFromScreen() {
  const screen = document.querySelector("#screen-settings");
  if (!screen) return;
  state.sync.supabaseUrl = screen.querySelector('[name="supabaseUrl"]')?.value.trim() ?? state.sync.supabaseUrl;
  state.sync.supabaseAnonKey = screen.querySelector('[name="supabaseAnonKey"]')?.value.trim() ?? state.sync.supabaseAnonKey;
  state.sync.syncKey = screen.querySelector('[name="syncKey"]')?.value.trim() || state.sync.syncKey;
  state.ai.apiKey = screen.querySelector('[name="openaiKey"]')?.value.trim() ?? state.ai.apiKey;
  state.ai.model = screen.querySelector('[name="openaiModel"]')?.value.trim() || state.ai.model;
  state.search.braveApiKey = screen.querySelector('[name="braveApiKey"]')?.value.trim() ?? state.search.braveApiKey;
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
  const reportButton = event.target.closest("[data-generate-report]");
  if (reportButton) return generateReport(reportButton.dataset.generateReport);
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
  if (event.target.closest("[data-discovery-ai]")) return showToast("Siguiente paso: conectar discovery con OpenAI");
});

backButton.addEventListener("click", () => {
  routeHistory.pop();
  setRoute(routeHistory.pop() || "watchlist");
});

renderActiveScreen("watchlist");
setRoute("watchlist", false);
installServiceWorker();
