"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./auth.module.css";
import { buildGoogleOAuthUrl } from "@/lib/api";

function LoginContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") === "extension" ? "extension" : "web";

  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/login/callback?source=${source}`;
    window.location.href = buildGoogleOAuthUrl(redirectUrl);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image
          className={styles.logo}
          src="/logo.png"
          alt="Slop 로고"
          width={76}
          height={76}
          priority
        />

        <h1 className={styles.title}>Slop으로 로그인하기</h1>
        <p className={styles.subtitle}>다른 사람이 만든 쇼츠가 있어요</p>

        <div className={styles.actions}>
          <Link href="/login/email" className={`${styles.button} ${styles.primary}`}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            이메일로 계속 진행
          </Link>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`${styles.button} ${styles.secondary}`}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            구글 계정으로 계속 진행
          </button>
        </div>

        <p className={styles.terms}>
          로그인하면 <a href="#">이용약관</a> 및 <a href="#">개인정보 처리방침</a>
          에 동의합니다
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
