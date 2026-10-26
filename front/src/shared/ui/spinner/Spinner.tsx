import styles from "./Spinner.module.css";

interface SpinnerProps {
  /** Announces the spinner as a status. Omit it when the surrounding element describes the state. */
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  if (!label) {
    return <span className={styles.root} aria-hidden="true" />;
  }

  return <span className={styles.root} role="status" aria-label={label} />;
}
