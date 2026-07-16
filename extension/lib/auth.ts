export interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export function getStoredTokens(): Promise<StoredTokens | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["slopAccessToken", "slopRefreshToken"],
      (result) => {
        if (result.slopAccessToken && result.slopRefreshToken) {
          resolve({
            accessToken: result.slopAccessToken,
            refreshToken: result.slopRefreshToken
          })
        } else {
          resolve(null)
        }
      }
    )
  })
}
