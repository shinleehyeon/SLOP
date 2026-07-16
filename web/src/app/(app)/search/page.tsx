"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { REELS, USERS, formatCount, type ReelUser } from "@/lib/reels-data";
import styles from "./search.module.css";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const matchedUsers: ReelUser[] = useMemo(() => {
    if (!trimmed) return USERS;
    return USERS.filter(
      (u) =>
        u.username.toLowerCase().includes(trimmed) ||
        u.displayName.toLowerCase().includes(trimmed),
    );
  }, [trimmed]);

  const matchedReels = useMemo(() => {
    if (!trimmed) return REELS;
    return REELS.filter((r) => r.caption.toLowerCase().includes(trimmed));
  }, [trimmed]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.searchBar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="계정, 릴스 검색"
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {trimmed ? "계정" : "추천 계정"}
          </h2>
          {matchedUsers.length === 0 ? (
            <p className={styles.empty}>일치하는 계정이 없어요</p>
          ) : (
            <div className={styles.userList}>
              {matchedUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className={styles.userRow}
                >
                  <span
                    className={styles.userAvatar}
                    style={{ background: user.avatarGradient }}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.userUsername}>{user.username}</span>
                    <span className={styles.userDisplayName}>
                      {user.displayName} · 팔로워 {formatCount(user.followers)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{trimmed ? "릴스" : "둘러보기"}</h2>
          {matchedReels.length === 0 ? (
            <p className={styles.empty}>일치하는 릴스가 없어요</p>
          ) : (
            <div className={styles.reelsGrid}>
              {matchedReels.map((reel) => (
                <Link
                  key={reel.id}
                  href={`/reels?start=${reel.id}`}
                  className={styles.reelThumb}
                  style={{ background: reel.gradient }}
                >
                  <span className={styles.reelThumbLikes}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                      <path d="M12 21s-6.7-4.35-9.3-8.28C.9 9.94 1.6 6.4 4.6 5.1c2-.87 4-.2 5.4 1.6 1.4-1.8 3.4-2.47 5.4-1.6 3 1.3 3.7 4.84 1.9 7.62C18.7 16.65 12 21 12 21z" />
                    </svg>
                    {formatCount(reel.likes)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
