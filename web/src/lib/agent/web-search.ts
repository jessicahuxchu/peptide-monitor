import "server-only";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  provider: "tavily" | "serper" | "duckduckgo" | "none";
  query: string;
  results: WebSearchResult[];
  error?: string;
}

async function searchTavily(query: string, maxResults: number): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
    }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };

  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: r.content ?? "",
  }));
}

async function searchSerper(query: string, maxResults: number): Promise<WebSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num: maxResults }),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as {
    organic?: { title?: string; link?: string; snippet?: string }[];
  };

  return (data.organic ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.link ?? "",
    snippet: r.snippet ?? "",
  }));
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<WebSearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    AbstractText?: string;
    AbstractURL?: string;
    Heading?: string;
    RelatedTopics?: { Text?: string; FirstURL?: string }[];
  };

  const results: WebSearchResult[] = [];
  if (data.AbstractText) {
    results.push({
      title: data.Heading ?? "DuckDuckGo",
      url: data.AbstractURL ?? "",
      snippet: data.AbstractText,
    });
  }

  for (const topic of data.RelatedTopics ?? []) {
    if (results.length >= maxResults) break;
    if (!topic.Text) continue;
    results.push({
      title: topic.Text.slice(0, 80),
      url: topic.FirstURL ?? "",
      snippet: topic.Text,
    });
  }

  return results.slice(0, maxResults);
}

export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY);
}

export async function webSearch(
  query: string,
  maxResults = 5,
): Promise<WebSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { provider: "none", query: trimmed, results: [], error: "Empty query" };
  }

  try {
    let results = await searchTavily(trimmed, maxResults);
    if (results.length > 0) {
      return { provider: "tavily", query: trimmed, results };
    }

    results = await searchSerper(trimmed, maxResults);
    if (results.length > 0) {
      return { provider: "serper", query: trimmed, results };
    }

    results = await searchDuckDuckGo(trimmed, maxResults);
    if (results.length > 0) {
      return { provider: "duckduckgo", query: trimmed, results };
    }

    return {
      provider: "none",
      query: trimmed,
      results: [],
      error:
        "No web search results. Configure TAVILY_API_KEY or SERPER_API_KEY for richer results.",
    };
  } catch (err) {
    return {
      provider: "none",
      query: trimmed,
      results: [],
      error: err instanceof Error ? err.message : "Web search failed",
    };
  }
}
