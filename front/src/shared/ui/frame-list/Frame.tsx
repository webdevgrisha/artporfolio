import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./FrameList.module.css";

interface FrameProps {
  children: ReactNode;
  /** Sizes the frame, such as its largest height, past which its content scrolls. */
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Highlights a choice that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
}

/**
 * The frame of a list of choices, in the states of the text fields. Its content scrolls inside
 * once the frame reaches its height, and the scroll stops at its ends instead of moving the page.
 */
export function Frame({
  children,
  className,
  disabled = false,
  invalid = false,
  isModified = false,
}: FrameProps) {
  return (
    <div
      className={clsx(
        styles.frame,
        isModified && styles.frameModified,
        invalid && styles.frameInvalid,
        disabled && styles.frameDisabled,
        className,
      )}
    >
      <div className={styles.scroller}>{children}</div>
    </div>
  );
}
