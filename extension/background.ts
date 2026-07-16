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
})

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
