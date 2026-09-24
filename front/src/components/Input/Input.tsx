import clsx from "clsx";
import React, { type ComponentPropsWithRef, type ReactNode } from "react";

import styles from "@/components/Input/Input.module.css";

interface InputProps extends ComponentPropsWithRef<"input"> {
  endAdornment?: ReactNode;
  label: string;
}

export function Input({ endAdornment, id, label, ref, ...inputProps }: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const controlClassName = clsx(styles.control, {
    [styles.controlWithAdornment]: Boolean(endAdornment),
  });

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input ref={ref} id={inputId} className={controlClassName} {...inputProps} />
      {endAdornment ? <div className={styles.endAdornment}>{endAdornment}</div> : null}
    </div>
  );
}
