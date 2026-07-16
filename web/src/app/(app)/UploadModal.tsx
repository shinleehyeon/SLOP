"use client";

import { useMemo, useRef, useState } from "react";
import { useUploadProgress } from "./UploadProgressContext";
import styles from "./upload-modal.module.css";

type ContentKind = "text" | "link" | "file";

interface KindConfig {
  kind: ContentKind;
  label: string;
  icon: React.ReactNode;
}

const KIND_CONFIGS: KindConfig[] = [
  {
    kind: "text",
    label: "텍스트",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 6h14M5 12h14M5 18h9" />
      </svg>
    ),
  },
  {
    kind: "link",
    label: "링크",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    kind: "file",
    label: "파일",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
];

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  text: string;
  link: string;
  file: File | null;
}

const EMPTY_FORM: FormState = {
  text: "",
  link: "",
  file: null,
};

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const [selected, setSelected] = useState<Set<ContentKind>>(new Set());
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { startUpload } = useUploadProgress();

  const filePreviewUrl = useMemo(
    () =>
      form.file && form.file.type.startsWith("image/")
        ? URL.createObjectURL(form.file)
        : null,
    [form.file],
  );

  const canSubmit = useMemo(() => {
    if (selected.size === 0) return false;
    for (const kind of selected) {
      if (kind === "text" && !form.text.trim()) return false;
      if (kind === "link" && !form.link.trim()) return false;
      if (kind === "file" && !form.file) return false;
    }
    return true;
  }, [selected, form]);

  if (!open) return null;

  const reset = () => {
    setSelected(new Set());
    setForm(EMPTY_FORM);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleKind = (kind: ContentKind) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    startUpload();
    reset();
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="릴스 업로드"
      >
        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>업로드</span>
          <button
            type="button"
            className={styles.close}
            onClick={handleClose}
            aria-label="닫기"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <p className={styles.subtitle}>공유할 콘텐츠 유형을 선택하세요</p>

          <div className={styles.kindGrid}>
            {KIND_CONFIGS.map(({ kind, label, icon }) => {
              const isSelected = selected.has(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  className={styles.kindItem}
                  onClick={() => toggleKind(kind)}
                >
                  <span
                    className={`${styles.kindIcon} ${isSelected ? styles.kindIconSelected : ""}`}
                  >
                    {icon}
                    {isSelected && (
                      <span className={styles.kindBadge}>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className={styles.kindLabel}>{label}</span>
                </button>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className={styles.fieldList}>
              {KIND_CONFIGS.filter((c) => selected.has(c.kind)).map(
                ({ kind, label }) => (
                  <div key={kind} className={styles.field}>
                    <span className={styles.fieldLabel}>{label}</span>

                    {kind === "text" && (
                      <textarea
                        className={styles.textarea}
                        placeholder="텍스트를 입력하세요"
                        value={form.text}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, text: e.target.value }))
                        }
                        rows={3}
                      />
                    )}

                    {kind === "link" && (
                      <input
                        type="url"
                        className={styles.input}
                        placeholder="https://example.com"
                        value={form.link}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, link: e.target.value }))
                        }
                      />
                    )}

                    {kind === "file" && (
                      <div className={styles.filePicker}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                          className={styles.hiddenFileInput}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              file: e.target.files?.[0] ?? null,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className={styles.filePickerButton}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          파일 선택
                        </button>
                        <span className={styles.fileName}>
                          {form.file?.name ?? "이미지, 영상, 문서 등"}
                        </span>
                        {filePreviewUrl && (
                          <span
                            className={styles.imagePreview}
                            style={{
                              backgroundImage: `url(${filePreviewUrl})`,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!canSubmit}
            >
              업로드
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
