import { TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input, type InputProps } from "@/shared/ui/input";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./ClearableInput.module.css";

interface ClearableInputProps extends Omit<InputProps, "endAdornment"> {
  clearLabel: string;
  /** Whether the input has a value; the clear button is shown only then. */
  hasValue: boolean;
  /**
   * Empties the value. The caller owns the value, so it also moves the focus back to the input:
   * the button disappears together with the value.
   */
  onClear: () => void;
}

export function ClearableInput({
  clearLabel,
  disabled,
  hasValue,
  onClear,
  ...inputProps
}: ClearableInputProps) {
  return (
    <Input
      {...inputProps}
      disabled={disabled}
      endAdornment={
        hasValue ? (
          <Tooltip className={styles.clearTooltip} content={clearLabel}>
            <IconButton
              className={styles.clearButton}
              label={clearLabel}
              disabled={disabled}
              onClick={onClear}
            >
              <TrashIcon className={styles.clearIcon} />
            </IconButton>
          </Tooltip>
        ) : null
      }
    />
  );
}
