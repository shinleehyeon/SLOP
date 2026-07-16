import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useRef, useState } from "react"

import LoginGate, { LOGIN_GATE_STYLE } from "~components/login-gate"
import ShortsButton, { SHORTS_BUTTON_STYLE } from "~components/shorts-button"
import { getStoredTokens } from "~lib/auth"
import { useKeepOnTop } from "~lib/keep-on-top"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    ${LOGIN_GATE_STYLE}
    ${SHORTS_BUTTON_STYLE}

    .slop-floating-anchor {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
    }

    .slop-fb-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      min-width: 320px;
      min-height: 240px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 140px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 16px 40px rgba(17, 24, 39, 0.18);
      padding: 16px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transform-origin: bottom right;
      animation: slop-fb-panel-pop 0.22s cubic-bezier(0.32, 0.72, 0, 1);
    }

    @keyframes slop-fb-panel-pop {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .slop-fb-panel-header {
      display: flex;
      justify-content: flex-end;
      flex-shrink: 0;
      margin-bottom: 12px;
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

    .slop-fb-panel-content {
      flex: 1;
    }
  `
  return style
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

function FloatingButton() {
  const [showGate, setShowGate] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useKeepOnTop(buttonRef)

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

  const handleClick = async () => {
    const tokens = await getStoredTokens()
    if (!tokens) {
      setShowGate(true)
      return
    }
    setShowPanel((prev) => !prev)
  }

  return (
    <>
      <ShortsButton
        ref={buttonRef}
        label="Shorts로 보기"
        className="slop-floating-anchor"
        collapsible
        onClick={handleClick}
      />
      {showPanel && (
        <div className="slop-fb-panel">
          <div className="slop-fb-panel-header">
            <button
              type="button"
              className="slop-fb-icon-btn"
              onClick={() => setShowPanel(false)}
              aria-label="닫기">
              <CloseIcon />
            </button>
          </div>
          <div className="slop-fb-panel-content" />
        </div>
      )}
      {showGate && (
        <LoginGate source="extension" onClose={() => setShowGate(false)} />
      )}
    </>
  )
}

export default FloatingButton
