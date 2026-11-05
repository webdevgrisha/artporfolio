import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./FrameList.module.css";

interface ChildrenProps {
  children: ReactNode;
  className?: string;
}

/** The list inside a Frame. */
export function FrameList({ children, className }: ChildrenProps) {
  return <ul className={clsx(styles.list, className)}>{children}</ul>;
}

/** An item of a FrameList, divided from the one before it by a line within the padding. */
export function FrameListItem({ children, className }: ChildrenProps) {
  return <li className={clsx(styles.item, className)}>{children}</li>;
}

/** A line of a frame: its parts in a row, highlighted under the pointer. */
export function FrameRow({ children, className }: ChildrenProps) {
  return <div className={clsx(styles.row, className)}>{children}</div>;
}

interface FrameRowLabelProps {
  children: ReactNode;
  /** The control of the row, such as its checkbox, which a click anywhere in the row toggles. */
  htmlFor: string;
}

/** The title of a FrameRow, as the label of its control; it covers the whole row. */
export function FrameRowLabel({ children, htmlFor }: FrameRowLabelProps) {
  return (
    <label className={styles.rowLabel} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

/** Shown in a Frame instead of its list while there is nothing in it. */
export function FrameEmpty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
