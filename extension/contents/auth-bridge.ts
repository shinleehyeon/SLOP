import type { PlasmoCSConfig } from "plasmo"

// TODO: replace with the real production web domain once deployed.
export const config: PlasmoCSConfig = {
  matches: [
    "http://localhost:3000/login/success*",
    "https://slop.vport.dev/login/success*"
  ],
  run_at: "document_end"
}

const accessToken = sessionStorage.getItem("slop_access_token")
const refreshToken = sessionStorage.getItem("slop_refresh_token")

if (accessToken && refreshToken) {
  chrome.runtime.sendMessage(
    { type: "SLOP_AUTH_TOKENS", accessToken, refreshToken },
    () => {
      sessionStorage.removeItem("slop_access_token")
      sessionStorage.removeItem("slop_refresh_token")
    }
  )
}
