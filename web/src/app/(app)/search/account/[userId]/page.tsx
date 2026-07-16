"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchShortSeries,
  fetchUserShortSeries,
  type ShortEpisode,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { seekToThumbnailFrame } from "@/lib/video-thumbnail";
import styles from "./account.module.css";

interface FeedShort extends ShortEpisode {
  seriesTitle: string;
}

export default function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ name?: string; desc?: string; avatar?: string; count?: string }>;
}) {
  const { userId } = use(params);
  const { name, desc, avatar, count } = use(searchParams);
  const router = useRouter();

  const [shorts, setShorts] = useState<FeedShort[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    fetchUserShortSeries(userId, accessToken)
      .then(async (seriesList) => {
        const fullSeries = await Promise.all(
          seriesList.map((s) => fetchShortSeries(s.id, accessToken).catch(() => null)),
        );
        const flattened: FeedShort[] = fullSeries
          .filter((s) => s !== null)
          .flatMap((s) => s!.shorts.map((short) => ({ ...short, seriesTitle: s!.title })));
        setShorts(flattened);
      })
      .catch(() => setError("숏폼 목록을 불러오지 못했습니다."));
  }, [userId]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>뒤로</span>
        </button>

        <div className={styles.identity}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.avatar} src={avatar} alt={name ?? ""} />
          ) : (
            <span className={styles.avatar} />
          )}
          <div>
            <h1 className={styles.name}>{name ?? "사용자"}</h1>
            {desc && <p className={styles.desc}>{desc}</p>}
            <p className={styles.count}>숏폼 시리즈 {count ?? "0"}개</p>
          </div>
        </div>

        <div className={styles.reelsSection}>
          <div className={styles.sectionHeading}>
            <span>릴스</span>
            {shorts && <span className={styles.sectionCount}>{shorts.length}</span>}
          </div>

          {error && <p className={styles.empty}>{error}</p>}

          {!error && shorts && shorts.length === 0 && (
            <p className={styles.empty}>아직 제작한 쇼츠가 없어요</p>
          )}

          {!error && shorts && shorts.length > 0 && (
            <div className={styles.reelsGrid}>
              {shorts.map((short) => (
                <a
                  key={short.id}
                  href={short.videoFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.reelThumb}
                >
                  <video
                    className={styles.reelThumbVideo}
                    src={short.videoFileUrl}
                    muted
                    preload="metadata"
                    playsInline
                    onLoadedMetadata={seekToThumbnailFrame}
                  />
                  <span className={styles.reelThumbTitle}>{short.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
