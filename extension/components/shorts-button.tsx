import { forwardRef } from "react"

export const SHORTS_BUTTON_STYLE = `
  .slop-shorts-btn {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: none;
    border-radius: 9999px;
    background: #70eaff;
    color: #0b1220;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background-color 0.15s ease;
  }

  .slop-shorts-btn::before {
    content: "";
    position: absolute;
    inset: -6px;
    z-index: -1;
    border-radius: inherit;
    background: rgba(112, 234, 255, 0.35);
  }

  .slop-shorts-btn:hover {
    background: #4de0fa;
  }

  .slop-shorts-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slop-shorts-btn--collapsible {
    gap: 0;
    padding: 12px;
    transition: padding 0.28s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.15s ease;
  }

  .slop-shorts-btn--collapsible:hover {
    padding: 12px 18px;
  }

  .slop-shorts-btn--collapsible .slop-shorts-label {
    display: inline-block;
    max-width: 0;
    margin-left: 0;
    opacity: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: max-width 0.28s cubic-bezier(0.32, 0.72, 0, 1), margin-left 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease;
  }

  .slop-shorts-btn--collapsible:hover .slop-shorts-label {
    max-width: 140px;
    margin-left: 8px;
    opacity: 1;
  }
`

function ShortsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 8 8" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.666687 3.99996C0.666687 3.81586 0.815927 3.66663 1.00002 3.66663H4.00002C4.18412 3.66663 4.33335 3.81586 4.33335 3.99996C4.33335 4.18406 4.18412 4.33329 4.00002 4.33329H1.00002C0.815927 4.33329 0.666687 4.18406 0.666687 3.99996Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.666687 1.99996C0.666687 1.81587 0.815927 1.66663 1.00002 1.66663H5.33335C5.51745 1.66663 5.66669 1.81587 5.66669 1.99996C5.66669 2.18405 5.51745 2.33329 5.33335 2.33329H1.00002C0.815927 2.33329 0.666687 2.18405 0.666687 1.99996Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.666687 5.99996C0.666687 5.81586 0.815927 5.66663 1.00002 5.66663H4.00002C4.18412 5.66663 4.33335 5.81586 4.33335 5.99996C4.33335 6.18406 4.18412 6.33329 4.00002 6.33329H1.00002C0.815927 6.33329 0.666687 6.18406 0.666687 5.99996Z"
        fill="black"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.1691 3.7099C5.2736 3.65073 5.40187 3.65233 5.50483 3.71413L7.1715 4.71413C7.2719 4.77436 7.33333 4.88286 7.33333 4.99996C7.33333 5.11706 7.2719 5.22556 7.1715 5.2858L5.50483 6.2858C5.40187 6.3476 5.2736 6.3492 5.1691 6.29003C5.0646 6.23086 5 6.12006 5 5.99996V3.99996C5 3.87986 5.0646 3.76906 5.1691 3.7099ZM5.66667 4.5887V5.41123L6.3521 4.99996L5.66667 4.5887Z"
        fill="black"
      />
    </svg>
  )
}

interface ShortsButtonProps {
  label: string
  className?: string
  onClick?: () => void
  title?: string
  collapsible?: boolean
}

const ShortsButton = forwardRef<HTMLButtonElement, ShortsButtonProps>(
  ({ label, className, onClick, title, collapsible }, ref) => {
    const classes = ["slop-shorts-btn"]
    if (collapsible) classes.push("slop-shorts-btn--collapsible")
    if (className) classes.push(className)

    return (
      <button ref={ref} type="button" className={classes.join(" ")} onClick={onClick} title={title}>
        <span className="slop-shorts-icon">
          <ShortsIcon />
        </span>
        <span className="slop-shorts-label">{label}</span>
      </button>
    )
  }
)

export default ShortsButton
