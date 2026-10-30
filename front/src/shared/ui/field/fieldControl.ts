import clsx from "clsx";
import React from "react";

import styles from "./Field.module.css";

interface FieldIdsParams {
  "aria-describedby"?: string;
  error?: string;
  hint?: string;
  id?: string;
}

/**
 * Ids that link a control to its label, hint and error, keeping a description passed by the
 * caller. The hint is read before the error.
 */
export function useFieldIds({
  "aria-describedby": ariaDescribedBy,
  error,
  hint,
  id,
}: FieldIdsParams) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const describedBy = [ariaDescribedBy, hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return { controlId, describedBy: describedBy || undefined, errorId, hintId };
}

/**
 * The frame shared by text controls: border, placeholder, focus, disabled, and the modified and
 * invalid states. An invalid control is marked with `aria-invalid`.
 */
export function getFieldControlClassName(isModified: boolean): string {
  return clsx(styles.control, isModified && styles.controlModified);
}
