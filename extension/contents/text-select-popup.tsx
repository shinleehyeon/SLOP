import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import LoginGate, { LOGIN_GATE_STYLE } from "~components/login-gate"
import ShortsButton, { SHORTS_BUTTON_STYLE } from "~components/shorts-button"
import ShortsPanel, { SHORTS_PANEL_STYLE } from "~components/shorts-panel"
import { getStoredTokens } from "~lib/auth"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_end"
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    ${LOGIN_GATE_STYLE}
    ${SHORTS_BUTTON_STYLE}
    ${SHORTS_PANEL_STYLE}

    .slop-tsp-trigger {
      position: fixed;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid #eceff1;
      border-radius: 9999px;
      background: #ffffff;
      color: #374151;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 6px 16px rgba(17, 24, 39, 0.12);
      cursor: pointer;
      animation: slop-tsp-pop 0.12s ease-out;
    }

    .slop-tsp-trigger:hover {
      background: #f9fafb;
    }

    .slop-tsp-card {
      position: fixed;
      z-index: 2147483647;
      width: 380px;
      max-width: calc(100vw - 32px);
      background: #ffffff;
      border: 1px solid #eceff1;
      border-radius: 20px;
      box-shadow: 0 16px 40px rgba(17, 24, 39, 0.18);
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      animation: slop-tsp-pop 0.14s ease-out;
      box-sizing: border-box;
      overflow: hidden;
    }

    .slop-tsp-card-header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }

    .slop-tsp-card-header.slop-tsp-result {
      justify-content: space-between;
    }

    .slop-tsp-icon-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f5f6f7;
      border-radius: 9999px;
      padding: 6px;
    }

    .slop-tsp-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 9999px;
      background: transparent;
      color: #4b5563;
      cursor: pointer;
    }

    .slop-tsp-icon-btn:hover {
      background: #e9ebee;
    }

    .slop-tsp-icon-btn--active {
      background: #dff8ff;
      color: #0891b2;
    }

    .slop-tsp-icon-btn--active:hover {
      background: #cdf3ff;
    }

    .slop-tsp-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .slop-tsp-close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 9999px;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      flex-shrink: 0;
    }

    .slop-tsp-close-btn:hover {
      background: #f3f4f6;
      color: #4b5563;
    }

    .slop-tsp-skeleton-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slop-tsp-skeleton-line {
      height: 14px;
      border-radius: 7px;
      background: linear-gradient(90deg, #f0f1f3 25%, #e6e8eb 37%, #f0f1f3 63%);
      background-size: 400% 100%;
      animation: slop-tsp-shimmer 1.4s ease-in-out infinite;
    }

    .slop-tsp-result-text {
      margin: 0;
      color: #111827;
      font-size: 15px;
      line-height: 1.6;
      word-break: keep-all;
    }

    .slop-tsp-action-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
    }

    .slop-tsp-action-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 7px 12px;
      border: none;
      border-radius: 9999px;
      background: #f5f6f7;
      color: #4b5563;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }

    .slop-tsp-action-btn:hover {
      background: #e9ebee;
      color: #111827;
    }

    @keyframes slop-tsp-shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    @keyframes slop-tsp-pop {
      from { opacity: 0; transform: translateY(4px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .slop-tsp-content-fade {
      animation: slop-tsp-content-fade 0.26s ease 40ms both;
    }

    @keyframes slop-tsp-content-fade {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `
  return style
}

const MOCK_RESULT_TEXT =
  "ios 12 버전으로 업데이트 되면서 단축어 (숏컷) 앱이 새로 생겼다. 인터넷에서 떠도는 정보들을 모아 필요한 기능을 등록 시켜 사용해보려"

const SKELETON_WIDTHS = ["92%", "68%", "80%", "45%"]

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 3.5H14M2 8H14M2 12.5H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="6" y="6" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 6V3.5C10 2.67 9.33 2 8.5 2H3.5C2.67 2 2 2.67 2 3.5V8.5C2 9.33 2.67 10 3.5 10H6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ThumbsUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M5 14H3.5C2.67 14 2 13.33 2 12.5V8.5C2 7.67 2.67 7 3.5 7H5V14Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 14H11.7C12.4 14 13 13.47 13.09 12.77L13.85 6.77C13.96 5.9 13.28 5.14 12.4 5.14H9.5L9.9 2.86C10.02 2.2 9.53 1.6 8.87 1.55C8.42 1.52 8 1.78 7.82 2.19L5 8V14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ThumbsDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: "rotate(180deg)" }}>
      <path
        d="M5 14H3.5C2.67 14 2 13.33 2 12.5V8.5C2 7.67 2.67 7 3.5 7H5V14Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 14H11.7C12.4 14 13 13.47 13.09 12.77L13.85 6.77C13.96 5.9 13.28 5.14 12.4 5.14H9.5L9.9 2.86C10.02 2.2 9.53 1.6 8.87 1.55C8.42 1.52 8 1.78 7.82 2.19L5 8V14Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CornerDownRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <polyline
        points="15 10 20 15 15 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4v7a4 4 0 0 0 4 4h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 3L13 13M13 3L3 13"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

type Phase = "hidden" | "trigger" | "loading" | "result"

function clampPosition(x: number, y: number, width: number, height: number) {
  const margin = 12
  const maxX = window.innerWidth - width - margin
  const maxY = window.innerHeight - height - margin
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, maxX)),
    y: Math.min(Math.max(margin, y), Math.max(margin, maxY))
  }
}

function TextSelectPopup() {
  const [phase, setPhase] = useState<Phase>("hidden")
  const [point, setPoint] = useState({ x: 0, y: 0 })
  const [showGate, setShowGate] = useState(false)
  const [showShortsPanel, setShowShortsPanel] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const prevCardSizeRef = useRef<{ width: number } | null>(null)
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes.slopAccessToken?.newValue) {
        setShowGate(false)
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  // FLIP the card's width across the loading -> result content swap so it
  // grows into place instead of snapping to the new content's natural size.
  // Height stays auto so it always fits the current content.
  useLayoutEffect(() => {
    const card = cardRef.current

    if (!card || (phase !== "loading" && phase !== "result")) {
      prevCardSizeRef.current = null
      return
    }

    const nextSize = { width: card.offsetWidth }
    const prevSize = prevCardSizeRef.current

    if (prevSize) {
      card.style.transition = "none"
      card.style.width = `${prevSize.width}px`
      // Force layout so the browser commits the "from" size before we flip
      // the target size below, otherwise both writes collapse into one.
      void card.offsetHeight
      card.style.transition = "width 280ms cubic-bezier(0.32, 0.72, 0, 1)"
    } else {
      card.style.transition = "none"
    }

    card.style.width = `${nextSize.width}px`
    prevCardSizeRef.current = nextSize
  }, [phase])

  useEffect(() => {
    // Our UI renders inside a shadow root (Plasmo CSUI). Events that
    // originate there get retargeted to the shadow host before they reach
    // a document-level listener, so `event.target` is useless for an
    // "is this click inside my popup" check — composedPath() still has
    // the real, un-retargeted node.
    const isInsideContainer = (event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return false
      return event.composedPath().includes(container)
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (isInsideContainer(event)) return

      const selection = window.getSelection()
      const text = selection?.toString().trim() ?? ""

      if (text.length > 0) {
        setPoint({ x: event.clientX + 8, y: event.clientY - 44 })
        setPhase("trigger")
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (isInsideContainer(event)) return
      setPhase((prev) => (prev === "trigger" ? "hidden" : prev))
    }

    // Capture phase so we read the selection / catch the click before a
    // host page's own mouseup handlers can stopPropagation() it or clear
    // the selection first (common on article sites with their own
    // highlight/share widgets).
    document.addEventListener("mouseup", handleMouseUp, true)
    document.addEventListener("mousedown", handleMouseDown, true)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp, true)
      document.removeEventListener("mousedown", handleMouseDown, true)
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const handleTriggerClick = async () => {
    const tokens = await getStoredTokens()
    if (!tokens) {
      setPhase("hidden")
      setShowGate(true)
      return
    }
    setPhase("loading")
    loadingTimeoutRef.current = setTimeout(() => {
      setPhase("result")
    }, 1400)
  }

  const handleRegenerate = () => {
    setPhase("loading")
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
    loadingTimeoutRef.current = setTimeout(() => {
      setPhase("result")
    }, 1400)
  }

  const handleClose = () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
    window.getSelection()?.removeAllRanges()
    setPhase("hidden")
  }

  const handleShortsClick = async () => {
    const tokens = await getStoredTokens()
    if (!tokens) {
      setShowGate(true)
      return
    }
    setShowShortsPanel(true)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_RESULT_TEXT)
    } catch {
      // clipboard access can be blocked on some pages; nothing more to do
    }
    setCopied(true)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500)
  }

  const toggleFeedback = (value: "up" | "down") => {
    setFeedback((prev) => (prev === value ? null : value))
  }

  const triggerPos = clampPosition(point.x, point.y, 110, 40)
  const cardPos = clampPosition(point.x, point.y, 380, 260)

  return (
    <>
      {phase === "trigger" && (
        <div ref={containerRef}>
          <button
            type="button"
            className="slop-tsp-trigger"
            style={{ left: triggerPos.x, top: triggerPos.y }}
            onClick={handleTriggerClick}>
            <ListIcon />
            설명
          </button>
        </div>
      )}

      {(phase === "loading" || phase === "result") && (
        <div ref={containerRef}>
          <div ref={cardRef} className="slop-tsp-card" style={{ left: cardPos.x, top: cardPos.y }}>
            {phase === "loading" && (
              <div className="slop-tsp-content-fade">
                <div className="slop-tsp-card-header">
                  <ShortsButton label="Shorts로 만들기" onClick={handleShortsClick} />
                </div>
                <div className="slop-tsp-skeleton-wrap">
                  {SKELETON_WIDTHS.map((width, i) => (
                    <div
                      key={i}
                      className="slop-tsp-skeleton-line"
                      style={{ width, animationDelay: `${i * 0.08}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {phase === "result" && (
              <div className="slop-tsp-content-fade">
                <div className="slop-tsp-card-header slop-tsp-result">
                  <div className="slop-tsp-icon-group">
                    <button
                      type="button"
                      className="slop-tsp-icon-btn"
                      onClick={handleCopy}
                      title="복사">
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button
                      type="button"
                      className={
                        feedback === "up"
                          ? "slop-tsp-icon-btn slop-tsp-icon-btn--active"
                          : "slop-tsp-icon-btn"
                      }
                      onClick={() => toggleFeedback("up")}
                      title="좋아요">
                      <ThumbsUpIcon />
                    </button>
                    <button
                      type="button"
                      className={
                        feedback === "down"
                          ? "slop-tsp-icon-btn slop-tsp-icon-btn--active"
                          : "slop-tsp-icon-btn"
                      }
                      onClick={() => toggleFeedback("down")}
                      title="싫어요">
                      <ThumbsDownIcon />
                    </button>
                  </div>
                  <div className="slop-tsp-right">
                    <ShortsButton label="Shorts로 만들기" onClick={handleShortsClick} />
                    <button
                      type="button"
                      className="slop-tsp-close-btn"
                      onClick={handleClose}
                      title="닫기">
                      <CloseIcon />
                    </button>
                  </div>
                </div>
                <p className="slop-tsp-result-text">{MOCK_RESULT_TEXT}</p>
                <div className="slop-tsp-action-row">
                  <button
                    type="button"
                    className="slop-tsp-action-btn"
                    onClick={handleRegenerate}>
                    <CornerDownRightIcon />
                    더 쉽게
                  </button>
                  <button
                    type="button"
                    className="slop-tsp-action-btn"
                    onClick={handleRegenerate}>
                    <CornerDownRightIcon />
                    더 자세하게
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showShortsPanel && (
        <ShortsPanel onClose={() => setShowShortsPanel(false)} />
      )}
      {showGate && (
        <LoginGate source="extension" onClose={() => setShowGate(false)} />
      )}
    </>
  )
}

export default TextSelectPopup
