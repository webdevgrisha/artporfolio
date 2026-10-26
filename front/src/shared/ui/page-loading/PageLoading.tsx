import { Spinner } from "@/shared/ui/spinner";
import styles from "./PageLoading.module.css";

export function PageLoading() {
  return (
    <main className={styles.root}>
      <Spinner label="Загрузка" />
    </main>
  );
}
