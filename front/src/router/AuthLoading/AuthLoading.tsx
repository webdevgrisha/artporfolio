import { Spinner } from "@/components/Spinner/Spinner";
import styles from "@/router/AuthLoading/AuthLoading.module.css";

export function AuthLoading() {
  return (
    <main className={styles.root}>
      <Spinner label="Проверка авторизации" />
    </main>
  );
}
