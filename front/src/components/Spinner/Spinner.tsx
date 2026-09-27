import styles from "@/components/Spinner/Spinner.module.css";

interface SpinnerProps {
  label: string;
}

export function Spinner({ label }: SpinnerProps) {
  return <span className={styles.root} role="status" aria-label={label} />;
}
