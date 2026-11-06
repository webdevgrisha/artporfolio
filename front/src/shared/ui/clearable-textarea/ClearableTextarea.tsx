import { TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Textarea, type TextareaProps } from "@/shared/ui/textarea";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./ClearableTextarea.module.css";

interface ClearableTextareaProps extends Omit<TextareaProps, "endAdornment"> {
  clearLabel: string;
  /** Whether the textarea has a value; the clear button is shown only then. */
  hasValue: boolean;
  /**
   * Empties the value. The caller owns the value, so it also moves the focus back to the textarea:
   * the button disappears together with the value.
   */
  onClear: () => void;
}

export function ClearableTextarea({
  clearLabel,
  disabled,
  hasValue,
  onClear,
  ...textareaProps
}: ClearableTextareaProps) {
  return (
    <Textarea
      {...textareaProps}
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
