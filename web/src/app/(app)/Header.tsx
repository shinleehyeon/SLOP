"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CURRENT_USER_ID, getUserById } from "@/lib/reels-data";
import { fetchMe, type MeUser } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import styles from "./header.module.css";
import UploadModal from "./UploadModal";

export default function Header() {
  const pathname = usePathname();
  const currentUser = getUserById(CURRENT_USER_ID)!;
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    fetchMe(accessToken)
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const profileLabel = me?.name || "프로필";
  const profileAvatarUrl = me?.profileImageUrl;

  const isHome = pathname.startsWith("/home");
  const isReels = pathname.startsWith("/reels");
  const isSearch = pathname.startsWith("/search");
  const isProfile = pathname.startsWith("/profile");

  return (
    <header className={styles.header}>
      <Link href="/reels" className={styles.logo}>
        Slop
      </Link>

      <nav className={styles.nav}>
        <Link
          href="/home"
          className={`${styles.navItem} ${isHome ? styles.navItemActive : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHome ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 11 9-7 9 7" />
            <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
          </svg>
          <span>홈</span>
        </Link>

        <Link
          href="/reels"
          className={`${styles.navItem} ${isReels ? styles.navItemActive : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isReels ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none" />
          </svg>
          <span>릴스</span>
        </Link>

        <Link
          href="/search"
          className={`${styles.navItem} ${isSearch ? styles.navItemActive : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isSearch ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>검색</span>
        </Link>

        <button
          type="button"
          className={styles.navItem}
          onClick={() => setIsUploadOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span>업로드</span>
        </button>
      </nav>

      <Link
        href={`/profile/${currentUser.username}`}
        className={`${styles.profileLink} ${isProfile ? styles.profileLinkActive : ""}`}
      >
        {profileAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.navAvatar} src={profileAvatarUrl} alt={profileLabel} />
        ) : (
          <span
            className={styles.navAvatar}
            style={{ background: currentUser.avatarGradient }}
          />
        )}
        <span>{profileLabel}</span>
      </Link>

      <UploadModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </header>
  );
}
