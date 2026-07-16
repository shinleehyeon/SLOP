import { useEffect } from "react"

// Host pages sometimes inject their own fixed-position overlays (chat
// widgets, cookie banners) after our content script mounts, using the same
// max z-index. z-index ties are broken by DOM order, so whichever element
// was appended to <body> last wins — this keeps our shadow host last.
export function useKeepOnTop(ref: React.RefObject<Element | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const root = el.getRootNode()
    const host = root instanceof ShadowRoot ? root.host : null
    const parent = host?.parentElement
    if (!host || !parent) return

    const keepOnTop = () => {
      if (parent.lastElementChild !== host) {
        parent.appendChild(host)
      }
    }

    const observer = new MutationObserver(keepOnTop)
    observer.observe(parent, { childList: true })
    keepOnTop()

    return () => observer.disconnect()
  }, [ref])
}
