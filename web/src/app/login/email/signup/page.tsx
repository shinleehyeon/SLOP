import Image from "next/image";
import Link from "next/link";
import styles from "../../auth.module.css";

export default function SignupEmailPage() {
  return (
    <div className={styles.page}>
      <Link
        href="/login/email"
        className={styles.backButton}
        aria-label="뒤로 가기"
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

        <h1 className={styles.title}>이메일로 회원가입</h1>
        <p className={styles.subtitle}>
          몇 가지 정보만 입력하면 바로 시작할 수 있어요
        </p>

        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              이름<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="홍길동"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-email">
              이메일<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-password">
              비밀번호<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
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
            <span className={styles.helperText}>
              8자 이상, 영문/숫자/특수문자를 조합해주세요
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm-password">
              비밀번호 확인<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="비밀번호 다시 입력"
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

          <label className={styles.checkboxRow} htmlFor="agree-terms">
            <input
              id="agree-terms"
              name="agreeTerms"
              type="checkbox"
              className={styles.checkbox}
            />
            <span className={styles.checkboxLabel}>
              <a href="#">이용약관</a> 및 <a href="#">개인정보 처리방침</a>에
              동의합니다
            </span>
          </label>

          <button
            type="submit"
            className={`${styles.button} ${styles.primary} ${styles.submit}`}
          >
            회원가입
          </button>
        </form>

        <p className={styles.footer}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login/email" className={styles.footerLink}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
