import type { ReactNode } from "react";

import styles from "./VisuallyHidden.module.css";

interface VisuallyHiddenProps {
  /** The element to render, so hidden text can keep its semantics, e.g. a page heading. */
  as?: "h1" | "h2" | "p" | "span";
  children: ReactNode;
}

/** Hides content visually but keeps it available to screen readers. */
export function VisuallyHidden({ as: Element = "span", children }: VisuallyHiddenProps) {
  return <Element className={styles.root}>{children}</Element>;
}
