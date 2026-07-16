"use client";

import { useState } from "react";
import styles from "./reels.module.css";

export interface UIComment {
  id: string;
  text: string;
  createdAt: number;
  authorName: string;
  authorAvatarUrl: string | null;
  canDelete: boolean;
}

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  comments: UIComment[];
  onSubmit: (text: string) => void;
  onDelete: (commentId: string) => void;
  currentUserAvatarGradient: string;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "방금";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function CommentsSheet({
  open,
  onClose,
  comments,
  onSubmit,
  onDelete,
  currentUserAvatarGradient,
}: CommentsSheetProps) {
  const [text, setText] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="댓글"
      >
        <div className={styles.sheetHeader}>
          <span>댓글 {comments.length > 0 ? comments.length : ""}</span>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="댓글 닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.sheetList}>
          {comments.length === 0 ? (
            <div className={styles.sheetEmpty}>
              <p className={styles.sheetEmptyTitle}>아직 댓글이 없어요</p>
              <p className={styles.sheetEmptySubtitle}>첫 댓글을 남겨보세요</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.sheetComment}>
                {comment.authorAvatarUrl ? (
                  <img
                    src={comment.authorAvatarUrl}
                    alt=""
                    className={styles.sheetCommentAvatar}
                  />
                ) : (
                  <div className={styles.sheetCommentAvatar} />
                )}
                <div className={styles.sheetCommentBody}>
                  <p className={styles.sheetCommentMeta}>
                    <span className={styles.sheetCommentUser}>{comment.authorName}</span>
                    <span className={styles.sheetCommentTime}>
                      {timeAgo(comment.createdAt)}
                    </span>
                  </p>
                  <p className={styles.sheetCommentText}>{comment.text}</p>
                </div>
                {comment.canDelete && (
                  <button
                    type="button"
                    className={styles.sheetClose}
                    onClick={() => onDelete(comment.id)}
                    aria-label="댓글 삭제"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="m18 6-12 12M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <form className={styles.sheetForm} onSubmit={handleSubmit}>
          <div
            className={styles.sheetFormAvatar}
            style={{ background: currentUserAvatarGradient }}
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글 달기..."
            className={styles.sheetInput}
          />
          <button
            type="submit"
            className={styles.sheetSubmit}
            disabled={!text.trim()}
          >
            게시
          </button>
        </form>
      </div>
    </div>
  );
}
