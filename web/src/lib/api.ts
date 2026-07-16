export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.vport.dev";

export function buildGoogleOAuthUrl(redirectUrl: string) {
  const url = new URL(`${API_BASE_URL}/api/oauth/google`);
  url.searchParams.set("redirectUrl", redirectUrl);
  return url.toString();
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function exchangeGoogleLoginCode(
  code: string,
): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE_URL}/api/oauth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error("Failed to exchange login code");
  }

  const data = await res.json();
  return data.body.tokens as AuthTokens;
}

export type OnboardingTone = "CASUAL" | "POLITE" | "NEWS";
export type OnboardingDisplayFormat = "SENTENCE" | "KEYWORD_LIST" | "QNA";
export type OnboardingShortsStyle = "FUN" | "INFO";
export type OnboardingDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface OnboardingFieldChoice {
  fieldName: string;
  difficulty: OnboardingDifficulty;
}

export interface SaveOnboardingSettingsPayload {
  tone: OnboardingTone;
  displayFormat: OnboardingDisplayFormat;
  shortsStyle: OnboardingShortsStyle;
  fieldChoices: OnboardingFieldChoice[];
}

export async function saveOnboardingSettings(
  payload: SaveOnboardingSettingsPayload,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/onboarding`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to save onboarding settings");
  }
}

export interface OauthAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImageId: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  oauthAccounts: OauthAccount[];
  hasPassword: boolean;
}

export async function fetchMe(accessToken: string): Promise<MeUser> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  const data = await res.json();
  return data.body as MeUser;
}
