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
  return `${ticker} ${company} latest results dividend earnings investment thesis risks`;
}

async function braveSearch(asset: Record<string, unknown>, search: Record<string, unknown>) {
  const apiKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
  if (!apiKey) throw new Error("Falta el secret BRAVE_SEARCH_API_KEY en Supabase");

  const query = buildBraveQuery(asset);
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

  return `Eres un analista de inversion. No uses web search propia ni herramientas externas. Analiza solo los datos proporcionados y las fuentes Brave incluidas. Devuelve JSON valido con estas claves: score number 0-100 si hay datos suficientes, thesisStatus string, summary string, drivers array, risks array, actions array.

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
            },
            required: ["score", "thesisStatus", "summary", "drivers", "risks", "actions"],
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!isAuthorized(request)) return jsonResponse({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    const asset = body.asset || {};
    if (!asset.ticker) return jsonResponse({ error: "Falta asset.ticker" }, 400);

    const model = String(body.model || Deno.env.get("OPENAI_MODEL") || "gpt-5.4-mini");
    const web = body.includeWeb ? await braveSearch(asset, body.search || {}) : { query: "", sources: [] };
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
