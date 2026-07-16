"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchSearchHome,
  type SearchExploreShort,
  type SearchHome,
  type SearchRecommendedAccount,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import styles from "./search.module.css";

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim().toLowerCase();

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }
    fetchSearchHome(accessToken)
      .then(setData)
      .catch(() => setError("검색 홈 정보를 불러오지 못했습니다."));
  }, []);

  const matchedAccounts: SearchRecommendedAccount[] = useMemo(() => {
    const accounts = data?.recommendedAccounts ?? [];
    if (!trimmed) return accounts;
    return accounts.filter((a) => a.name.toLowerCase().includes(trimmed));
  }, [trimmed, data]);

  const matchedShorts: SearchExploreShort[] = useMemo(() => {
    const shorts = data?.exploreShorts ?? [];
    if (!trimmed) return shorts;
    return shorts.filter(
      (s) =>
        s.title.toLowerCase().includes(trimmed) ||
        s.tags.some((t) => t.toLowerCase().includes(trimmed)),
    );
  }, [trimmed, data]);

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

        {error && <p className={styles.empty}>{error}</p>}

        {!error && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {trimmed ? "계정" : "추천 계정"}
              </h2>
              {matchedAccounts.length === 0 ? (
                <p className={styles.empty}>일치하는 계정이 없어요</p>
              ) : (
                <div className={styles.userList}>
                  {matchedAccounts.map((account) => {
                    const detailHref = `/search/account/${account.userId}?${new URLSearchParams(
                      {
                        name: account.name,
                        desc: account.description ?? "",
                        avatar: account.profileImageUrl ?? "",
                        count: String(account.shortSeriesCount),
                      },
                    ).toString()}`;
                    return (
                      <Link key={account.userId} href={detailHref} className={styles.userRow}>
                        {account.profileImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className={styles.userAvatar}
                            src={account.profileImageUrl}
                            alt={account.name}
                          />
                        ) : (
                          <span className={styles.userAvatar} />
                        )}
                        <div className={styles.userInfo}>
                          <span className={styles.userUsername}>{account.name}</span>
                          <span className={styles.userDisplayName}>
                            {account.description || `숏폼 시리즈 ${account.shortSeriesCount}개`}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{trimmed ? "릴스" : "둘러보기"}</h2>
              {matchedShorts.length === 0 ? (
                <p className={styles.empty}>일치하는 릴스가 없어요</p>
              ) : (
                <div className={styles.reelsGrid}>
                  {matchedShorts.map((short) => (
                    <Link
                      key={short.shortId}
                      href={`/reels?start=${short.shortId}`}
                      className={styles.reelThumb}
                    >
                      <video
                        className={styles.reelThumbVideo}
                        src={short.videoUrl}
                        muted
                        preload="metadata"
                        playsInline
                      />
                      <span className={styles.reelThumbLikes}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                          <path d="M12 21s-6.7-4.35-9.3-8.28C.9 9.94 1.6 6.4 4.6 5.1c2-.87 4-.2 5.4 1.6 1.4-1.8 3.4-2.47 5.4-1.6 3 1.3 3.7 4.84 1.9 7.62C18.7 16.65 12 21 12 21z" />
                        </svg>
                        {formatCount(short.likeCount)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
