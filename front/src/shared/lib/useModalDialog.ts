import React, { type SyntheticEvent } from "react";

/**
 * Shows a native `<dialog>` as a modal while `isOpen` is true. The browser provides the focus
 * trap, the backdrop and the return of the focus. Escape would close the dialog natively; the
 * owner keeps the open state, so it gets `onCancel` and decides instead.
 */
export function useModalDialog(isOpen: boolean, onCancel: () => void) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onCancel();
  }

  return { dialogRef, handleCancel };
}
