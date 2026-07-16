"use client";

import { useState } from "react";
import Link from "next/link";
import type { Reel, ReelUser } from "@/lib/reels-data";
import { formatCount } from "@/lib/reels-data";
import styles from "./reels.module.css";

interface ReelCardProps {
  reel: Reel;
  user: ReelUser;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onToggleLike: () => void;
  onOpenComments: () => void;
}

export default function ReelCard({
  reel,
  user,
  liked,
  likeCount,
  commentCount,
  onToggleLike,
  onOpenComments,
}: ReelCardProps) {
  const [paused, setPaused] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleDoubleClick = () => {
    if (!liked) onToggleLike();
    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 700);
  };

  return (
    <section className={styles.reel}>
      <div className={styles.reelRow}>
        <div
          className={styles.reelSurface}
          style={{ background: reel.gradient }}
          onClick={() => setPaused((p) => !p)}
          onDoubleClick={handleDoubleClick}
        >
          {paused && (
            <div className={styles.pausedIcon} aria-hidden="true">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          {showBurst && (
            <div className={styles.likeBurst} aria-hidden="true">
              <svg width="88" height="88" viewBox="0 0 24 24" fill="white">
                <path d="M12 21s-6.7-4.35-9.3-8.28C.9 9.94 1.6 6.4 4.6 5.1c2-.87 4-.2 5.4 1.6 1.4-1.8 3.4-2.47 5.4-1.6 3 1.3 3.7 4.84 1.9 7.62C18.7 16.65 12 21 12 21z" />
              </svg>
            </div>
          )}
        </div>

        <div className={styles.infoPanel}>
          <Link href={`/profile/${user.username}`} className={styles.infoUserRow}>
            <span
              className={styles.infoAvatar}
              style={{ background: user.avatarGradient }}
            />
            <div className={styles.infoUserText}>
              <span className={styles.infoUsername}>{user.username}</span>
              <span className={styles.infoMusic}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                {reel.music}
              </span>
            </div>
          </Link>

          <p className={styles.infoCaption}>{reel.caption}</p>

          <div className={styles.infoDivider} />

          <div className={styles.infoActions}>
            <button
              type="button"
              className={`${styles.actionButton} ${liked ? styles.actionButtonActive : ""}`}
              onClick={onToggleLike}
              aria-pressed={liked}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={liked ? "#ff3040" : "none"}
                stroke={liked ? "#ff3040" : "#111827"}
                strokeWidth="2"
                strokeLinejoin="round"
              >
                <path d="M12 21s-6.7-4.35-9.3-8.28C.9 9.94 1.6 6.4 4.6 5.1c2-.87 4-.2 5.4 1.6 1.4-1.8 3.4-2.47 5.4-1.6 3 1.3 3.7 4.84 1.9 7.62C18.7 16.65 12 21 12 21z" />
              </svg>
              좋아요 {formatCount(likeCount)}
            </button>

            <button type="button" className={styles.actionButton} onClick={onOpenComments}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              댓글 {formatCount(commentCount)}
            </button>

            <button type="button" className={styles.actionButton}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              공유 {formatCount(reel.shares)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
