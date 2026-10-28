import React, { type SyntheticEvent } from "react";

import { Button } from "@/shared/ui/button";

import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  isOpen: boolean;
  /** Called on the cancel button and on Escape. */
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

/**
 * A modal confirmation on the native `<dialog>`, which provides the focus trap, the backdrop and
 * Escape handling. The cancel button gets the initial focus as the safe choice.
 */
export function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

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
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.root}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
    >
      <h2 className={styles.title} id={titleId}>
        {title}
      </h2>
      <p className={styles.description} id={descriptionId}>
        {description}
      </p>
      <div className={styles.actions}>
        {/* showModal() focuses the first focusable element, so the cancel button comes first. */}
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
