import Header from "./Header";
import UploadProgressProvider from "./UploadProgressContext";
import styles from "./app-shell.module.css";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UploadProgressProvider>
      <div className={styles.shell}>
        <Header />
        <main className={styles.main}>{children}</main>
      </div>
    </UploadProgressProvider>
  );
}
