import { useEffect, useRef, useState } from "react"

export const SHORTS_PANEL_STYLE = `
  .slop-fb-panel {
    position: fixed;
    bottom: 96px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 16px 40px rgba(17, 24, 39, 0.18);
    padding: 20px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    transform-origin: bottom right;
    animation: slop-fb-panel-pop 0.22s cubic-bezier(0.32, 0.72, 0, 1);
    transition: width 0.45s cubic-bezier(0.32, 0.72, 0, 1), height 0.45s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .slop-fb-panel.slop-fb-resizing {
    animation: none;
    transition: none;
  }

  .slop-fb-resize-edge {
    position: absolute;
    z-index: 1;
  }

  .slop-fb-resize-edge--left {
    top: 8px;
    bottom: 8px;
    left: -4px;
    width: 8px;
    cursor: ew-resize;
  }

  .slop-fb-resize-edge--top {
    left: 8px;
    right: 8px;
    top: -4px;
    height: 8px;
    cursor: ns-resize;
  }

  .slop-fb-resize-edge--corner {
    top: -4px;
    left: -4px;
    width: 16px;
    height: 16px;
    z-index: 2;
    cursor: nwse-resize;
  }

  @keyframes slop-fb-panel-pop {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .slop-fb-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
    margin-bottom: 18px;
  }

  .slop-fb-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .slop-fb-panel-titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .slop-fb-panel-title {
    margin: 0;
    color: #111827;
    font-size: 17px;
    font-weight: 800;
  }

  .slop-fb-panel-subtitle {
    margin: 0;
    color: #6b7280;
    font-size: 13px;
  }

  .slop-fb-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 9999px;
    background: #f0f1f3;
    color: #4b5563;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.15s ease;
  }

  .slop-fb-icon-btn:hover {
    background: #e5e7eb;
  }

  .slop-fb-shorts-feed {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    border-radius: 20px;
    scrollbar-width: none;
  }

  .slop-fb-shorts-feed::-webkit-scrollbar {
    display: none;
  }

  .slop-fb-shorts-slide {
    position: relative;
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    border-radius: 20px;
    background-size: cover;
    background-position: center;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slop-fb-shorts-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }

  .slop-fb-shorts-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(120% 90% at 50% 15%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.28) 100%);
    pointer-events: none;
  }

  .slop-fb-slide-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 14px 12px;
    background: linear-gradient(to top, rgba(11, 18, 32, 0.65), rgba(11, 18, 32, 0));
  }

  .slop-fb-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .slop-fb-tag {
    padding: 4px 10px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
  }

  .slop-fb-volume-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slop-fb-mute-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }

  .slop-fb-mute-btn:hover {
    background: rgba(255, 255, 255, 0.32);
  }

  .slop-fb-progress-track {
    position: relative;
    width: 100%;
    height: 4px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
  }

  .slop-fb-progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    width: 0%;
    height: 100%;
    border-radius: 9999px;
    background: #ffffff;
    pointer-events: none;
  }

  .slop-fb-sentinel {
    flex-shrink: 0;
    height: 1px;
  }

  .slop-fb-play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.92);
  }

  .slop-fb-play-btn--lg {
    width: 72px;
    height: 72px;
  }

  .slop-fb-fullscreen-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 9999px;
    background: rgba(17, 24, 39, 0.35);
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .slop-fb-fullscreen-btn:hover {
    background: rgba(17, 24, 39, 0.55);
  }

  .slop-fb-fullscreen-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: rgba(11, 18, 32, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slop-fb-fullscreen-card {
    position: relative;
    width: auto;
    height: min(calc(100vh - 48px), 900px);
    aspect-ratio: 9 / 16;
    max-width: calc(100vw - 32px);
    border-radius: 24px;
    background-size: cover;
    background-position: center;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }

  .slop-fb-fullscreen-close {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  .slop-fb-cta-btn {
    flex-shrink: 0;
    margin-top: 18px;
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 9999px;
    background: #70eaff;
    color: #0b1220;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .slop-fb-cta-btn:hover {
    background: #4de0fa;
  }

  .slop-fb-cta-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .slop-fb-cta-btn:disabled:hover {
    background: #70eaff;
  }

  .slop-fb-cta-btn--secondary {
    margin-top: 10px;
    background: #f0f1f3;
    color: #374151;
  }

  .slop-fb-cta-btn--secondary:hover {
    background: #e5e7eb;
  }

  .slop-fb-generate-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    min-height: 0;
    text-align: center;
  }

  .slop-fb-generate-spinner {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: 9999px;
    border: 4px solid #e5e7eb;
    border-top-color: #70eaff;
    animation: slop-fb-generate-spin 0.9s linear infinite;
  }

  @keyframes slop-fb-generate-spin {
    to { transform: rotate(360deg); }
  }

  .slop-fb-generate-waiting {
    margin: 0;
    color: #6b7280;
    font-size: 13px;
  }

  .slop-fb-generate-title {
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.5;
  }

  .slop-fb-generate-checklist {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .slop-fb-generate-check-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: #f5f7f9;
    color: #9ca3af;
    font-size: 13px;
    font-weight: 600;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .slop-fb-generate-check-item--active {
    color: #111827;
    background: #eaf9ff;
  }

  .slop-fb-generate-check-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    background: #e5e7eb;
    color: transparent;
    flex-shrink: 0;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .slop-fb-generate-check-icon--done {
    background: #70eaff;
    color: #0b1220;
  }
`

const SHORTS_GRADIENTS = [
  "linear-gradient(160deg, #ffd6a5, #fca5a5)",
  "linear-gradient(160deg, #a5d8ff, #91a7ff)",
  "linear-gradient(160deg, #b2f2bb, #63e6be)",
  "linear-gradient(160deg, #ffc9de, #f783ac)",
  "linear-gradient(160deg, #ffe066, #ffa94d)"
]

// Sentinel id for the single generated result video, kept out of the range
// of real `shorts` feed ids so it can share the feed's video ref/state maps.
const RESULT_ID = -1
const RESULT_TAGS = ["#내쇼츠", "#완성"]

const RESULT_GRADIENT = "linear-gradient(160deg, #a5d8ff, #91a7ff)"

// duplicates/check's downloadUrl currently points at the backend's own
// 127.0.0.1 file server, which nothing outside that machine can reach — show
// this known-working real short instead until that's fixed.
const MOCK_FEED_SHORT_ID = "cmrny1ow7008w01o2iopn4uqf"

const GENERATE_CHECK_ITEMS = ["사이트 분석 중", "핵심 내용 요약 중", "쇼츠 영상 생성 중"]
const CHECKLIST_STEP_MS = 1400

const GENERATION_POLL_MS = 2500
// Switch the UI from "generating" to the slower "pending" copy after this
// many attempts, but keep polling underneath rather than giving up — the
// panel used to stop checking entirely once it hit this point, so a
// generation that was still running server-side never made it back to the
// "result" view even though it completed.
const GENERATION_SLOW_ATTEMPTS = 24 // ~1 minute at GENERATION_POLL_MS intervals
const GENERATION_MAX_ATTEMPTS = 240 // ~10 minutes at GENERATION_POLL_MS intervals

const HEADER_TEXT = {
  feed: { title: "이건 어떠신가요?", subtitle: "다른 사람이 만든 쇼츠가 있어요" },
  generating: { title: "만드는 중이에요", subtitle: "사이트 내용을 요약하고 있어요" },
  result: { title: "완성됐어요!", subtitle: "만들어진 쇼츠를 확인해보세요" },
  pending: { title: "아직 만들고 있어요", subtitle: "완료되면 다시 확인해주세요" },
  error: { title: "만들지 못했어요", subtitle: "잠시 후 다시 시도해주세요" }
} as const

interface ShortGeneration {
  id: string
  status: "GENERATING" | "COMPLETED" | "DISPATCH_FAILED" | "FAILED"
  seriesId: string | null
  errorMessage: string | null
}

interface ShortSeries {
  id: string
  title: string
  shorts: { id: string; title: string; tags: string[]; videoFileUrl: string }[]
}

function requestShortsGeneration(requestedSiteUrl: string): Promise<ShortGeneration> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SLOP_GENERATE_SHORTS", requestedSiteUrl },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!response?.ok) {
          reject(new Error(response?.error ?? "쇼츠 생성 요청에 실패했어요"))
          return
        }
        resolve(response.generation)
      }
    )
  })
}

function fetchShortGenerationStatus(generationId: string): Promise<ShortGeneration> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SLOP_FETCH_SHORT_GENERATION", generationId },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!response?.ok) {
          reject(new Error(response?.error ?? "생성 상태 조회에 실패했어요"))
          return
        }
        resolve(response.generation)
      }
    )
  })
}

interface DuplicateMatch {
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

interface DuplicateCheckResult {
  duplicate: boolean
  similar: boolean
  jobIds: string[]
  matches: DuplicateMatch[]
}

function checkShortDuplicates(url: string): Promise<DuplicateCheckResult> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "SLOP_CHECK_SHORT_DUPLICATES", url }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "비슷한 쇼츠 조회에 실패했어요"))
        return
      }
      resolve(response.result)
    })
  })
}

interface ShortListItem {
  id: string
  title: string
  tags: string[]
  videoFileUrl: string
}

function fetchShortById(shortId: string): Promise<ShortListItem> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "SLOP_FETCH_SHORT_BY_ID", shortId }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "쇼츠 조회에 실패했어요"))
        return
      }
      resolve(response.short)
    })
  })
}

function fetchGeneratedShortSeries(seriesId: string): Promise<ShortSeries> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SLOP_FETCH_SHORT_SERIES", seriesId },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!response?.ok) {
          reject(new Error(response?.error ?? "쇼츠 조회에 실패했어요"))
          return
        }
        resolve(response.series)
      }
    )
  })
}

// Backend short video URLs can point at http://127.0.0.1:..., which the
// browser blocks as mixed content once this <video> is injected into an
// https page. Route the fetch through the background service worker (not a
// page subresource, so mixed-content rules don't apply) and get back a
// base64 data URL — a Blob handed back across chrome.runtime.sendMessage
// looked right but didn't reliably survive MV3 message passing.
function fetchVideoObjectUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "SLOP_FETCH_VIDEO_BLOB", url }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "영상을 불러오지 못했어요"))
        return
      }
      resolve(response.dataUrl as string)
    })
  })
}

// Shorts/Reels-style vertical video ratio (width:height = 9:16).
const SHORTS_RATIO = 9 / 16

const MIN_PANEL_WIDTH = 240
const MAX_PANEL_WIDTH = 480
const MIN_PANEL_HEIGHT = MIN_PANEL_WIDTH / SHORTS_RATIO
const MAX_PANEL_HEIGHT = MAX_PANEL_WIDTH / SHORTS_RATIO
const DEFAULT_PANEL_SIZE = { width: 360, height: 360 / SHORTS_RATIO }
const GENERATE_VIEW_HEIGHT = 460

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Clamps to the width/height bounds while locking the panel to SHORTS_RATIO —
// whichever axis the user is dragging drives the size, the other is derived.
function sizeFromWidth(width: number, maxViewportWidth: number, maxViewportHeight: number) {
  const clampedWidth = clamp(width, MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, maxViewportWidth))
  const height = clampedWidth / SHORTS_RATIO
  const maxHeight = Math.min(MAX_PANEL_HEIGHT, maxViewportHeight)
  if (height > maxHeight || height < MIN_PANEL_HEIGHT) {
    const clampedHeight = clamp(height, MIN_PANEL_HEIGHT, maxHeight)
    return { width: clampedHeight * SHORTS_RATIO, height: clampedHeight }
  }
  return { width: clampedWidth, height }
}

function sizeFromHeight(height: number, maxViewportWidth: number, maxViewportHeight: number) {
  const clampedHeight = clamp(height, MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, maxViewportHeight))
  const width = clampedHeight * SHORTS_RATIO
  const maxWidth = Math.min(MAX_PANEL_WIDTH, maxViewportWidth)
  if (width > maxWidth || width < MIN_PANEL_WIDTH) {
    const clampedWidth = clamp(width, MIN_PANEL_WIDTH, maxWidth)
    return { width: clampedWidth, height: clampedWidth / SHORTS_RATIO }
  }
  return { width, height: clampedHeight }
}

type ResizeDir = "left" | "top" | "corner"

function mapMatchesToShorts(matches: DuplicateMatch[]) {
  // downloadUrl/title are nullable per the API spec — a match can report a
  // similarity without an actual playable file, so there's nothing to show
  // in a video feed for those.
  return matches
    .filter((match): match is DuplicateMatch & { downloadUrl: string } => Boolean(match.downloadUrl))
    .map((match, i) => ({
      id: i,
      jobId: match.jobId,
      videoUrl: match.downloadUrl,
      title: match.title ?? "제목 없음",
      gradient: SHORTS_GRADIENTS[i % SHORTS_GRADIENTS.length],
      tags: match.reasons.length > 0 ? match.reasons.slice(0, 3) : [match.matchType].filter(Boolean)
    }))
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 3L13 13M13 3L3 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3L5 8L10 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path
        d="M3 7.5L5.5 10L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
      <path d="M3.5 2.2L11.5 7L3.5 11.8V2.2Z" fill="#111827" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 2H2V6M10 2H14V6M14 10V14H10M2 10V14H6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 6H4.5L8 3V13L4.5 10H2V6Z" fill="currentColor" />
      {muted ? (
        <path
          d="M10.5 6L14 9.5M14 6L10.5 9.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M10.3 5.3C11.5 6.5 11.5 9.5 10.3 10.7M12.2 3.8C14.2 6 14.2 10 12.2 12.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  )
}

interface ShortsPanelProps {
  onClose: () => void
}

function ShortsPanel({ onClose }: ShortsPanelProps) {
  const [view, setView] = useState<"feed" | "generating" | "result" | "pending" | "error">("feed")
  const generateStepTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [generateStep, setGenerateStep] = useState(0)
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null)
  const [resultTags, setResultTags] = useState<string[]>(RESULT_TAGS)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [shorts, setShorts] = useState<ReturnType<typeof mapMatchesToShorts>>([])
  const [feedStatus, setFeedStatus] = useState<"loading" | "ready" | "empty" | "error">("loading")
  const [fullscreenId, setFullscreenId] = useState<number | null>(null)
  const [panelSize, setPanelSize] = useState(DEFAULT_PANEL_SIZE)
  const [isResizing, setIsResizing] = useState(false)
  const [pausedIds, setPausedIds] = useState<Set<number>>(new Set())
  const [fullscreenPaused, setFullscreenPaused] = useState(false)
  const [audioState, setAudioState] = useState<Record<number, boolean>>({})
  const [fullscreenMuted, setFullscreenMuted] = useState(false)
  const feedRef = useRef<HTMLDivElement | null>(null)
  const objectUrlsRef = useRef<Set<string>>(new Set())
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const progressFillRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const activeSlideIdRef = useRef<number | null>(null)
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null)
  const fullscreenFillRef = useRef<HTMLDivElement | null>(null)
  const fullscreenStartTimeRef = useRef(0)
  const resizeStateRef = useRef<{
    dir: ResizeDir
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)
  const seekStateRef = useRef<
    | { kind: "feed"; id: number; track: HTMLDivElement }
    | { kind: "fullscreen"; track: HTMLDivElement }
    | null
  >(null)

  useEffect(() => {
    return () => {
      generateStepTimeoutsRef.current.forEach(clearTimeout)
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const resizeState = resizeStateRef.current
      if (resizeState) {
        const dx = resizeState.startX - event.clientX
        const dy = resizeState.startY - event.clientY
        const maxViewportWidth = window.innerWidth - 32
        const maxViewportHeight = window.innerHeight - 120

        if (resizeState.dir === "top") {
          setPanelSize(
            sizeFromHeight(resizeState.startHeight + dy, maxViewportWidth, maxViewportHeight)
          )
        } else {
          setPanelSize(
            sizeFromWidth(resizeState.startWidth + dx, maxViewportWidth, maxViewportHeight)
          )
        }
        return
      }

      const seekState = seekStateRef.current
      if (seekState) {
        if (seekState.kind === "feed") {
          seekTo(
            videoRefs.current.get(seekState.id) ?? null,
            progressFillRefs.current.get(seekState.id) ?? null,
            seekState.track,
            event.clientX
          )
        } else {
          seekTo(fullscreenVideoRef.current, fullscreenFillRef.current, seekState.track, event.clientX)
        }
      }
    }

    const handleMouseUp = () => {
      resizeStateRef.current = null
      seekStateRef.current = null
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const startResize = (dir: ResizeDir) => (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    resizeStateRef.current = {
      dir,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height
    }
    setIsResizing(true)
  }

  const togglePlay = (id: number) => {
    const video = videoRefs.current.get(id)
    if (!video) return
    if (video.paused) {
      video.play()
      setPausedIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      video.pause()
      setPausedIds((prev) => new Set(prev).add(id))
    }
  }

  const handleTimeUpdate = (id: number) => () => {
    const video = videoRefs.current.get(id)
    const fill = progressFillRefs.current.get(id)
    if (!video || !fill || !Number.isFinite(video.duration) || video.duration === 0) return
    fill.style.width = `${(video.currentTime / video.duration) * 100}%`
  }

  const isMuted = (id: number) => audioState[id] ?? false

  // Scroll-triggered autoplay isn't a direct click, so Chrome can occasionally
  // block it with sound. Fall back to a muted play rather than leaving the
  // video frozen if that happens.
  const playVideo = (id: number, video: HTMLVideoElement) => {
    video.play().catch(() => {
      video.muted = true
      setAudioState((prev) => ({ ...prev, [id]: true }))
      video.play().catch(() => {})
    })
  }

  const toggleMute = (id: number) => {
    const video = videoRefs.current.get(id)
    const nextMuted = !isMuted(id)
    if (video) video.muted = nextMuted
    setAudioState((prev) => ({ ...prev, [id]: nextMuted }))
  }

  const toggleFullscreenMute = () => {
    const video = fullscreenVideoRef.current
    const nextMuted = !fullscreenMuted
    if (video) video.muted = nextMuted
    setFullscreenMuted(nextMuted)
  }

  const seekTo = (
    video: HTMLVideoElement | null,
    fill: HTMLDivElement | null,
    track: HTMLDivElement,
    clientX: number
  ) => {
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) return
    const rect = track.getBoundingClientRect()
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    video.currentTime = ratio * video.duration
    if (fill) fill.style.width = `${ratio * 100}%`
  }

  const handleSeekMouseDown = (id: number) => (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const track = event.currentTarget
    seekStateRef.current = { kind: "feed", id, track }
    seekTo(videoRefs.current.get(id) ?? null, progressFillRefs.current.get(id) ?? null, track, event.clientX)
  }

  const setVideoRef = (id: number) => (el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el)
    else videoRefs.current.delete(id)
  }

  const setProgressFillRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) progressFillRefs.current.set(id, el)
    else progressFillRefs.current.delete(id)
  }

  const setSlideRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) slideRefs.current.set(id, el)
    else slideRefs.current.delete(id)
  }

  const getFullscreenGradient = (id: number) =>
    id === RESULT_ID ? RESULT_GRADIENT : shorts.find((item) => item.id === id)?.gradient

  const getFullscreenVideoSrc = (id: number) =>
    id === RESULT_ID ? resultVideoUrl : shorts.find((item) => item.id === id)?.videoUrl

  const getFullscreenTags = (id: number) =>
    id === RESULT_ID ? resultTags : shorts.find((item) => item.id === id)?.tags

  const startGeneration = async () => {
    setView("generating")
    setGenerationError(null)
    setGenerateStep(0)
    generateStepTimeoutsRef.current.forEach(clearTimeout)
    generateStepTimeoutsRef.current = GENERATE_CHECK_ITEMS.map((_, i) =>
      setTimeout(() => setGenerateStep((step) => Math.max(step, i + 1)), CHECKLIST_STEP_MS * (i + 1))
    )

    try {
      let generation = await requestShortsGeneration(window.location.href)
      let attempts = 0
      while (generation.status === "GENERATING" && attempts < GENERATION_MAX_ATTEMPTS) {
        if (attempts === GENERATION_SLOW_ATTEMPTS) {
          // Still processing — switch to the "taking a while" copy but keep
          // polling in the background instead of stopping here.
          setView("pending")
        }
        await new Promise((resolve) => setTimeout(resolve, GENERATION_POLL_MS))
        generation = await fetchShortGenerationStatus(generation.id)
        attempts += 1
      }

      if (generation.status === "GENERATING") {
        // Gave up polling after GENERATION_MAX_ATTEMPTS — it may still finish
        // server-side, but the panel won't find out unless reopened.
        setView("pending")
        return
      }

      if (generation.status !== "COMPLETED" || !generation.seriesId) {
        setGenerationError(generation.errorMessage ?? "쇼츠 생성에 실패했어요. 다시 시도해주세요.")
        setView("error")
        return
      }

      const series = await fetchGeneratedShortSeries(generation.seriesId)
      const first = series.shorts[0]
      if (!first) {
        setGenerationError("생성된 쇼츠를 찾을 수 없어요.")
        setView("error")
        return
      }

      try {
        const objectUrl = await fetchVideoObjectUrl(first.videoFileUrl)
        objectUrlsRef.current.add(objectUrl)
        setResultVideoUrl(objectUrl)
      } catch {
        setResultVideoUrl(first.videoFileUrl)
      }
      setResultTags(first.tags.length > 0 ? first.tags : RESULT_TAGS)
      setView("result")
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "쇼츠 생성에 실패했어요. 다시 시도해주세요.")
      setView("error")
    }
  }

  const closeFullscreen = () => {
    const id = fullscreenId
    const fsVideo = fullscreenVideoRef.current
    if (id !== null && fsVideo) {
      const feedVideo = videoRefs.current.get(id)
      if (feedVideo) {
        feedVideo.currentTime = fsVideo.currentTime
        feedVideo.play()
      }
    }
    setFullscreenId(null)
  }

  const toggleFullscreenPlay = () => {
    const video = fullscreenVideoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setFullscreenPaused(false)
    } else {
      video.pause()
      setFullscreenPaused(true)
    }
  }

  const handleFullscreenTimeUpdate = () => {
    const video = fullscreenVideoRef.current
    const fill = fullscreenFillRef.current
    if (!video || !fill || !Number.isFinite(video.duration) || video.duration === 0) return
    fill.style.width = `${(video.currentTime / video.duration) * 100}%`
  }

  const handleFullscreenSeekMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const track = event.currentTarget
    seekStateRef.current = { kind: "fullscreen", track }
    seekTo(fullscreenVideoRef.current, fullscreenFillRef.current, track, event.clientX)
  }

  // Once the fullscreen video is in the DOM, carry over whatever mute state
  // the user had set in the feed.
  useEffect(() => {
    if (fullscreenId === null) return
    const video = fullscreenVideoRef.current
    if (!video) return
    video.muted = fullscreenMuted
  }, [fullscreenId])

  // Populate the "다른 사람이 만든 쇼츠" feed. duplicates/check's downloadUrl
  // currently points at the backend's own 127.0.0.1 file server (unreachable
  // from outside that machine), so show a known-working real short instead
  // until that's fixed on the backend.
  useEffect(() => {
    let cancelled = false
    setFeedStatus("loading")
    fetchShortById(MOCK_FEED_SHORT_ID)
      .then(async (short) => {
        let videoUrl = short.videoFileUrl
        try {
          const objectUrl = await fetchVideoObjectUrl(short.videoFileUrl)
          objectUrlsRef.current.add(objectUrl)
          videoUrl = objectUrl
        } catch {
          // fall back to the raw URL if the background blob fetch fails
        }
        if (cancelled) return
        setShorts([
          {
            id: 0,
            jobId: short.id,
            videoUrl,
            title: short.title,
            gradient: SHORTS_GRADIENTS[0],
            tags: short.tags.length > 0 ? short.tags.slice(0, 3) : []
          }
        ])
        setFeedStatus("ready")
      })
      .catch(() => {
        if (cancelled) return
        setShorts([])
        setFeedStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Only the slide that's actually snapped into view should play — otherwise
  // every autoplaying video keeps running (and keeps making noise) behind it.
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the single most-in-view slide from this batch of entries
        // rather than reacting to each one independently — with fast
        // scrolling, several entries can cross the 0.6 threshold in the
        // same callback, and acting on all of them let more than one
        // video end up playing at once.
        let bestId: number | null = null
        let bestRatio = 0
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            bestId = Number(entry.target.getAttribute("data-shorts-id"))
          }
        }

        const nextId = bestId ?? activeSlideIdRef.current
        activeSlideIdRef.current = nextId

        // Defensively pause AND mute every video that isn't the active one —
        // not just the previously-tracked one — so no slide can be heard in
        // the background regardless of how it got there. Muting on top of
        // pausing means even a stray play() from a timing race stays silent.
        videoRefs.current.forEach((video, id) => {
          if (id === nextId) return
          if (!video.paused) video.pause()
          video.muted = true
        })

        if (bestId !== null) {
          const video = videoRefs.current.get(bestId)
          if (video) {
            video.muted = isMuted(bestId)
            if (video.paused) playVideo(bestId, video)
          }
          setPausedIds((prev) => {
            if (!prev.has(bestId)) return prev
            const next = new Set(prev)
            next.delete(bestId)
            return next
          })
        }
      },
      { root: feed, threshold: [0, 0.6, 1] }
    )

    slideRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [shorts.length])

  return (
    <>
      <div
        className={isResizing ? "slop-fb-panel slop-fb-resizing" : "slop-fb-panel"}
        style={{
          width: panelSize.width,
          height:
            view === "generating" || view === "pending" || view === "error"
              ? Math.min(GENERATE_VIEW_HEIGHT, panelSize.height)
              : panelSize.height
        }}>
        <div className="slop-fb-resize-edge slop-fb-resize-edge--left" onMouseDown={startResize("left")} />
        <div className="slop-fb-resize-edge slop-fb-resize-edge--top" onMouseDown={startResize("top")} />
        <div className="slop-fb-resize-edge slop-fb-resize-edge--corner" onMouseDown={startResize("corner")} />
        <div className="slop-fb-panel-header">
          <div className="slop-fb-header-left">
            {(view === "pending" || view === "error") && (
              <button
                type="button"
                className="slop-fb-icon-btn"
                onClick={() => setView("feed")}
                aria-label="뒤로 가기">
                <BackIcon />
              </button>
            )}
            <div className="slop-fb-panel-titles">
              <h3 className="slop-fb-panel-title">{HEADER_TEXT[view].title}</h3>
              <p className="slop-fb-panel-subtitle">{HEADER_TEXT[view].subtitle}</p>
            </div>
          </div>
          <button type="button" className="slop-fb-icon-btn" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </div>
        {view === "generating" && (
          <div className="slop-fb-generate-view">
            <div className="slop-fb-generate-spinner" />
            <p className="slop-fb-generate-waiting">잠시만 기다려주세요...</p>
            <p className="slop-fb-generate-title">
              사이트 내용을 분석해서
              <br />
              쇼츠를 만들고 있어요!
            </p>
            <div className="slop-fb-generate-checklist">
              {GENERATE_CHECK_ITEMS.map((label, i) => (
                <div
                  key={label}
                  className={
                    i <= generateStep
                      ? "slop-fb-generate-check-item slop-fb-generate-check-item--active"
                      : "slop-fb-generate-check-item"
                  }>
                  <span
                    className={
                      i < generateStep
                        ? "slop-fb-generate-check-icon slop-fb-generate-check-icon--done"
                        : "slop-fb-generate-check-icon"
                    }>
                    {i < generateStep ? <CheckIcon /> : null}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
        {view === "pending" && (
          <div className="slop-fb-generate-view">
            <div className="slop-fb-generate-spinner" />
            <p className="slop-fb-generate-title">
              생각보다 오래 걸리고 있어요.
              <br />
              완료되면 릴스에서 확인할 수 있어요.
            </p>
          </div>
        )}
        {view === "error" && (
          <div className="slop-fb-generate-view">
            <p className="slop-fb-generate-title">{generationError ?? "쇼츠 생성에 실패했어요."}</p>
          </div>
        )}
        {view === "result" && resultVideoUrl && (
          <div
            className="slop-fb-shorts-slide"
            style={{
              background: RESULT_GRADIENT,
              flex: 1,
              height: "auto",
              minHeight: 0
            }}>
            <video
              ref={setVideoRef(RESULT_ID)}
              className="slop-fb-shorts-video"
              src={resultVideoUrl}
              loop
              playsInline
              autoPlay
              onClick={() => togglePlay(RESULT_ID)}
              onTimeUpdate={handleTimeUpdate(RESULT_ID)}
            />
            <div className="slop-fb-shorts-vignette" />
            {pausedIds.has(RESULT_ID) && (
              <span className="slop-fb-play-btn" onClick={() => togglePlay(RESULT_ID)}>
                <PlayIcon />
              </span>
            )}
            <button
              type="button"
              className="slop-fb-fullscreen-btn"
              onClick={() => {
                const resultVideo = videoRefs.current.get(RESULT_ID)
                fullscreenStartTimeRef.current = resultVideo?.currentTime ?? 0
                resultVideo?.pause()
                setFullscreenId(RESULT_ID)
                setFullscreenPaused(false)
                setFullscreenMuted(isMuted(RESULT_ID))
              }}
              aria-label="전체화면">
              <ExpandIcon />
            </button>
            <div className="slop-fb-slide-overlay">
              <div className="slop-fb-tag-row">
                {RESULT_TAGS.map((tag) => (
                  <span key={tag} className="slop-fb-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="slop-fb-volume-row">
                <button
                  type="button"
                  className="slop-fb-mute-btn"
                  onClick={() => toggleMute(RESULT_ID)}
                  aria-label="음소거">
                  <SpeakerIcon muted={isMuted(RESULT_ID)} />
                </button>
              </div>
              <div className="slop-fb-progress-track" onMouseDown={handleSeekMouseDown(RESULT_ID)}>
                <div className="slop-fb-progress-fill" ref={setProgressFillRef(RESULT_ID)} />
              </div>
            </div>
          </div>
        )}
        {view === "result" && resultVideoUrl && (
          <button
            type="button"
            className="slop-fb-cta-btn slop-fb-cta-btn--secondary"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Slop 쇼츠", url: resultVideoUrl }).catch(() => {})
              } else {
                navigator.clipboard.writeText(resultVideoUrl).catch(() => {})
              }
            }}>
            공유하기
          </button>
        )}
        {view === "pending" && (
          <button
            type="button"
            className="slop-fb-cta-btn slop-fb-cta-btn--secondary"
            onClick={() => setView("feed")}>
            피드로 돌아가기
          </button>
        )}
        {view === "error" && (
          <button type="button" className="slop-fb-cta-btn" onClick={startGeneration}>
            다시 시도
          </button>
        )}
        {view === "feed" && feedStatus === "loading" && (
          <div className="slop-fb-generate-view">
            <div className="slop-fb-generate-spinner" />
            <p className="slop-fb-generate-waiting">비슷한 쇼츠를 찾고 있어요...</p>
          </div>
        )}
        {view === "feed" && (feedStatus === "empty" || feedStatus === "error") && (
          <div className="slop-fb-generate-view">
            <p className="slop-fb-generate-title">
              {feedStatus === "error"
                ? "비슷한 쇼츠를 불러오지 못했어요."
                : "비슷하거나 겹치는 쇼츠가 없어요."}
            </p>
          </div>
        )}
        {view === "feed" && feedStatus === "ready" && (
        <div className="slop-fb-shorts-feed" ref={feedRef}>
          {shorts.map((item) => (
            <div
              key={item.id}
              ref={setSlideRef(item.id)}
              data-shorts-id={item.id}
              className="slop-fb-shorts-slide"
              style={{ background: item.gradient }}>
              <video
                ref={setVideoRef(item.id)}
                className="slop-fb-shorts-video"
                src={item.videoUrl}
                loop
                playsInline
                muted={item.id !== activeSlideIdRef.current ? true : isMuted(item.id)}
                onClick={() => togglePlay(item.id)}
                onTimeUpdate={handleTimeUpdate(item.id)}
              />
              <div className="slop-fb-shorts-vignette" />
              {pausedIds.has(item.id) && (
                <span className="slop-fb-play-btn" onClick={() => togglePlay(item.id)}>
                  <PlayIcon />
                </span>
              )}
              <button
                type="button"
                className="slop-fb-fullscreen-btn"
                onClick={() => {
                  const feedVideo = videoRefs.current.get(item.id)
                  fullscreenStartTimeRef.current = feedVideo?.currentTime ?? 0
                  feedVideo?.pause()
                  setFullscreenId(item.id)
                  setFullscreenPaused(false)
                  setFullscreenMuted(isMuted(item.id))
                }}
                aria-label="전체화면">
                <ExpandIcon />
              </button>
              <div className="slop-fb-slide-overlay">
                <div className="slop-fb-tag-row">
                  {item.tags.map((tag) => (
                    <span key={tag} className="slop-fb-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="slop-fb-volume-row">
                  <button
                    type="button"
                    className="slop-fb-mute-btn"
                    onClick={() => toggleMute(item.id)}
                    aria-label="음소거">
                    <SpeakerIcon muted={isMuted(item.id)} />
                  </button>
                </div>
                <div className="slop-fb-progress-track" onMouseDown={handleSeekMouseDown(item.id)}>
                  <div className="slop-fb-progress-fill" ref={setProgressFillRef(item.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
        {view === "feed" && (
          <button type="button" className="slop-fb-cta-btn" onClick={startGeneration}>
            그래도 만들래요
          </button>
        )}
      </div>
      {fullscreenId !== null && (
        <div className="slop-fb-fullscreen-overlay" onClick={closeFullscreen}>
          <div
            className="slop-fb-fullscreen-card"
            style={{
              background: getFullscreenGradient(fullscreenId)
            }}
            onClick={(e) => e.stopPropagation()}>
            <video
              ref={fullscreenVideoRef}
              className="slop-fb-shorts-video"
              src={getFullscreenVideoSrc(fullscreenId)}
              loop
              playsInline
              autoPlay
              onClick={toggleFullscreenPlay}
              onTimeUpdate={handleFullscreenTimeUpdate}
              onLoadedMetadata={(event) => {
                event.currentTarget.currentTime = fullscreenStartTimeRef.current
              }}
            />
            <div className="slop-fb-shorts-vignette" />
            <button
              type="button"
              className="slop-fb-icon-btn slop-fb-fullscreen-close"
              onClick={closeFullscreen}
              aria-label="닫기">
              <CloseIcon />
            </button>
            {fullscreenPaused && (
              <span className="slop-fb-play-btn slop-fb-play-btn--lg" onClick={toggleFullscreenPlay}>
                <PlayIcon />
              </span>
            )}
            <div className="slop-fb-slide-overlay">
              <div className="slop-fb-tag-row">
                {getFullscreenTags(fullscreenId)?.map((tag) => (
                  <span key={tag} className="slop-fb-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="slop-fb-volume-row">
                <button
                  type="button"
                  className="slop-fb-mute-btn"
                  onClick={toggleFullscreenMute}
                  aria-label="음소거">
                  <SpeakerIcon muted={fullscreenMuted} />
                </button>
              </div>
              <div className="slop-fb-progress-track" onMouseDown={handleFullscreenSeekMouseDown}>
                <div className="slop-fb-progress-fill" ref={fullscreenFillRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ShortsPanel
