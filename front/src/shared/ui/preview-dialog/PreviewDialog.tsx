import React, { type MouseEvent, type ReactNode, type SyntheticEvent } from "react";

import { CloseIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./PreviewDialog.module.css";

const closeLabel = "Закрыть";

interface PreviewDialogProps {
  /** What to show large, such as an image. Rendered only while the dialog is open. */
  children: ReactNode;
  isOpen: boolean;
  /** Called on the close button, on Escape and on a click outside the content. */
  onClose: () => void;
  title: string;
}

/**
 * A modal for viewing content in full, on the native `<dialog>`: it traps the focus and returns
 * it to the opening control when it closes.
 */
export function PreviewDialog({ children, isOpen, onClose, title }: PreviewDialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Escape closes the dialog natively; the parent owns the open state, so it decides instead.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

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
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {isOpen ? (
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
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
