import { forwardRef } from "react"

export const PAGE_INTERPRET_BUTTON_STYLE = `
  .slop-pi-btn {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px;
    border: none;
    border-radius: 9999px;
    background: #ffffff;
    color: #0b1220;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    box-shadow: 0 8px 20px rgba(17, 24, 39, 0.18);
    transition: padding 0.28s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.15s ease, color 0.15s ease;
  }

  .slop-pi-btn:hover {
    padding: 12px 18px;
    background: #f0f1f3;
  }

  .slop-pi-btn--active {
    background: #0b1220;
    color: #70eaff;
  }

  .slop-pi-btn--active:hover {
    background: #182238;
  }

  .slop-pi-btn:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  .slop-pi-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .slop-pi-icon--spin {
    animation: slop-pi-spin 0.9s linear infinite;
  }

  @keyframes slop-pi-spin {
    to { transform: rotate(360deg); }
  }

  .slop-pi-label {
    display: inline-block;
    max-width: 0;
    margin-left: 0;
    opacity: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: max-width 0.28s cubic-bezier(0.32, 0.72, 0, 1), margin-left 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease;
  }

  .slop-pi-btn:hover .slop-pi-label {
    max-width: 120px;
    margin-left: 8px;
    opacity: 1;
  }
`

function DocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 2H9.5L12.5 5V13.5C12.5 13.7761 12.2761 14 12 14H4C3.72386 14 3.5 13.7761 3.5 13.5V2.5C3.5 2.22386 3.72386 2 4 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M5.5 8H10.5M5.5 10.5H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.2"
      />
      <path
        d="M14 8C14 4.68629 11.3137 2 8 2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface PageInterpretButtonProps {
  label: string
  className?: string
  onClick?: () => void
  active?: boolean
  loading?: boolean
  title?: string
}

const PageInterpretButton = forwardRef<HTMLButtonElement, PageInterpretButtonProps>(
  ({ label, className, onClick, active, loading, title }, ref) => {
    const classes = ["slop-pi-btn"]
    if (active) classes.push("slop-pi-btn--active")
    if (className) classes.push(className)

    return (
      <button
        ref={ref}
        type="button"
        className={classes.join(" ")}
        onClick={onClick}
        disabled={loading}
        title={title}>
        <span className={loading ? "slop-pi-icon slop-pi-icon--spin" : "slop-pi-icon"}>
          {loading ? <SpinnerIcon /> : <DocIcon />}
        </span>
        <span className="slop-pi-label">{label}</span>
      </button>
    )
  }
)

export default PageInterpretButton
