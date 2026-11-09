import React, { type ReactNode } from "react";

import styles from "./WorkFields.module.css";

interface WorkFieldGroupProps {
  /** The fields. */
  children: ReactNode;
  title: string;
}

/** Fields of a work form under their heading. */
export function WorkFieldGroup({ children, title }: WorkFieldGroupProps) {
  const headingId = React.useId();

  return (
    <section className={styles.group} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}
