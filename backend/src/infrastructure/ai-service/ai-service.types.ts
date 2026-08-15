/** GenerateRequest + VPort callback passthrough fields */
export interface AiServiceGenerateRequest {
  content?: string | null;
  url?: string | null;
  urls?: string[];
  title?: string | null;
  voice_id?: string | null;
  tempo?: number | null;
  upload_to_vport?: boolean | null;
  /** Passthrough for VPort series save */
  user_id?: string;
  /** JSON-stringified onboarding settings (same shape as POST /v1/onboarding) */
  onboarding?: string | null;
}

export interface AiServiceJobStatus {
  job_id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  step?: string | null;
  download_url?: string | null;
  error?: string | null;
  duration_sec?: number | null;
  vport_file_id?: string | null;
  vport_public_url?: string | null;
}

export interface AiServiceGenerateShortsInput {
  userId: string;
  content: string | null;
  /** Client links + attachment public URLs */
  urls: string[];
  title?: string | null;
  uploadToVport?: boolean;
  /** JSON-stringified onboarding settings */
  onboarding?: string | null;
}

/** POST /v1/onboarding */
export interface AiServiceOnboardingRequest {
  user_id: string;
  /** JSON-stringified onboarding settings */
  onboarding: string;
  merge?: boolean;
}

export interface AiServiceOnboardingResponse {
  user_id: string;
  style?: string | null;
  tags?: string[];
  topics?: string[];
  onboarding?: string | null;
  updated_at?: number | null;
}

export interface AiServiceSyncOnboardingInput {
  userId: string;
  onboarding: unknown;
  merge?: boolean;
}

/** GET /v1/recommend */
export interface AiServiceRecommendResponse {
  user_id: string;
  job_id: string;
  title?: string | null;
  style?: string | null;
  tags?: string[];
  download_url?: string | null;
  vport_series_id?: string | null;
  vport_public_url?: string | null;
  duration_sec?: number | null;
  episode_count?: number | null;
  match_score?: number | null;
}

/** POST /v1/duplicates/check */
export interface AiServiceDuplicateCheckRequest {
  url: string;
}

export interface AiServiceDuplicateMatch {
  job_id: string;
  match_type: string;
  duplicate: boolean;
  similar: boolean;
  score: number;
  reasons: string[];
  title?: string | null;
  download_url?: string | null;
  overlap_urls?: string[];
}

export interface AiServiceDuplicateCheckResponse {
  duplicate: boolean;
  similar: boolean;
  job_ids: string[];
  matches: AiServiceDuplicateMatch[];
}
