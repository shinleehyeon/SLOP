export type OpenRouterWebCitation = {
  url: string;
  title: string | null;
  snippet: string | null;
};

/**
 * OpenRouter web-search / Perplexity responses expose sources as:
 * - message.annotations[].url_citation (OpenRouter standard)
 * - top-level citations: string[] (Perplexity passthrough)
 * - top-level search_results: { title, url, snippet }[] (Perplexity passthrough)
 *
 * Prefer richer fields first, then fill gaps from URL-only citations.
 * @see https://openrouter.ai/docs/guides/features/plugins/web-search
 * @see https://docs.perplexity.ai/api-reference/sonar-post
 */
export function extractOpenRouterCitations(response: unknown): OpenRouterWebCitation[] {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const root = response as Record<string, unknown>;
  const byUrl = new Map<string, OpenRouterWebCitation>();

  const message = getAssistantMessage(root);
  for (const citation of citationsFromAnnotations(message?.annotations)) {
    upsertCitation(byUrl, citation);
  }

  for (const citation of citationsFromSearchResults(root.search_results)) {
    upsertCitation(byUrl, citation);
  }

  for (const citation of citationsFromUrlList(root.citations)) {
    upsertCitation(byUrl, citation);
  }

  return [...byUrl.values()];
}

export function readAssistantContent(response: unknown): string {
  const message = getAssistantMessage(
    response && typeof response === 'object' ? (response as Record<string, unknown>) : null,
  );
  const content = message?.content;

  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  throw new Error('Empty LLM response');
}

function getAssistantMessage(root: Record<string, unknown> | null) {
  if (!root) {
    return null;
  }

  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const first = choices[0];
  if (!first || typeof first !== 'object') {
    return null;
  }

  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') {
    return null;
  }

  return message as Record<string, unknown>;
}

function citationsFromAnnotations(annotations: unknown): OpenRouterWebCitation[] {
  if (!Array.isArray(annotations)) {
    return [];
  }

  const results: OpenRouterWebCitation[] = [];

  for (const item of annotations) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const annotation = item as Record<string, unknown>;
    if (annotation.type !== 'url_citation') {
      continue;
    }

    const citation =
      annotation.url_citation && typeof annotation.url_citation === 'object'
        ? (annotation.url_citation as Record<string, unknown>)
        : annotation;

    const url = asTrimmedUrl(citation.url);
    if (!url) {
      continue;
    }

    results.push({
      url,
      title: asNullableString(citation.title),
      snippet: asNullableString(citation.content ?? citation.snippet),
    });
  }

  return results;
}

function citationsFromSearchResults(searchResults: unknown): OpenRouterWebCitation[] {
  if (!Array.isArray(searchResults)) {
    return [];
  }

  const results: OpenRouterWebCitation[] = [];

  for (const item of searchResults) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const result = item as Record<string, unknown>;
    const url = asTrimmedUrl(result.url);
    if (!url) {
      continue;
    }

    results.push({
      url,
      title: asNullableString(result.title),
      snippet: asNullableString(result.snippet),
    });
  }

  return results;
}

function citationsFromUrlList(citations: unknown): OpenRouterWebCitation[] {
  if (!Array.isArray(citations)) {
    return [];
  }

  return citations
    .map((item) => asTrimmedUrl(item))
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url, title: null, snippet: null }));
}

function upsertCitation(
  byUrl: Map<string, OpenRouterWebCitation>,
  citation: OpenRouterWebCitation,
) {
  const existing = byUrl.get(citation.url);
  if (!existing) {
    byUrl.set(citation.url, citation);
    return;
  }

  byUrl.set(citation.url, {
    url: citation.url,
    title: existing.title ?? citation.title,
    snippet: existing.snippet ?? citation.snippet,
  });
}

function asTrimmedUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }

  return trimmed;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}
