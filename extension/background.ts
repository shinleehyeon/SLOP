import { API_BASE_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL } from "~lib/config"
import { getStoredTokens } from "~lib/auth"

export {}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SLOP_AUTH_TOKENS") {
    chrome.storage.local.set(
      {
        slopAccessToken: message.accessToken,
        slopRefreshToken: message.refreshToken
      },
      () => sendResponse({ ok: true })
    )
    return true
  }

  if (message?.type === "SLOP_INTERPRET_PARAGRAPHS") {
    interpretParagraphs(message.paragraphs)
      .then((paragraphs) => sendResponse({ ok: true, paragraphs }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_CREATE_TEXT_SUMMARY") {
    createTextSummary(message.text, message.context ?? null)
      .then((summary) => sendResponse({ ok: true, summary }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_GENERATE_SHORTS") {
    generateShorts(message.requestedSiteUrl)
      .then((generation) => sendResponse({ ok: true, generation }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_FETCH_SHORT_GENERATION") {
    fetchShortGeneration(message.generationId)
      .then((generation) => sendResponse({ ok: true, generation }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_FETCH_SHORT_SERIES") {
    fetchShortSeries(message.seriesId)
      .then((series) => sendResponse({ ok: true, series }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_CHECK_SHORT_DUPLICATES") {
    checkShortDuplicates(message.url)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_FETCH_VIDEO_BLOB") {
    fetchVideoDataUrl(message.url)
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }

  if (message?.type === "SLOP_FETCH_SHORT_BY_ID") {
    fetchShortById(message.shortId)
      .then((short) => sendResponse({ ok: true, short }))
      .catch((error) =>
        sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
      )
    return true
  }
})

// Backend-hosted short video files can come back as http://127.0.0.1:... —
// fine when the web app itself runs on http://localhost, but the extension
// injects <video> into whatever site the user is on (usually https), which
// the browser blocks as mixed content. A background service worker fetch
// isn't a page subresource, so it isn't subject to that check.
//
// Handing the Blob itself back across chrome.runtime.sendMessage looked
// right but silently produced nothing playable — MV3 service worker message
// passing doesn't reliably carry Blob payloads. Base64 data URLs are plain
// strings, so they survive the trip intact; encode here instead.
async function fetchVideoDataUrl(url: unknown): Promise<string> {
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("Invalid url payload")
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`영상을 불러오지 못했어요 (${response.status})`)
  }
  // The file server serves these without a proper video Content-Type (shows
  // up as generic application/octet-stream), which a <video> element won't
  // recognize as playable — force it to video/mp4 regardless of what the
  // response header said.
  const contentType = response.headers.get("content-type")
  const mime = contentType?.startsWith("video/") ? contentType : "video/mp4"

  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return `data:${mime};base64,${btoa(binary)}`
}

export interface TextSummaryCitation {
  url: string
  title: string
  snippet: string
}

export interface TextSummary {
  originalText: string
  content: string
  citations: TextSummaryCitation[]
  expressionId: string
}

async function createTextSummary(
  text: unknown,
  context: unknown
): Promise<TextSummary> {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Invalid text payload")
  }

  const tokens = await getStoredTokens()
  if (!tokens) {
    throw new Error("로그인이 필요합니다.")
  }

  const response = await fetch(`${API_BASE_URL}/api/text-summaries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`
    },
    body: JSON.stringify({
      text,
      context: typeof context === "string" && context.length > 0 ? context : null
    })
  })

  if (response.status === 401) {
    await new Promise<void>((resolve) =>
      chrome.storage.local.remove(["slopAccessToken", "slopRefreshToken"], () => resolve())
    )
    throw new Error("로그인이 만료됐어요. 다시 로그인해주세요.")
  }

  if (!response.ok) {
    throw new Error(`텍스트 요약 요청 실패 (${response.status})`)
  }

  const data = await response.json()
  return data.body as TextSummary
}

export type ShortGenerationStatus = "GENERATING" | "COMPLETED" | "DISPATCH_FAILED" | "FAILED"

export interface ShortGeneration {
  id: string
  status: ShortGenerationStatus
  seriesId: string | null
  errorMessage: string | null
}

export interface ShortSeries {
  id: string
  title: string
  shorts: { id: string; title: string; tags: string[]; videoFileUrl: string }[]
}

async function generateShorts(requestedSiteUrl: unknown): Promise<ShortGeneration> {
  if (typeof requestedSiteUrl !== "string" || requestedSiteUrl.length === 0) {
    throw new Error("Invalid requestedSiteUrl payload")
  }

  const tokens = await getStoredTokens()
  if (!tokens) {
    throw new Error("로그인이 필요합니다.")
  }

  const response = await fetch(`${API_BASE_URL}/api/shorts/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`
    },
    // The backend requires at least one of content/links/attachments —
    // requestedSiteUrl alone doesn't satisfy that, so also pass the site URL
    // as a link.
    body: JSON.stringify({ content: null, links: [requestedSiteUrl], attachments: [], requestedSiteUrl })
  })

  if (response.status === 401) {
    await new Promise<void>((resolve) =>
      chrome.storage.local.remove(["slopAccessToken", "slopRefreshToken"], () => resolve())
    )
    throw new Error("로그인이 만료됐어요. 다시 로그인해주세요.")
  }

  if (!response.ok) {
    throw new Error(await describeErrorResponse(response, "쇼츠 생성 요청 실패"))
  }

  const data = await response.json()
  return data.body as ShortGeneration
}

// The backend returns validation failures as { errors: [{ message, path }] }
// rather than a plain message, so surface that detail instead of just the
// status code when we can.
async function describeErrorResponse(response: Response, fallbackLabel: string): Promise<string> {
  try {
    const data = await response.json()
    const detail = Array.isArray(data?.errors)
      ? data.errors.map((e: { message?: string }) => e?.message).filter(Boolean).join(", ")
      : null
    return detail ? `${fallbackLabel}: ${detail}` : `${fallbackLabel} (${response.status})`
  } catch {
    return `${fallbackLabel} (${response.status})`
  }
}

async function fetchShortGeneration(generationId: unknown): Promise<ShortGeneration> {
  if (typeof generationId !== "string" || generationId.length === 0) {
    throw new Error("Invalid generationId payload")
  }

  const tokens = await getStoredTokens()
  if (!tokens) {
    throw new Error("로그인이 필요합니다.")
  }

  const response = await fetch(`${API_BASE_URL}/api/shorts/generations/${generationId}`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` }
  })

  if (!response.ok) {
    throw new Error(await describeErrorResponse(response, "쇼츠 생성 상태 조회 실패"))
  }

  const data = await response.json()
  return data.body as ShortGeneration
}

async function fetchShortSeries(seriesId: unknown): Promise<ShortSeries> {
  if (typeof seriesId !== "string" || seriesId.length === 0) {
    throw new Error("Invalid seriesId payload")
  }

  const tokens = await getStoredTokens()
  if (!tokens) {
    throw new Error("로그인이 필요합니다.")
  }

  const response = await fetch(`${API_BASE_URL}/api/shorts/series/${seriesId}`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` }
  })

  if (!response.ok) {
    throw new Error(await describeErrorResponse(response, "쇼츠 시리즈 조회 실패"))
  }

  const data = await response.json()
  return data.body as ShortSeries
}

export interface ShortListItem {
  id: string
  seriesId: string
  seriesTitle: string
  episodeNumber: number
  title: string
  tags: string[]
  videoFileUrl: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  creatorUserId: string
  creatorName: string
  createdAt: string
}

// There's no GET-by-id endpoint for a single short, so page through the
// "최신 쇼츠 목록" listing looking for the one we want.
async function fetchShortById(shortId: unknown): Promise<ShortListItem> {
  if (typeof shortId !== "string" || shortId.length === 0) {
    throw new Error("Invalid shortId payload")
  }

  const tokens = await getStoredTokens()
  if (!tokens) {
    throw new Error("로그인이 필요합니다.")
  }

  const MAX_PAGES = 10
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(`${API_BASE_URL}/api/shorts`)
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", "100")

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    })

    if (!response.ok) {
      throw new Error(await describeErrorResponse(response, "쇼츠 목록 조회 실패"))
    }

    const data = await response.json()
    const items = data.body.items as ShortListItem[]
    const found = items.find((item) => item.id === shortId)
    if (found) return found

    if (!data.body.meta?.hasNextPage) break
  }

  throw new Error("해당 쇼츠를 찾을 수 없어요.")
}

export interface ShortDuplicateMatch {
  jobId: string
  matchType: string
  duplicate: boolean
  similar: boolean
  score: number
  reasons: string[]
  title: string | null
  downloadUrl: string | null
  overlapUrls: string[]
}

export interface ShortDuplicateCheckResult {
  duplicate: boolean
  similar: boolean
  jobIds: string[]
  matches: ShortDuplicateMatch[]
}

async function checkShortDuplicates(url: unknown): Promise<ShortDuplicateCheckResult> {
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("Invalid url payload")
  }

  const tokens = await getStoredTokens()
  if (!tokens) {
    throw new Error("로그인이 필요합니다.")
  }

  const response = await fetch(`${API_BASE_URL}/api/shorts/duplicates/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`
    },
    body: JSON.stringify({ url })
  })

  if (response.status === 401) {
    await new Promise<void>((resolve) =>
      chrome.storage.local.remove(["slopAccessToken", "slopRefreshToken"], () => resolve())
    )
    throw new Error("로그인이 만료됐어요. 다시 로그인해주세요.")
  }

  if (!response.ok) {
    throw new Error(await describeErrorResponse(response, "중복 쇼츠 조회 실패"))
  }

  const data = await response.json()
  return data.body as ShortDuplicateCheckResult
}

const INTERPRET_SYSTEM_PROMPT =
  "너는 신문 기사 문단을 더 쉬운 한국어로 풀어써주는 도우미야. " +
  "입력은 기사 문단들의 JSON 배열이야. 각 문단의 의미와 사실관계는 그대로 유지하면서, " +
  "어려운 용어나 표현을 쉽게 풀어 초등학교 고학년도 이해할 수 있는 문장으로 다시 써줘. " +
  "각 문단에 등장하는 경제·금융·기술·정책 등 각 분야의 전문 용어나 약어(예: ADR, ETF, 콜옵션, API 등)는 " +
  "예외 없이 그 문단 안에서 무엇의 줄임말인지, 무슨 뜻인지 짧게 풀어서 설명해줘. " +
  "이미 원문에 뜻이 풀이되어 있어도 더 쉬운 말로 다시 설명해줘. " +
  "각 문단은 원문과 비슷한 길이로 다시 쓰고, 순서와 개수를 절대 바꾸지 마. " +
  "출력은 반드시 입력과 같은 길이의 JSON 문자열 배열만 반환해. 다른 설명, 코드블록, 마크다운은 절대 포함하지 마."

async function interpretParagraphs(paragraphs: unknown): Promise<string[]> {
  if (!Array.isArray(paragraphs) || paragraphs.some((p) => typeof p !== "string")) {
    throw new Error("Invalid paragraphs payload")
  }
  if (paragraphs.length === 0) return []
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set (extension/.env)")
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://shortlens.app",
      "X-Title": "Shortlens Page Interpreter"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: INTERPRET_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(paragraphs) }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status})`)
  }

  const data = await response.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ""
  const jsonText = extractJsonArray(content)
  const parsed = JSON.parse(jsonText)

  if (!Array.isArray(parsed) || parsed.length !== paragraphs.length) {
    throw new Error("Unexpected response shape from OpenRouter")
  }

  return parsed.map((item) => String(item))
}

// Models occasionally wrap the JSON array in prose or a ```json fence despite
// instructions, so pull out the outermost [...] slice before parsing.
function extractJsonArray(text: string): string {
  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON array found in OpenRouter response")
  }
  return text.slice(start, end + 1)
}
