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

export type FileUploadPurpose = "PROFILE_IMAGE" | "GENERAL";

export interface PresignedUploadRequest {
  purpose: FileUploadPurpose;
  originalName: string | null;
  contentType: string;
  size: number;
}

export interface PresignedUploadResult {
  fileId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export async function createPresignedUpload(
  payload: PresignedUploadRequest,
  accessToken: string,
): Promise<PresignedUploadResult> {
  const res = await fetch(`${API_BASE_URL}/api/files/presigned-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create presigned upload URL");
  }

  const data = await res.json();
  return data.body as PresignedUploadResult;
}

export interface CompletedFile {
  id: string;
  status: string;
  purpose: FileUploadPurpose;
  key: string;
  publicUrl: string;
  originalName: string;
  contentType: string;
  size: number;
  ownerId: string;
  attachedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function completeUpload(
  fileId: string,
  accessToken: string,
): Promise<CompletedFile> {
  const res = await fetch(`${API_BASE_URL}/api/files/${fileId}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to complete upload");
  }

  const data = await res.json();
  return data.body as CompletedFile;
}

// PUTs the raw file bytes directly to the presigned S3/R2 URL (not through
// our API), using XHR instead of fetch so we get real upload progress events.
export function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export interface LearningHomeWeek {
  start: string;
  end: string;
}

export interface LearningHomeSummary {
  savedCount: number;
  totalDragCount: number;
  interestFieldCount: number;
}

export interface LearningHomeFrequentExpression {
  id: string;
  title: string;
  definition: string;
  dragCount: number;
  sourceTitle: string;
  sourceUrl: string;
  fieldName: string;
}

export interface LearningHomeRecentExpression {
  id: string;
  title: string;
  fieldName: string;
  sourceTitle: string;
  savedAt: string;
}

export interface LearningHomeFieldStat {
  fieldId: string;
  fieldName: string;
  expressionCount: number;
  dragCount: number;
  percentage: number;
}

export interface LearningHomeRelatedShort {
  shortId: string;
  seriesId: string;
  title: string;
  tags: string[];
  videoUrl: string;
  creatorName: string;
}

export interface LearningHome {
  week: LearningHomeWeek;
  summary: LearningHomeSummary;
  frequentExpressions: LearningHomeFrequentExpression[];
  recentExpressions: LearningHomeRecentExpression[];
  fieldStats: LearningHomeFieldStat[];
  relatedShorts: LearningHomeRelatedShort[];
}

export async function fetchLearningHome(accessToken: string): Promise<LearningHome> {
  const res = await fetch(`${API_BASE_URL}/api/learning/home`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch learning home");
  }

  const data = await res.json();
  return data.body as LearningHome;
}

export interface ShortLikeResult {
  shortId: string;
  liked: boolean;
  likeCount: number;
}

export async function toggleShortLike(
  shortId: string,
  accessToken: string,
): Promise<ShortLikeResult> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/${shortId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to toggle short like");
  }

  const data = await res.json();
  return data.body as ShortLikeResult;
}

export interface ShortCommentAuthor {
  id: string;
  name: string;
  profileImageUrl: string | null;
}

export interface ShortComment {
  id: string;
  shortId: string;
  content: string;
  author: ShortCommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface ShortCommentsPage {
  items: ShortComment[];
  meta: { page: number; limit: number; total: number };
}

export async function fetchShortComments(
  shortId: string,
  accessToken: string,
  page = 1,
  limit = 50,
): Promise<ShortCommentsPage> {
  const url = new URL(`${API_BASE_URL}/api/shorts/${shortId}/comments`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch short comments");
  }

  const data = await res.json();
  return data.body as ShortCommentsPage;
}

export async function createShortComment(
  shortId: string,
  content: string,
  accessToken: string,
): Promise<ShortComment> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/${shortId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error("Failed to create short comment");
  }

  const data = await res.json();
  return data.body as ShortComment;
}

export async function deleteShortComment(
  shortId: string,
  commentId: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/${shortId}/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to delete short comment");
  }
}

export interface UpdateMePayload {
  name?: string | null;
  profileImageId?: string | null;
}

export async function updateMe(
  payload: UpdateMePayload,
  accessToken: string,
): Promise<MeUser> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to update user");
  }

  const data = await res.json();
  return data.body as MeUser;
}

export async function deleteMe(accessToken: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to delete account");
  }
}

export interface SearchRecommendedAccount {
  userId: string;
  name: string;
  description: string;
  shortSeriesCount: number;
  profileImageUrl: string | null;
}

export interface SearchExploreShort {
  shortId: string;
  seriesId: string;
  title: string;
  seriesTitle: string;
  tags: string[];
  videoUrl: string;
  creatorUserId: string;
  creatorName: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface SearchHome {
  recommendedAccounts: SearchRecommendedAccount[];
  exploreShorts: SearchExploreShort[];
}

export async function fetchSearchHome(accessToken: string): Promise<SearchHome> {
  const res = await fetch(`${API_BASE_URL}/api/search/home`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch search home");
  }

  const data = await res.json();
  return data.body as SearchHome;
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

export type ShortGenerationStatus =
  | "GENERATING"
  | "COMPLETED"
  | "DISPATCH_FAILED"
  | "FAILED";

export interface RequestShortGeneratePayload {
  content: string | null;
  links: string[];
  attachments: string[];
  requestedSiteUrl: string | null;
}

export interface ShortGeneration {
  id: string;
  status: ShortGenerationStatus;
  requestedSiteUrl: string | null;
  content: string | null;
  links: string[];
  attachmentFileIds: string[];
  seriesId: string | null;
  aiJobId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function requestShortGenerate(
  payload: RequestShortGeneratePayload,
  accessToken: string,
): Promise<ShortGeneration> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to request short generation");
  }

  const data = await res.json();
  return data.body as ShortGeneration;
}

export async function fetchShortGeneration(
  generationId: string,
  accessToken: string,
): Promise<ShortGeneration> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/generations/${generationId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch short generation");
  }

  const data = await res.json();
  return data.body as ShortGeneration;
}

export interface ShortEpisode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  tags: string[];
  videoFileId: string;
  videoFileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortSeries {
  id: string;
  userId: string;
  title: string;
  style: OnboardingShortsStyle;
  requestedSiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
  shorts: ShortEpisode[];
}

export async function fetchShortGenerations(
  accessToken: string,
  status?: ShortGenerationStatus,
): Promise<ShortGeneration[]> {
  const url = new URL(`${API_BASE_URL}/api/shorts/generations`);
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch short generations");
  }

  const data = await res.json();
  return data.body.items as ShortGeneration[];
}

export interface ShortSeriesSummary {
  id: string;
  userId: string;
  title: string;
  style: OnboardingShortsStyle;
  requestedSiteUrl: string | null;
  shortCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchUserShortSeries(
  userId: string,
  accessToken: string,
): Promise<ShortSeriesSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/users/${userId}/series`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user's short series");
  }

  const data = await res.json();
  return data.body.items as ShortSeriesSummary[];
}

export async function fetchShortSeries(
  seriesId: string,
  accessToken: string,
): Promise<ShortSeries> {
  const res = await fetch(`${API_BASE_URL}/api/shorts/series/${seriesId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch short series");
  }

  const data = await res.json();
  return data.body as ShortSeries;
}
