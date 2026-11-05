import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./WorksList.module.css";

interface NoValueProps {
  /** What a screen reader hears instead of «тире». */
  label: string;
}

/** A muted dash for a value a work doesn't have, so the cell doesn't read as not loaded. */
export function NoValue({ label }: NoValueProps) {
  return (
    <>
      <span className={styles.muted} aria-hidden="true">
        —
      </span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </>
  );
}
