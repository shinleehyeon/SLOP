"use client";

import Image from "next/image";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../auth.module.css";

const WEB_REDIRECT_DELAY_MS = 2000;

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") === "extension" ? "extension" : "web";

  useEffect(() => {
    if (source !== "web") return;
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, WEB_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [source, router]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.successIconWrap}>
          <Image
            className={styles.logo}
            src="/logo.png"
            alt="Slop 로고"
            width={76}
            height={76}
            priority
          />
          <span className={styles.checkBadge} aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </div>

        <h1 className={styles.title}>로그인 완료!</h1>

        {source === "extension" ? (
          <>
            <p className={styles.subtitle}>
              이제 이 창을 닫고 확장 프로그램으로 돌아가세요
            </p>
            <p className={styles.hint}>
              <span className={styles.spinner} aria-hidden="true" />
              확장 프로그램으로 이동 중...
            </p>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>취향을 알려주시면 딱 맞는 쇼츠를 만들어드려요</p>
            <p className={styles.hint}>
              <span className={styles.spinner} aria-hidden="true" />
              온보딩으로 이동 중...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
