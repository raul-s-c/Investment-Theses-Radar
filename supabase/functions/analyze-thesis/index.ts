const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SearchResult = {
  title: string;
  url: string;
  description: string;
  age: string;
};

type MarketData = {
  quote: Record<string, unknown>;
  history: Array<{ date: string; close: number }>;
  fundamentals: Array<{ label: string; value: string }>;
  technicals: Array<{ label: string; value: string }>;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function knownPublishableKeys() {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Object.values(parsed).filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function isAuthorized(request: Request) {
  const key = request.headers.get("apikey") || "";
  const known = knownPublishableKeys();
  if (known.length) return known.includes(key);
  return key.startsWith("sb_publishable_");
}

function buildBraveQuery(asset: Record<string, unknown>) {
  const ticker = String(asset.ticker || "").trim();
  const company = String(asset.company || ticker).trim();
  return `${ticker} ${company} current stock price valuation fundamentals latest results earnings dividend calendar financials investment thesis risks`;
}

async function braveSearch(queryOrAsset: string | Record<string, unknown>, search: Record<string, unknown>) {
  const apiKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (!apiKey) throw new Error("Falta el secret BRAVE_SEARCH_API_KEY en Supabase");

  const query = typeof queryOrAsset === "string" ? queryOrAsset : buildBraveQuery(queryOrAsset);
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(search.count || 8));
  url.searchParams.set("country", String(search.country || "US"));
  url.searchParams.set("search_lang", String(search.language || "en"));
  url.searchParams.set("safesearch", "moderate");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || data?.error || `Brave HTTP ${response.status}`);

  const sources = (data.web?.results || []).slice(0, Number(search.count || 8)).map((item: Record<string, unknown>) => ({
    title: String(item.title || ""),
    url: String(item.url || ""),
    description: String(item.description || ""),
    age: String(item.age || ""),
  }));

  return { query, sources };
}

async function fetchYahooSearch(ticker: string) {
  try {
    const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
    url.searchParams.set("q", ticker);
    url.searchParams.set("quotesCount", "5");
    url.searchParams.set("newsCount", "0");
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.quotes?.[0] || null;
  } catch {
    return null;
  }
}

function yahooTickerCandidates(rawTicker: string) {
  const ticker = rawTicker.trim().toUpperCase();
  const candidates = new Set<string>();
  candidates.add(ticker);
  if (ticker.includes(":")) {
    const [symbol, exchange] = ticker.split(":");
    const suffixByExchange: Record<string, string> = {
      EGX: ".CA",
      CAI: ".CA",
      AMS: ".AS",
      AS: ".AS",
      HKEX: ".HK",
      HKG: ".HK",
      SGX: ".SI",
      SG: ".SI",
      LSE: ".L",
      LON: ".L",
      TSE: ".TO",
      TSX: ".TO",
      NSE: ".NS",
      BSE: ".BO",
    };
    candidates.add(symbol);
    if (suffixByExchange[exchange]) candidates.add(`${symbol}${suffixByExchange[exchange]}`);
  }
  return [...candidates].filter(Boolean);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function closeAtOffset(values: number[], days: number) {
  if (!values.length) return null;
  return values[Math.max(0, values.length - 1 - days)] ?? null;
}

function percentChange(now: number, then: number | null) {
  return Number.isFinite(now) && Number.isFinite(then) && then ? ((now - Number(then)) / Number(then)) * 100 : null;
}

function buildTechnicals(history: Array<{ close: number }>) {
  const closes = history.map((point) => point.close).filter(Number.isFinite);
  const last = closes.at(-1);
  if (!Number.isFinite(last)) return [];
  const sma50 = average(closes.slice(-50));
  const sma200 = average(closes.slice(-200));
  const high52 = Math.max(...closes);
  const low52 = Math.min(...closes);
  const ret1m = percentChange(Number(last), closeAtOffset(closes, 21));
  const ret3m = percentChange(Number(last), closeAtOffset(closes, 63));
  const ret1y = percentChange(Number(last), closeAtOffset(closes, 252));
  const trend = sma50 && sma200 ? (sma50 > sma200 ? "alcista (SMA50 > SMA200)" : "debil/bajista (SMA50 <= SMA200)") : "insuficiente";
  return [
    { label: "Tendencia tecnica", value: trend },
    sma50 ? { label: "SMA 50", value: sma50.toFixed(2) } : null,
    sma200 ? { label: "SMA 200", value: sma200.toFixed(2) } : null,
    Number.isFinite(ret1m) ? { label: "Retorno 1m", value: `${Number(ret1m).toFixed(2)}%` } : null,
    Number.isFinite(ret3m) ? { label: "Retorno 3m", value: `${Number(ret3m).toFixed(2)}%` } : null,
    Number.isFinite(ret1y) ? { label: "Retorno 1y", value: `${Number(ret1y).toFixed(2)}%` } : null,
    { label: "Max 52s", value: high52.toFixed(2) },
    { label: "Min 52s", value: low52.toFixed(2) },
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

async function fetchYahooMarketData(asset: Record<string, unknown>): Promise<MarketData> {
  const rawTicker = String(asset.ticker || "").trim();
  let chart: any = null;
  let search: any = null;
  let resolvedTicker = rawTicker;
  for (const candidate of yahooTickerCandidates(rawTicker)) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidate)}?range=1y&interval=1d`;
    const chartResponse = await fetch(url);
    if (!chartResponse.ok) continue;
    const result = (await chartResponse.json())?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    if (timestamps.length && closes.some((value: unknown) => Number.isFinite(Number(value)))) {
      chart = result;
      resolvedTicker = candidate;
      search = await fetchYahooSearch(candidate);
      break;
    }
  }
  if (!chart) throw new Error(`Yahoo Chart sin datos para ${rawTicker}`);
  const meta = chart?.meta || {};
  const timestamps = chart?.timestamp || [];
  const closes = chart?.indicators?.quote?.[0]?.close || [];
  const history = timestamps
    .map((timestamp: number, index: number) => ({ date: new Date(timestamp * 1000).toISOString().slice(0, 10), close: Number(closes[index]) }))
    .filter((point: { close: number }) => Number.isFinite(point.close));
  const price = Number(meta.regularMarketPrice || history.at(-1)?.close);
  const previous = Number(history.at(-2)?.close || meta.chartPreviousClose || price);
  const quote = {
    ticker: rawTicker,
    yahooSymbol: resolvedTicker,
    company: search?.longname || search?.shortname || asset.company || "",
    sector: search?.sector || asset.sector || "",
    assetType: search?.quoteType || "",
    exchange: search?.exchange || meta.exchangeName || "",
    currency: meta.currency || asset.currency || "",
    price,
    changePercent: previous ? ((price - previous) / previous) * 100 : null,
    source: "Yahoo Chart",
  };
  const fundamentals = [
    resolvedTicker !== rawTicker ? { label: "Simbolo Yahoo", value: resolvedTicker } : null,
    search?.quoteType ? { label: "Tipo de activo", value: String(search.quoteType) } : null,
    search?.exchange ? { label: "Bolsa", value: String(search.exchange) } : null,
    meta.currency ? { label: "Moneda", value: String(meta.currency) } : null,
    Number.isFinite(price) ? { label: "Precio actual", value: String(price) } : null,
    history.length ? { label: "Historico Yahoo", value: `${history.length} cierres diarios` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const technicals = buildTechnicals(history);
  return { quote, history, fundamentals, technicals };
}

function buildPrompt(asset: Record<string, unknown>, position: Record<string, unknown>, sources: SearchResult[], marketData: MarketData | null) {
  const webSection = sources.length
    ? sources.map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nSnippet: ${item.description}`).join("\n\n")
    : "No se aportan resultados web. No busques por tu cuenta.";

  return `Eres un analista de inversion. No uses web search propia ni herramientas externas. Analiza solo los datos proporcionados y las fuentes Brave incluidas. Devuelve JSON valido con estas claves:
- score number 0-100 si hay datos suficientes
- thesisStatus string
- summary string
- drivers array
- risks array
- actions array
- assetPatch object con company, sector, currency, price, changePercent, thesis, drivers, breakers, risks, events, fundamentals

assetPatch.events debe incluir resultados, dividendos y catalizadores si aparecen en fuentes o datos del usuario. assetPatch.fundamentals debe incluir datos de mercado, tecnico, valoracion, deuda, caja, crecimiento, guia y dividendos cuando existan en Datos Yahoo/mercado o Fuentes Brave, sin inventar.

Ticker: ${asset.ticker || "no indicado"}
Empresa: ${asset.company || "no indicada"}
Sector: ${asset.sector || "no indicado"}
Precio disponible: ${asset.price || "no indicado"} ${asset.currency || ""}
Cambio: ${asset.changePercent || "no indicado"}
Posicion: ${JSON.stringify(position || {})}
Datos Yahoo/mercado: ${JSON.stringify(marketData || {})}
Tesis del usuario: ${asset.thesis || "no indicada"}
Drivers del usuario: ${JSON.stringify(asset.drivers || [])}
Breakers del usuario: ${JSON.stringify(asset.breakers || [])}
Riesgos del usuario: ${JSON.stringify(asset.risks || [])}
Eventos: ${JSON.stringify(asset.events || [])}
Fuentes Brave:
${webSection}

Si Datos Yahoo/mercado incluye precio o cambio porcentual, NO digas que falta precio o cambio. Si incluye technicals, incluye analisis tecnico en summary/drivers/risks y copia esos technicals a assetPatch.fundamentals. Si faltan deuda, caja, crecimiento, guia, valoracion o dividendos, primero intenta extraerlos de Fuentes Brave; solo si no aparecen, incluyelos como datos pendientes en actions. Cita fuentes solo cuando esten en snippets, datos Yahoo/mercado o datos del usuario.`;
}

function buildDiscoveryPrompt(thesis: string, sources: SearchResult[]) {
  const webSection = sources.map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nSnippet: ${item.description}`).join("\n\n");
  return `Eres un analista de inversion. Primero interpreta la tesis como una cadena causal economica, no como una busqueda literal de palabras. Devuelve JSON valido con una clave suggestions, array de hasta 8 activos cotizados que sean implementaciones positivas o coberturas razonables de esa tesis.

Incluye acciones, fondos cotizados, ETFs o fondos cerrados cuando sean relevantes; no limites la respuesta a acciones. Prioriza activos que se beneficiarian de la tesis, no activos directamente perjudicados por ella. Si un activo aparece solo porque comparte nombre o geografia pero la tesis lo perjudica, no lo sugieras salvo que thesisRole indique claramente "evitar/impacto negativo".

Cada item debe tener ticker, company, sector, assetType, thesisRole, rationale, score number 0-100. Usa solo estas fuentes Brave y la tesis del usuario. No inventes tickers.

Tesis del usuario:
${thesis}

Fuentes Brave:
${webSection}`;
}

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = Array.isArray(data.output) ? data.output : [];
  return output
    .flatMap((item: any) => Array.isArray(item.content) ? item.content : [])
    .map((content: any) => content.text || "")
    .filter(Boolean)
    .join("\n");
}

async function openAiReport(model: string, prompt: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Falta el secret OPENAI_API_KEY en Supabase");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
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
              assetPatch: {
                type: "object",
                additionalProperties: false,
                properties: {
                  company: { type: "string" },
                  sector: { type: "string" },
                  currency: { type: "string" },
                  price: { type: "string" },
                  changePercent: { type: "string" },
                  thesis: { type: "string" },
                  drivers: { type: "array", items: { type: "string" } },
                  breakers: { type: "array", items: { type: "string" } },
                  risks: { type: "array", items: { type: "string" } },
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        type: { type: "string" },
                        date: { type: "string" },
                        note: { type: "string" },
                      },
                      required: ["type", "date", "note"],
                    },
                  },
                  fundamentals: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        label: { type: "string" },
                        value: { type: "string" },
                      },
                      required: ["label", "value"],
                    },
                  },
                },
                required: ["company", "sector", "currency", "price", "changePercent", "thesis", "drivers", "breakers", "risks", "events", "fundamentals"],
              },
            },
            required: ["score", "thesisStatus", "summary", "drivers", "risks", "actions", "assetPatch"],
          },
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);

  const outputText = extractOutputText(data);
  try {
    return JSON.parse(outputText);
  } catch {
    return { raw: outputText };
  }
}

async function openAiDiscovery(model: string, prompt: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Falta el secret OPENAI_API_KEY en Supabase");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "thesis_discovery",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    ticker: { type: "string" },
                    company: { type: "string" },
                    sector: { type: "string" },
                    assetType: { type: "string" },
                    thesisRole: { type: "string" },
                    rationale: { type: "string" },
                    score: { type: "number" },
                  },
                  required: ["ticker", "company", "sector", "assetType", "thesisRole", "rationale", "score"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
  const outputText = extractOutputText(data);
  try {
    return JSON.parse(outputText);
  } catch {
    return { suggestions: [] };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!isAuthorized(request)) return jsonResponse({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    const model = String(body.model || Deno.env.get("OPENAI_MODEL") || "gpt-5.4-mini");
    if (body.mode === "discovery") {
      const thesis = String(body.thesis || "").trim();
      if (!thesis) return jsonResponse({ error: "Falta thesis" }, 400);
      const web = await braveSearch(`${thesis} investment beneficiaries supply chain winners stocks ETFs funds tickers holdings`, body.search || {});
      const result = await openAiDiscovery(model, buildDiscoveryPrompt(thesis, web.sources));
      return jsonResponse({ ...result, sources: web.sources, query: web.query, model, usedWebSearch: true });
    }

    const asset = body.asset || {};
    if (!asset.ticker) return jsonResponse({ error: "Falta asset.ticker" }, 400);

    const marketData = await fetchYahooMarketData(asset);
    if (body.mode === "market") return jsonResponse({ marketData });

    const enrichedAsset = { ...asset, ...marketData.quote };
    const ticker = String(enrichedAsset.ticker || asset.ticker || "");
    const company = String(enrichedAsset.company || ticker);
    const queries = [
      buildBraveQuery(enrichedAsset),
      `${ticker} ${company} valuation PE ratio EV EBITDA debt cash revenue growth guidance latest quarterly results`,
      `${ticker} ${company} dividend yield payout earnings calendar next results balance sheet free cash flow`,
      `${ticker} ${company} stock technical analysis moving average RSI 52 week high low`,
    ];
    const webParts = await Promise.all(queries.map((query) => braveSearch(query, { ...(body.search || {}), count: 5 })));
    const sources = webParts.flatMap((part) => part.sources).filter((source, index, all) => source.url && all.findIndex((item) => item.url === source.url) === index).slice(0, 12);
    const prompt = buildPrompt(enrichedAsset, body.position || {}, sources, marketData);
    const report = await openAiReport(model, prompt);

    return jsonResponse({
      report,
      marketData,
      sources,
      query: queries.join(" | "),
      model,
      usedWebSearch: Boolean(body.includeWeb),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return jsonResponse({ error: message }, 500);
  }
});
