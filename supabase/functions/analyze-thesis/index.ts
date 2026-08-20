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

function buildPrompt(asset: Record<string, unknown>, position: Record<string, unknown>, sources: SearchResult[]) {
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

assetPatch.events debe incluir resultados, dividendos y catalizadores si aparecen en fuentes o datos del usuario. assetPatch.fundamentals debe ser una lista compacta de metricas label/value encontradas en fuentes, sin inventar.

Ticker: ${asset.ticker || "no indicado"}
Empresa: ${asset.company || "no indicada"}
Sector: ${asset.sector || "no indicado"}
Precio disponible: ${asset.price || "no indicado"} ${asset.currency || ""}
Cambio: ${asset.changePercent || "no indicado"}
Posicion: ${JSON.stringify(position || {})}
Tesis del usuario: ${asset.thesis || "no indicada"}
Drivers del usuario: ${JSON.stringify(asset.drivers || [])}
Breakers del usuario: ${JSON.stringify(asset.breakers || [])}
Riesgos del usuario: ${JSON.stringify(asset.risks || [])}
Eventos: ${JSON.stringify(asset.events || [])}
Fuentes Brave:
${webSection}

Si faltan datos, dilo claramente y baja la confianza. No inventes fundamentales, noticias, dividendos, resultados ni precios. Cita fuentes solo cuando esten en los snippets o en datos del usuario.`;
}

function buildDiscoveryPrompt(thesis: string, sources: SearchResult[]) {
  const webSection = sources.map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nSnippet: ${item.description}`).join("\n\n");
  return `Eres un analista de inversion. Devuelve JSON valido con una clave suggestions, array de hasta 8 activos cotizados que encajen con la tesis. Incluye acciones, fondos cotizados, ETFs o fondos cerrados cuando sean relevantes; no limites la respuesta a acciones. Cada item debe tener ticker, company, sector, assetType, rationale, score number 0-100. Usa solo estas fuentes Brave y la tesis del usuario. No inventes tickers.

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
                    rationale: { type: "string" },
                    score: { type: "number" },
                  },
                  required: ["ticker", "company", "sector", "assetType", "rationale", "score"],
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
      const web = await braveSearch(`${thesis} public companies stocks ETFs funds tickers holdings fundamentals`, body.search || {});
      const result = await openAiDiscovery(model, buildDiscoveryPrompt(thesis, web.sources));
      return jsonResponse({ ...result, sources: web.sources, query: web.query, model, usedWebSearch: true });
    }

    const asset = body.asset || {};
    if (!asset.ticker) return jsonResponse({ error: "Falta asset.ticker" }, 400);

    const web = await braveSearch(asset, body.search || {});
    const prompt = buildPrompt(asset, body.position || {}, web.sources);
    const report = await openAiReport(model, prompt);

    return jsonResponse({
      report,
      sources: web.sources,
      query: web.query,
      model,
      usedWebSearch: Boolean(body.includeWeb),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return jsonResponse({ error: message }, 500);
  }
});
