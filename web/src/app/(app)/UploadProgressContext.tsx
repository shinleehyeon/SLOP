"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import styles from "./upload-progress.module.css";

type UploadState =
  | { status: "uploading"; progress: number }
  | { status: "done" };

interface UploadProgressContextValue {
  startUpload: () => void;
}

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

  const startUpload = useCallback(() => {
    clearTimer();
    setUpload({ status: "uploading", progress: 0 });

    intervalRef.current = window.setInterval(() => {
      setUpload((prev) => {
        if (!prev || prev.status !== "uploading") return prev;
        const next = Math.min(prev.progress + 12, 100);
        if (next >= 100) {
          clearTimer();
          return { status: "done" };
        }
        return { status: "uploading", progress: next };
      });
    }, PROGRESS_STEP_MS);
  }, []);

  const dismiss = () => setUpload(null);

  return (
    <UploadProgressContext.Provider value={{ startUpload }}>
      {children}

      {upload && (
        <div className={styles.card} role="status">
          {upload.status === "uploading" ? (
            <>
              <div className={styles.spinner} />
              <div className={styles.body}>
                <p className={styles.text}>영상이 업로드 중입니다</p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.doneCheck}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className={styles.body}>
                <p className={styles.text}>영상이 업로드 되었어요!</p>
              </div>
              <Link href="/reels" className={styles.watchButton} onClick={dismiss}>
                바로 시청하기
              </Link>
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
