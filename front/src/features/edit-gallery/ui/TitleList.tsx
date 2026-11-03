import clsx from "clsx";
import React, { type ReactNode } from "react";

import { FieldError, FieldHint } from "@/shared/ui/field";

import styles from "./TitleList.module.css";

interface TitleListProps {
  /** The rows, each a TitleListRow. */
  children: ReactNode;
  /** Shown instead of the rows when there are none, e.g. «Материалов пока нет». */
  empty: string;
  /** An error of the whole list, e.g. too many rows. */
  error: string | undefined;
  /** Labels the list as a field label would, e.g. «Материалы». */
  heading: string;
  hint: string;
  isEmpty: boolean;
}

/** The saved and the added rows of a list of titles, under a heading that reads as a label. */
export function TitleList({ children, empty, error, heading, hint, isEmpty }: TitleListProps) {
  const headingId = React.useId();
  const hintId = React.useId();
  const errorId = React.useId();

  return (
    <section
      className={styles.list}
      aria-labelledby={headingId}
      aria-describedby={clsx(hintId, error && errorId)}
    >
      <h2 id={headingId} className={styles.heading}>
        {heading}
      </h2>
      <FieldHint id={hintId}>{hint}</FieldHint>
      {isEmpty ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={styles.rows}>{children}</ul>
      )}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </section>
  );
}
