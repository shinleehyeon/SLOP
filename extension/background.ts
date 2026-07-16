export {}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SLOP_AUTH_TOKENS") {
    chrome.storage.local.set(
      {
        slopAccessToken: message.accessToken,
        slopRefreshToken: message.refreshToken
      },
      () => sendResponse({ ok: true })
    )
    return true
  }
})
