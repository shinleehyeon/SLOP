import Image from "next/image";
import Link from "next/link";
import styles from "../auth.module.css";

export default function LoginEmailPage() {
  return (
    <div className={styles.page}>
      <Link href="/login" className={styles.backButton} aria-label="뒤로 가기">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>

      <div className={styles.card}>
        <Image
          className={styles.logoSmall}
          src="/logo.png"
          alt="Slop 로고"
          width={52}
          height={52}
          priority
        />

        <h1 className={styles.title}>이메일로 로그인</h1>
        <p className={styles.subtitle}>Slop 계정 정보를 입력해주세요</p>

        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              이메일<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="password">
                비밀번호<span className={styles.required}>*</span>
              </label>
              <a href="#" className={styles.forgotLink}>
                비밀번호를 잊으셨나요?
              </a>
            </div>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
              <button
                type="button"
                className={styles.visibilityToggle}
                aria-label="비밀번호 표시"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.button} ${styles.primary} ${styles.submit}`}
          >
            로그인
          </button>
        </form>

        <p className={styles.footer}>
          계정이 없으신가요?{" "}
          <Link href="/login/email/signup" className={styles.footerLink}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
