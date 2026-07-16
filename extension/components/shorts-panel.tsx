import { useEffect, useRef, useState } from "react"

const GENERATE_DURATION_MS = 5000

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

  .slop-fb-template-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .slop-fb-template-card {
    position: relative;
    border: none;
    border-radius: 16px;
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
    padding: 12px;
    box-sizing: border-box;
    outline: 3px solid transparent;
    outline-offset: -3px;
    transition: outline-color 0.15s ease;
  }

  .slop-fb-template-card--active {
    outline-color: #70eaff;
  }

  .slop-fb-template-label {
    color: #ffffff;
    font-weight: 800;
    font-size: 14px;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
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

  .slop-fb-generate-icon-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }

  .slop-fb-generate-icon-ring {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: conic-gradient(#70eaff 0deg, #e5e7eb 0deg);
    animation: slop-fb-generate-ring ${GENERATE_DURATION_MS}ms linear forwards;
  }

  .slop-fb-generate-icon-core {
    position: absolute;
    inset: 5px;
    border-radius: 9999px;
    background: linear-gradient(160deg, #70eaff, #4d8dfa);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }

  @keyframes slop-fb-generate-ring {
    to { background: conic-gradient(#70eaff 360deg, #e5e7eb 360deg); }
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

const SHORTS_TAGS = [
  ["#쇼츠", "#추천"],
  ["#트렌드", "#일상"],
  ["#챌린지", "#밈"],
  ["#꿀팁", "#정보"],
  ["#리뷰", "#후기"]
]

const MAX_SHORTS = 30

const TEMPLATES = [
  { id: "simple", label: "심플", gradient: "linear-gradient(160deg, #a5d8ff, #91a7ff)" },
  { id: "dynamic", label: "다이나믹", gradient: "linear-gradient(160deg, #ffd6a5, #fca5a5)" }
]

const MOCK_VIDEO_URL = chrome.runtime.getURL("assets/mock-shorts.mp4")

const MOCK_SUMMARY_TEXT =
  "이 페이지는 iOS 12 업데이트로 새로 생긴 단축어(숏컷) 앱을 소개하고 있어요. 인터넷에 떠도는 여러 정보들을 모아서, 필요한 기능을 등록해두면 반복 작업을 훨씬 빠르게 처리할 수 있다는 내용을 담고 있어요. 지금 이 요약을 바탕으로 쇼츠를 만들고 있어요, 잠시만 기다려주세요."

const GENERATE_CHECK_ITEMS = ["사이트 분석 중", "핵심 내용 요약 중", "쇼츠 영상 생성 중"]

const HEADER_TEXT = {
  feed: { title: "이건 어떠신가요?", subtitle: "다른 사람이 만든 쇼츠가 있어요" },
  templates: { title: "템플릿을 선택해주세요", subtitle: "원하는 스타일을 골라주세요" },
  generating: { title: "만드는 중이에요", subtitle: "사이트 내용을 요약하고 있어요" },
  result: { title: "완성됐어요!", subtitle: "만들어진 쇼츠를 확인해보세요" }
} as const

// Shorts/Reels-style vertical video ratio (width:height = 9:16).
const SHORTS_RATIO = 9 / 16

const MIN_PANEL_WIDTH = 240
const MAX_PANEL_WIDTH = 480
const MIN_PANEL_HEIGHT = MIN_PANEL_WIDTH / SHORTS_RATIO
const MAX_PANEL_HEIGHT = MAX_PANEL_WIDTH / SHORTS_RATIO
const DEFAULT_PANEL_SIZE = { width: 360, height: 360 / SHORTS_RATIO }
const TEMPLATE_VIEW_HEIGHT = 340

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

function createShortsBatch(startId: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    gradient: SHORTS_GRADIENTS[(startId + i) % SHORTS_GRADIENTS.length],
    tags: SHORTS_TAGS[(startId + i) % SHORTS_TAGS.length]
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
  const [view, setView] = useState<"feed" | "templates" | "generating" | "result">("feed")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [resultPaused, setResultPaused] = useState(false)
  const resultVideoRef = useRef<HTMLVideoElement | null>(null)
  const generateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generateStepTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [generateStep, setGenerateStep] = useState(0)
  const [shorts, setShorts] = useState(() => createShortsBatch(0, 5))
  const [fullscreenId, setFullscreenId] = useState<number | null>(null)
  const [panelSize, setPanelSize] = useState(DEFAULT_PANEL_SIZE)
  const [isResizing, setIsResizing] = useState(false)
  const [pausedIds, setPausedIds] = useState<Set<number>>(new Set())
  const [fullscreenPaused, setFullscreenPaused] = useState(false)
  const [audioState, setAudioState] = useState<Record<number, boolean>>({})
  const [fullscreenMuted, setFullscreenMuted] = useState(false)
  const feedRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
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
      if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current)
      generateStepTimeoutsRef.current.forEach(clearTimeout)
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

  useEffect(() => {
    const feed = feedRef.current
    const sentinel = sentinelRef.current
    if (!feed || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShorts((prev) =>
            prev.length >= MAX_SHORTS ? prev : [...prev, ...createShortsBatch(prev.length, 5)]
          )
        }
      },
      { root: feed, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Only the slide that's actually snapped into view should play — otherwise
  // every autoplaying video keeps running (and keeps making noise) behind it.
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue
          const id = Number(entry.target.getAttribute("data-shorts-id"))
          if (activeSlideIdRef.current === id) continue

          const prevId = activeSlideIdRef.current
          activeSlideIdRef.current = id
          if (prevId !== null) videoRefs.current.get(prevId)?.pause()

          const video = videoRefs.current.get(id)
          if (video) playVideo(id, video)
          setPausedIds((prev) => {
            if (!prev.has(id)) return prev
            const next = new Set(prev)
            next.delete(id)
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
            view === "templates" || view === "generating"
              ? Math.min(TEMPLATE_VIEW_HEIGHT, panelSize.height)
              : panelSize.height
        }}>
        <div className="slop-fb-resize-edge slop-fb-resize-edge--left" onMouseDown={startResize("left")} />
        <div className="slop-fb-resize-edge slop-fb-resize-edge--top" onMouseDown={startResize("top")} />
        <div className="slop-fb-resize-edge slop-fb-resize-edge--corner" onMouseDown={startResize("corner")} />
        <div className="slop-fb-panel-header">
          <div className="slop-fb-header-left">
            {view === "templates" && (
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
        {view === "templates" && (
          <div className="slop-fb-template-grid">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                className={
                  selectedTemplate === template.id
                    ? "slop-fb-template-card slop-fb-template-card--active"
                    : "slop-fb-template-card"
                }
                onClick={() => setSelectedTemplate(template.id)}
                style={{ background: template.gradient }}>
                <span className="slop-fb-template-label">{template.label}</span>
              </button>
            ))}
          </div>
        )}
        {view === "generating" && (
          <div className="slop-fb-generate-view">
            <div className="slop-fb-generate-icon-wrap">
              <div className="slop-fb-generate-icon-ring" />
              <div className="slop-fb-generate-icon-core">
                <ExpandIcon />
              </div>
            </div>
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
        {view === "result" && (
          <div
            className="slop-fb-shorts-slide"
            style={{
              background: TEMPLATES.find((t) => t.id === selectedTemplate)?.gradient,
              flex: 1,
              height: "auto",
              minHeight: 0
            }}>
            <video
              ref={resultVideoRef}
              className="slop-fb-shorts-video"
              src={MOCK_VIDEO_URL}
              loop
              playsInline
              autoPlay
              onClick={() => {
                const video = resultVideoRef.current
                if (!video) return
                if (video.paused) {
                  video.play()
                  setResultPaused(false)
                } else {
                  video.pause()
                  setResultPaused(true)
                }
              }}
            />
            <div className="slop-fb-shorts-vignette" />
            {resultPaused && (
              <span className="slop-fb-play-btn">
                <PlayIcon />
              </span>
            )}
          </div>
        )}
        {view === "feed" && (
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
                src={MOCK_VIDEO_URL}
                loop
                playsInline
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
          <div ref={sentinelRef} className="slop-fb-sentinel" />
        </div>
        )}
        {(view === "feed" || view === "templates") && (
          <button
            type="button"
            className="slop-fb-cta-btn"
            disabled={view === "templates" && !selectedTemplate}
            onClick={() => {
              if (view === "feed") {
                setView("templates")
                return
              }
              setView("generating")
              setGenerateStep(0)
              const stepDuration = GENERATE_DURATION_MS / GENERATE_CHECK_ITEMS.length
              generateStepTimeoutsRef.current = GENERATE_CHECK_ITEMS.map((_, i) =>
                setTimeout(() => setGenerateStep(i + 1), stepDuration * (i + 1))
              )
              generateTimeoutRef.current = setTimeout(() => {
                setView("result")
              }, GENERATE_DURATION_MS)
            }}>
            {view === "feed" ? "그래도 만들래요" : "이 템플릿으로 만들기"}
          </button>
        )}
      </div>
      {fullscreenId !== null && (
        <div className="slop-fb-fullscreen-overlay" onClick={closeFullscreen}>
          <div
            className="slop-fb-fullscreen-card"
            style={{
              background: shorts.find((item) => item.id === fullscreenId)?.gradient
            }}
            onClick={(e) => e.stopPropagation()}>
            <video
              ref={fullscreenVideoRef}
              className="slop-fb-shorts-video"
              src={MOCK_VIDEO_URL}
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
                {shorts
                  .find((item) => item.id === fullscreenId)
                  ?.tags.map((tag) => (
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
