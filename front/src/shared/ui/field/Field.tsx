import clsx from "clsx";
import type { MouseEventHandler, ReactNode } from "react";

import styles from "./Field.module.css";
import { FieldError } from "./FieldError";
import { FieldHint } from "./FieldHint";

interface FieldProps {
  /** The control. It takes `controlId` as its id and gets its look from `getFieldControlClassName`. */
  children: ReactNode;
  className?: string;
  controlId: string;
  error?: string;
  errorId: string;
  hint?: string;
  hintId: string;
  label: string;
  /** The id of the label, for a control that names its parts by it, such as a combobox. */
  labelId?: string;
  /**
   * Focuses a control that a label does not focus by itself, as it does a native one: a custom
   * select is a `div`.
   */
  onLabelClick?: MouseEventHandler<HTMLLabelElement>;
}

/** The label, the hint and the error message around a form control. */
export function Field({
  children,
  className,
  controlId,
  error,
  errorId,
  hint,
  hintId,
  label,
  labelId,
  onLabelClick,
}: FieldProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: a label takes no focus; the keyboard reaches its control directly. */}
      <label id={labelId} className={styles.label} htmlFor={controlId} onClick={onLabelClick}>
        {label}
      </label>
      {children}
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
