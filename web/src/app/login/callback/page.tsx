"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../auth.module.css";
import { exchangeGoogleLoginCode } from "@/lib/api";

type Status = "loading" | "error";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const code = searchParams.get("code");
    const source = searchParams.get("source") === "extension" ? "extension" : "web";

    if (errorParam) {
      setStatus("error");
      setMessage("구글 로그인이 취소되었거나 실패했습니다.");
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("로그인 코드가 전달되지 않았습니다.");
      return;
    }

    exchangeGoogleLoginCode(code)
      .then(({ accessToken, refreshToken }) => {
        sessionStorage.setItem("slop_access_token", accessToken);
        sessionStorage.setItem("slop_refresh_token", refreshToken);

        if (source === "extension") {
          // Force a real page load so the extension's content script
          // (which only injects on navigation, not client-side route
          // changes) can read the tokens from sessionStorage.
          window.location.assign(`/login/success?source=${source}`);
          return;
        }

        router.replace(`/login/success?source=${source}`);
      })
      .catch(() => {
        setStatus("error");
        setMessage("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }, [router, searchParams]);

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

        {status === "loading" ? (
          <p className={styles.hint} style={{ marginTop: 28 }}>
            <span className={styles.spinner} aria-hidden="true" />
            로그인 처리 중...
          </p>
        ) : (
          <>
            <h1 className={styles.title}>로그인 실패</h1>
            <p className={styles.subtitle}>{message}</p>
            <Link
              href="/login"
              className={`${styles.button} ${styles.primary}`}
              style={{ marginTop: 32 }}
            >
              다시 로그인하기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
