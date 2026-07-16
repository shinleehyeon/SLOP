"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  completeUpload,
  createPresignedUpload,
  fetchShortGeneration,
  fetchShortSeries,
  requestShortGenerate,
  uploadFileToPresignedUrl,
  type RequestShortGeneratePayload,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import styles from "./upload-progress.module.css";

type UploadKind = "video" | "file" | "text" | "link";

const KIND_SUBJECT: Record<UploadKind, string> = {
  video: "영상이",
  file: "파일이",
  text: "텍스트가",
  link: "링크가",
};

const KIND_WATCH_LABEL: Record<UploadKind, string> = {
  video: "바로 시청하기",
  file: "바로 보기",
  text: "바로 보기",
  link: "바로 보기",
};

type UploadState =
  | { status: "uploading"; progress: number; kind: UploadKind }
  | { status: "generating"; kind: UploadKind }
  | { status: "done"; kind: UploadKind; videoUrl: string | null }
  | { status: "error"; message: string };

interface UploadProgressContextValue {
  startUpload: (kind: "text" | "link", value: string) => void;
  startFileUpload: (file: File) => void;
}

const GENERATION_POLL_MS = 2500;
const GENERATION_MAX_ATTEMPTS = 48; // ~2 minutes at GENERATION_POLL_MS intervals

const UploadProgressContext = createContext<UploadProgressContextValue | null>(null);

export function useUploadProgress(): UploadProgressContextValue {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) throw new Error("useUploadProgress must be used within UploadProgressProvider");
  return ctx;
}

const PROGRESS_STEP_MS = 180;

export default function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const dismiss = () => setUpload(null);

  const runGeneration = useCallback(
    async (payload: RequestShortGeneratePayload, kind: UploadKind, accessToken: string) => {
      setUpload({ status: "generating", kind });

      let generation = await requestShortGenerate(payload, accessToken);
      let attempts = 0;
      while (generation.status === "GENERATING" && attempts < GENERATION_MAX_ATTEMPTS) {
        await new Promise((resolve) => window.setTimeout(resolve, GENERATION_POLL_MS));
        generation = await fetchShortGeneration(generation.id, accessToken);
        attempts += 1;
      }

      if (generation.status === "GENERATING") {
        setUpload({
          status: "error",
          message: "생성에 실패했어요. 잠시 후 다시 확인해주세요.",
        });
        return;
      }

      if (generation.status !== "COMPLETED" || !generation.seriesId) {
        setUpload({ status: "error", message: "숏폼 생성에 실패했습니다. 다시 시도해주세요." });
        return;
      }

      const series = await fetchShortSeries(generation.seriesId, accessToken);
      const videoUrl = series.shorts[0]?.videoFileUrl ?? null;
      setUpload({ status: "done", kind, videoUrl });
    },
    [],
  );

  const startUpload = useCallback(
    (kind: "text" | "link", value: string) => {
      clearTimer();
      const accessToken = getAccessToken();
      if (!accessToken) {
        setUpload({ status: "error", message: "로그인이 필요합니다." });
        return;
      }

      const payload: RequestShortGeneratePayload = {
        content: kind === "text" ? value : null,
        links: kind === "link" ? [value] : [],
        attachments: [],
        requestedSiteUrl: null,
      };

      runGeneration(payload, kind, accessToken).catch(() => {
        setUpload({ status: "error", message: "숏폼 생성에 실패했습니다. 다시 시도해주세요." });
      });
    },
    [runGeneration],
  );

  const startFileUpload = useCallback(
    async (file: File) => {
      clearTimer();
      const kind: UploadKind = file.type.startsWith("video/") ? "video" : "file";
      setUpload({ status: "uploading", progress: 0, kind });

      try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          setUpload({ status: "error", message: "로그인이 필요합니다." });
          return;
        }

        const presigned = await createPresignedUpload(
          {
            purpose: "GENERAL",
            originalName: file.name || null,
            contentType: file.type || "application/octet-stream",
            size: file.size,
          },
          accessToken,
        );

        await uploadFileToPresignedUrl(
          presigned.uploadUrl,
          file,
          presigned.headers,
          (percent) =>
            setUpload({ status: "uploading", progress: Math.min(percent, 99), kind }),
        );

        await completeUpload(presigned.fileId, accessToken);

        await runGeneration(
          { content: null, links: [], attachments: [presigned.fileId], requestedSiteUrl: null },
          kind,
          accessToken,
        );
      } catch {
        setUpload({ status: "error", message: "업로드에 실패했습니다. 다시 시도해주세요." });
      }
    },
    [runGeneration],
  );

  return (
    <UploadProgressContext.Provider value={{ startUpload, startFileUpload }}>
      {children}

      {upload && (
        <div className={styles.card} role="status">
          {upload.status === "uploading" && (
            <>
              <div className={styles.spinner} />
              <div className={styles.body}>
                <p className={styles.text}>{KIND_SUBJECT[upload.kind]} 업로드 중입니다</p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {upload.status === "generating" && (
            <>
              <div className={styles.spinner} />
              <div className={styles.body}>
                <p className={styles.text}>{KIND_SUBJECT[upload.kind]} 숏폼으로 생성 중입니다</p>
              </div>
            </>
          )}

          {upload.status === "done" && (
            <>
              <div className={styles.doneCheck}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className={styles.body}>
                <p className={styles.text}>{KIND_SUBJECT[upload.kind]} 숏폼으로 생성됐어요!</p>
              </div>
              {upload.videoUrl ? (
                <a
                  href={upload.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.watchButton}
                  onClick={dismiss}
                >
                  {KIND_WATCH_LABEL[upload.kind]}
                </a>
              ) : null}
              <button
                type="button"
                className={styles.close}
                onClick={dismiss}
                aria-label="닫기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </>
          )}

          {upload.status === "error" && (
            <>
              <div className={styles.body}>
                <p className={styles.text}>{upload.message}</p>
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={dismiss}
                aria-label="닫기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </UploadProgressContext.Provider>
  );
}
