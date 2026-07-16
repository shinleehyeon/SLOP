"use client";

import { useState } from "react";
import { formatCount } from "@/lib/reels-data";
import styles from "./reels.module.css";

export interface FeedReel {
  id: string;
  title: string;
  tags: string[];
  videoUrl: string;
  creatorName: string;
}

interface ReelCardProps {
  reel: FeedReel;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onToggleLike: () => void;
  onOpenComments: () => void;
}

export default function ReelCard({
  reel,
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

  const togglePlayback = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <section className={styles.reel}>
      <div className={styles.reelRow}>
        <div className={styles.reelSurface} onDoubleClick={handleDoubleClick}>
          <video
            className={styles.reelVideo}
            src={reel.videoUrl}
            autoPlay
            loop
            playsInline
            onClick={togglePlayback}
          />
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
          <div className={styles.infoUserRow}>
            <span className={styles.infoAvatar} />
            <div className={styles.infoUserText}>
              <span className={styles.infoUsername}>{reel.creatorName}</span>
            </div>
          </div>

          <p className={styles.infoCaption}>{reel.title}</p>
          {reel.tags.length > 0 && (
            <p className={styles.infoMusic}>{reel.tags.map((t) => `#${t}`).join(" ")}</p>
          )}

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
          </div>
        </div>
      </div>
    </section>
  );
}
