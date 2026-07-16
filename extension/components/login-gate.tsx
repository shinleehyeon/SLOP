import { WEB_BASE_URL } from "~lib/config"

export const LOGIN_GATE_STYLE = `
  .slop-gate-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: rgba(17, 24, 39, 0.32);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slop-gate-card {
    width: 380px;
    max-width: calc(100vw - 32px);
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 16px 40px rgba(17, 24, 39, 0.18);
    padding: 20px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .slop-gate-header {
    display: flex;
    justify-content: flex-end;
  }

  .slop-gate-close-btn {
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
  }

  .slop-gate-close-btn:hover {
    background: #f3f4f6;
    color: #4b5563;
  }

  .slop-gate-spacer {
    height: 96px;
  }

  .slop-gate-login-btn {
    display: block;
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 9999px;
    background: #70eaff;
    color: #0b1220;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
  }

  .slop-gate-login-btn:hover {
    background: #4de0fa;
  }
`

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 3L13 13M13 3L3 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface LoginGateProps {
  source: "extension"
  onClose: () => void
}

function LoginGate({ source, onClose }: LoginGateProps) {
  const handleLogin = () => {
    window.open(`${WEB_BASE_URL}/login?source=${source}`, "_blank")
  }

  return (
    <div className="slop-gate-backdrop" onClick={onClose}>
      <div className="slop-gate-card" onClick={(e) => e.stopPropagation()}>
        <div className="slop-gate-header">
          <button
            type="button"
            className="slop-gate-close-btn"
            onClick={onClose}
            aria-label="닫기">
            <CloseIcon />
          </button>
        </div>
        <div className="slop-gate-spacer" />
        <button type="button" className="slop-gate-login-btn" onClick={handleLogin}>
          로그인하여 시작하기
        </button>
      </div>
    </div>
  )
}

export default LoginGate
