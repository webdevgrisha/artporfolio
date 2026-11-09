import { useNavigation } from "react-router";

import styles from "./NavigationProgress.module.css";

/**
 * A bar over the top of the admin while the next page opens: its code comes before it can show,
 * and its data for a moment; data that takes longer comes under a skeleton.
 */
export function NavigationProgress() {
  const navigation = useNavigation();

  if (navigation.state === "idle") return null;

  return <div className={styles.root} role="progressbar" aria-label="Загрузка страницы" />;
}
