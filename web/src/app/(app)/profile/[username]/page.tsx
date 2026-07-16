"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CURRENT_USER_ID,
  getReelsByUserId,
  getUserByUsername,
  formatCount,
} from "@/lib/reels-data";
import styles from "./profile.module.css";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const user = getUserByUsername(username);
  const [following, setFollowing] = useState(false);

  if (!user) {
    notFound();
  }

  const isMe = user.id === CURRENT_USER_ID;
  const reels = getReelsByUserId(user.id);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.banner} style={{ background: user.avatarGradient }}>
          <span className={styles.avatarRing}>
            <span className={styles.avatar} style={{ background: user.avatarGradient }} />
          </span>
        </div>

        <div className={styles.content}>
          <div className={styles.identityRow}>
            <div>
              <h1 className={styles.displayName}>{user.displayName}</h1>
              <p className={styles.username}>@{user.username}</p>
            </div>

            {isMe ? (
              <button type="button" className={styles.editButton}>
                프로필 편집
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.followButton} ${following ? styles.followButtonActive : ""}`}
                onClick={() => setFollowing((f) => !f)}
              >
                {following ? "팔로잉" : "팔로우"}
              </button>
            )}
          </div>

          {user.bio && <p className={styles.bio}>{user.bio}</p>}

          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatCount(reels.length)}</span>
              <span className={styles.statLabel}>릴스</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatCount(user.followers)}</span>
              <span className={styles.statLabel}>팔로워</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatCount(user.following)}</span>
              <span className={styles.statLabel}>팔로잉</span>
            </div>
          </div>
        </div>

        <div className={styles.reelsSection}>
          <div className={styles.sectionHeading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="m10 8 6 4-6 4z" />
            </svg>
            <span>릴스</span>
            <span className={styles.sectionCount}>{reels.length}</span>
          </div>

          {reels.length === 0 ? (
            <div className={styles.reelsEmpty}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="m10 8 6 4-6 4z" />
              </svg>
              <p>아직 올린 릴스가 없어요</p>
            </div>
          ) : (
            <div className={styles.reelsGrid}>
              {reels.map((reel) => (
                <Link
                  key={reel.id}
                  href={`/reels?user=${user.username}&start=${reel.id}`}
                  className={styles.reelThumb}
                  style={{ background: reel.gradient }}
                >
                  <span className={styles.reelThumbOverlay}>
                    <span className={styles.reelThumbLikes}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                        <path d="M12 21s-6.7-4.35-9.3-8.28C.9 9.94 1.6 6.4 4.6 5.1c2-.87 4-.2 5.4 1.6 1.4-1.8 3.4-2.47 5.4-1.6 3 1.3 3.7 4.84 1.9 7.62C18.7 16.65 12 21 12 21z" />
                      </svg>
                      {formatCount(reel.likes)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
