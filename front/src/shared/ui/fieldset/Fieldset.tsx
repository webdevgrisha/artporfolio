import clsx from "clsx";
import type { ReactNode } from "react";

import { FieldError, FieldHint, useFieldIds } from "@/shared/ui/field";

import styles from "./Fieldset.module.css";

interface FieldsetProps {
  /** The controls of the group. */
  children: ReactNode;
  className?: string;
  /** Disables every control inside, as a native fieldset does. */
  disabled?: boolean;
  error?: string;
  /** A short explanation under the controls. */
  hint?: string;
  /** Names the group, in the look of the label of a field. */
  legend: string;
}

/** A group of controls named by its legend, with its hint and error, as a Field is for one. */
export function Fieldset({ children, className, disabled, error, hint, legend }: FieldsetProps) {
  const { describedBy, errorId, hintId } = useFieldIds({ error, hint });

  return (
    <fieldset
      className={clsx(styles.root, className)}
      disabled={disabled}
      aria-describedby={describedBy}
    >
      <legend className={styles.legend}>{legend}</legend>
      {children}
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
