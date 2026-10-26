import styles from "@/components/PageLoading/PageLoading.module.css";
import { Spinner } from "@/components/Spinner/Spinner";

export function PageLoading() {
  return (
    <main className={styles.root}>
      <Spinner label="Загрузка" />
    </main>
  );
}
