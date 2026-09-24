import type { ComponentPropsWithRef } from "react";

import styles from "@/components/Input/Input.module.css";

interface InputProps extends ComponentPropsWithRef<"input"> {
  label: string;
}

export function Input({ label, ref, ...inputProps }: InputProps) {
  return (
    <label className={styles.root}>
      <span className={styles.label}>{label}</span>
      <input ref={ref} className={styles.control} {...inputProps} />
    </label>
  );
}
