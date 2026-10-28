import React, { type MouseEvent, type ReactNode } from "react";

import { useModalDialog } from "@/shared/lib/useModalDialog";
import { CloseIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./PreviewDialog.module.css";

const closeLabel = "Закрыть";

interface PreviewDialogProps {
  /** What to show large, such as an image. Rendered only while the dialog is open. */
  children: ReactNode;
  /** A short line under the title, such as the image size. */
  description?: string;
  isOpen: boolean;
  /** Called on the close button, on Escape and on a click outside the content. */
  onClose: () => void;
  title: string;
}

/**
 * A modal for viewing content in full, on the native `<dialog>`: it traps the focus and returns
 * it to the opening control when it closes.
 */
export function PreviewDialog({
  children,
  description,
  isOpen,
  onClose,
  title,
}: PreviewDialogProps) {
  const { dialogRef, handleCancel } = useModalDialog(isOpen, onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();

  // showModal() focuses the close button. The content is what was opened, so the dialog itself
  // takes the focus instead: screen readers start from the title, and Tab reaches the button.
  React.useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [dialogRef, isOpen]);

  // The content fills the dialog, so only a click on the backdrop reaches the dialog itself.
  // Keyboard users close it with Escape or the close button.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape and the close button cover the keyboard.
    <dialog
      ref={dialogRef}
      className={styles.root}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {isOpen ? (
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <h2 className={styles.title} id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className={styles.description} id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
            <Tooltip content={closeLabel}>
              <IconButton label={closeLabel} onClick={onClose}>
                <CloseIcon className={styles.closeIcon} />
              </IconButton>
            </Tooltip>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
