import React from "react";

import { EyeIcon, EyeOffIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input, type InputProps } from "@/shared/ui/input";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./PasswordInput.module.css";

interface PasswordInputProps extends Omit<InputProps, "endAdornment" | "type"> {
  hidePasswordLabel: string;
  showPasswordLabel: string;
}

export function PasswordInput({
  disabled,
  hidePasswordLabel,
  showPasswordLabel,
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  // The label says what the button does next, so it is not also marked as pressed.
  const toggleLabel = isVisible ? hidePasswordLabel : showPasswordLabel;

  return (
    <Input
      {...inputProps}
      disabled={disabled}
      type={isVisible ? "text" : "password"}
      endAdornment={
        <Tooltip className={styles.visibilityTooltip} content={toggleLabel}>
          <IconButton
            className={styles.visibilityButton}
            label={toggleLabel}
            disabled={disabled}
            onClick={() => setIsVisible((currentVisibility) => !currentVisibility)}
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </IconButton>
        </Tooltip>
      }
    />
  );
}
