import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useRef, useState } from "react"

import PageInterpretButton, {
  PAGE_INTERPRET_BUTTON_STYLE
} from "~components/page-interpret-button"
import { extractArticleParagraphs, waitForArticleParagraphs } from "~lib/chosun-article"

// This feature only knows how to parse this one article's markup (Arc
// "Fusion" JSON embedded in the page) — restrict injection to that URL
// rather than pretending it works site-wide.
export const config: PlasmoCSConfig = {
  matches: [
    "https://biz.chosun.com/policy/policy_sub/2026/07/15/DVUWSZYWNJHTFKDV7DBOZZ5GTE/*"
  ]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    ${PAGE_INTERPRET_BUTTON_STYLE}

    .slop-pi-anchor {
      position: fixed;
      bottom: 24px;
      right: 76px;
      z-index: 2147483647;
    }

    .slop-pi-toast {
      position: fixed;
      bottom: 76px;
      right: 76px;
      z-index: 2147483647;
      max-width: 260px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #111827;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.4;
      box-shadow: 0 8px 20px rgba(17, 24, 39, 0.25);
    }
  `
  return style
}

// Injected into the host page (not the shadow root), so this has to be
// registered separately via a <style> appended to <head>.
const PAGE_STYLE = `
  .slop-pi-original {
    color: #9ca3af !important;
  }

  .slop-pi-rewrite {
    margin: 0 0 1em;
    color: #000000;
    font-size: 1em;
    line-height: 1.6;
  }
`

function ensurePageStyleInjected() {
  if (document.getElementById("slop-pi-page-style")) return
  const style = document.createElement("style")
  style.id = "slop-pi-page-style"
  style.textContent = PAGE_STYLE
  document.head.appendChild(style)
}

function PageInterpretFeature() {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const grayedElementsRef = useRef<HTMLElement[]>([])
  const insertedElementsRef = useRef<HTMLElement[]>([])

  const cleanup = () => {
    insertedElementsRef.current.forEach((el) => el.remove())
    insertedElementsRef.current = []
    grayedElementsRef.current.forEach((el) => el.classList.remove("slop-pi-original"))
    grayedElementsRef.current = []
  }

  useEffect(() => cleanup, [])

  const handleClick = async () => {
    setErrorMessage(null)

    if (active) {
      cleanup()
      setActive(false)
      return
    }

    setLoading(true)
    try {
      ensurePageStyleInjected()

      const paragraphs = extractArticleParagraphs()
      if (paragraphs.length === 0) {
        throw new Error("이 페이지에서 문단을 찾을 수 없어요")
      }

      const elements = await waitForArticleParagraphs(paragraphs)
      const matchedIndexes: number[] = []
      const matchedTexts: string[] = []
      elements.forEach((el, index) => {
        if (!el) return
        matchedIndexes.push(index)
        matchedTexts.push(paragraphs[index])
      })

      if (matchedTexts.length === 0) {
        throw new Error("페이지 구조를 인식하지 못했어요")
      }

      const response = await chrome.runtime.sendMessage({
        type: "SLOP_INTERPRET_PARAGRAPHS",
        paragraphs: matchedTexts
      })

      if (!response?.ok) {
        throw new Error(response?.error || "해석 요청이 실패했어요")
      }

      const rewrites: string[] = response.paragraphs

      matchedIndexes.forEach((originalIndex, i) => {
        const el = elements[originalIndex]
        if (!el) return

        el.classList.add("slop-pi-original")
        grayedElementsRef.current.push(el)

        const rewriteEl = document.createElement(el.tagName === "P" ? "p" : "div")
        rewriteEl.className = "slop-pi-rewrite"
        rewriteEl.textContent = rewrites[i] ?? ""
        el.insertAdjacentElement("afterend", rewriteEl)
        insertedElementsRef.current.push(rewriteEl)
      })

      setActive(true)
    } catch (error) {
      cleanup()
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageInterpretButton
        ref={buttonRef}
        label={active ? "원문 보기" : "페이지 해석"}
        className="slop-pi-anchor"
        active={active}
        loading={loading}
        onClick={handleClick}
        title={errorMessage ?? (active ? "원문으로 되돌리기" : "이 문단을 쉽게 풀어써요")}
      />
      {errorMessage && <div className="slop-pi-toast">{errorMessage}</div>}
    </>
  )
}

export default PageInterpretFeature
