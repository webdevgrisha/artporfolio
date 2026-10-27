import React from "react";
import { EyeIcon, EyeOffIcon } from "@/shared/ui/icon";
import { Input, type InputProps } from "@/shared/ui/input";
import styles from "./PasswordInput.module.css";

interface PasswordInputProps extends Omit<InputProps, "endAdornment" | "type"> {
  hidePasswordLabel: string;
  label: string;
  showPasswordLabel: string;
}

export function PasswordInput({
  disabled,
  hidePasswordLabel,
  label,
  showPasswordLabel,
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <Input
      {...inputProps}
      disabled={disabled}
      label={label}
      type={isVisible ? "text" : "password"}
      endAdornment={
        <button
          className={styles.visibilityButton}
          type="button"
          disabled={disabled}
          aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((currentVisibility) => !currentVisibility)}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
