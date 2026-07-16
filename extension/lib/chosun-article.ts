// Parsing for biz.chosun.com Arc "Fusion" article pages. The article body
// isn't in the initial HTML — Fusion hydrates it client-side from a JSON
// blob assigned to `Fusion.globalContent` inside the #fusion-metadata
// script tag, so we read the paragraphs from there and locate the matching
// rendered elements once React has mounted them.

// The site runs rendered text through a typography pass that swaps curly
// quotes (‘’“”) for straight ones, so the JSON source and the live DOM
// disagree on quote glyphs even for identical paragraphs — fold both to the
// same form before comparing, alongside whitespace collapsing.
function normalize(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function stripHtml(html: string): string {
  const div = document.createElement("div")
  div.innerHTML = html
  return normalize(div.textContent || "")
}

// `Fusion.globalContent={...};Fusion.` isn't valid to slice with a lazy
// regex — a string value could itself contain `};Fusion.` — so walk braces
// with string-awareness instead.
function extractBalancedJson(source: string, startIndex: number): string | null {
  let depth = 0
  let inString = false
  let escapeNext = false

  for (let i = startIndex; i < source.length; i++) {
    const ch = source[i]
    if (inString) {
      if (escapeNext) escapeNext = false
      else if (ch === "\\") escapeNext = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return source.slice(startIndex, i + 1)
    }
  }
  return null
}

function getFusionGlobalContent(): { content_elements?: unknown[] } | null {
  const script = document.getElementById("fusion-metadata")
  const text = script?.textContent
  if (!text) return null

  const marker = "Fusion.globalContent="
  const markerIndex = text.indexOf(marker)
  if (markerIndex === -1) return null

  const braceStart = markerIndex + marker.length
  if (text[braceStart] !== "{") return null

  const json = extractBalancedJson(text, braceStart)
  if (!json) return null

  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Returns the article body paragraphs in order, as plain text.
export function extractArticleParagraphs(): string[] {
  const globalContent = getFusionGlobalContent()
  const elements = globalContent?.content_elements
  if (!Array.isArray(elements)) return []

  return elements
    .filter(
      (el): el is { type: string; content: string } =>
        !!el && typeof el === "object" && (el as any).type === "text" && typeof (el as any).content === "string"
    )
    .map((el) => stripHtml(el.content))
    .filter((text) => text.length > 0)
}

// Finds the rendered element for each paragraph by exact (whitespace-
// normalized) text match, preferring <p> tags over generic containers so we
// grab the innermost element rather than a wrapper that also contains other
// paragraphs.
export function matchParagraphElements(texts: string[]): (HTMLElement | null)[] {
  const root = document.getElementById("article") || document.body
  const paragraphs = Array.from(root.querySelectorAll<HTMLElement>("p"))
  const divs = Array.from(root.querySelectorAll<HTMLElement>("div"))
  const used = new Set<HTMLElement>()

  return texts.map((text) => {
    const target = normalize(text)
    if (!target) return null

    const match =
      paragraphs.find((el) => !used.has(el) && normalize(el.textContent || "") === target) ??
      divs.find((el) => !used.has(el) && normalize(el.textContent || "") === target) ??
      null

    if (match) used.add(match)
    return match
  })
}

// Fusion renders the article body asynchronously after the content script
// loads, so poll briefly for at least one paragraph to show up before
// giving up.
export async function waitForArticleParagraphs(
  texts: string[],
  timeoutMs = 8000
): Promise<(HTMLElement | null)[]> {
  const start = Date.now()
  let matched = matchParagraphElements(texts)

  while (matched.every((el) => el === null) && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    matched = matchParagraphElements(texts)
  }

  return matched
}
