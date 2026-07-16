const ACCESS_TOKEN_KEY = "slop_access_token";
const REFRESH_TOKEN_KEY = "slop_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (stored) return stored;

  // Fallback for sessions that logged in before localStorage persistence
  // was added, or whose sessionStorage handoff hasn't been cleared yet
  // (e.g. no extension installed to consume it). Promote it so future
  // reads hit localStorage directly.
  const sessionAccess = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const sessionRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (sessionAccess && sessionRefresh) {
    setAuthTokens(sessionAccess, sessionRefresh);
    return sessionAccess;
  }

  return null;
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
