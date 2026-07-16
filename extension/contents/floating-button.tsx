import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useRef, useState } from "react"

import LoginGate, { LOGIN_GATE_STYLE } from "~components/login-gate"
import ShortsButton, { SHORTS_BUTTON_STYLE } from "~components/shorts-button"
import ShortsPanel, { SHORTS_PANEL_STYLE } from "~components/shorts-panel"
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
    ${SHORTS_PANEL_STYLE}

    .slop-floating-anchor {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
    }
  `
  return style
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
      {showPanel && <ShortsPanel onClose={() => setShowPanel(false)} />}
      {showGate && (
        <LoginGate source="extension" onClose={() => setShowGate(false)} />
      )}
    </>
  )
}

export default FloatingButton
