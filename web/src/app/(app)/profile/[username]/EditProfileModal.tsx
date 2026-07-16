"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMe, updateMe, type MeUser } from "@/lib/api";
import { clearAuthTokens, getAccessToken } from "@/lib/auth";
import styles from "./edit-profile-modal.module.css";

interface EditProfileModalProps {
  me: MeUser;
  onClose: () => void;
  onUpdated: (me: MeUser) => void;
}

export default function EditProfileModal({ me, onClose, onUpdated }: EditProfileModalProps) {
  const router = useRouter();
  const [name, setName] = useState(me.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMe({ name: trimmed }, accessToken);
      onUpdated(updated);
      onClose();
    } catch {
      setError("저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteMe(accessToken);
      clearAuthTokens();
      router.replace("/login");
    } catch {
      setError("탈퇴하지 못했습니다. 다시 시도해주세요.");
      setDeleting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="프로필 편집"
      >
        <div className={styles.header}>
          <span className={styles.title}>프로필 편집</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <label className={styles.label}>
            이름
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.saveButton} disabled={saving || !name.trim()}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </form>

        <div className={styles.dangerZone}>
          {!confirmingDelete ? (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => setConfirmingDelete(true)}
            >
              회원 탈퇴
            </button>
          ) : (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>정말 탈퇴하시겠어요? 되돌릴 수 없어요.</span>
              <div className={styles.confirmButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "탈퇴 중..." : "탈퇴하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
