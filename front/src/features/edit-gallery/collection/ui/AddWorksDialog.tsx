import React from "react";
import { createPortal } from "react-dom";

import { useModalDialog } from "@/shared/lib/useModalDialog";
import { AddWorksChoice, type AddWorksChoiceProps } from "./AddWorksChoice";
import styles from "./AddWorksDialog.module.css";

interface AddWorksDialogProps extends AddWorksChoiceProps {
  isOpen: boolean;
}

/**
 * Chooses works to add to a collection, by checkboxes, with a search in the titles. A work of
 * another collection is not offered: it moves in its own form.
 */
export function AddWorksDialog({ isOpen, ...choiceProps }: AddWorksDialogProps) {
  const { dialogRef, handleCancel } = useModalDialog(isOpen, choiceProps.onCancel);
  const titleId = React.useId();

  // In a portal: the dialog opens from a form, and inside it the search would belong to that form,
  // so Enter in the search would submit it. The dialog stays mounted, so closing it returns the
  // focus; its content is there only while it is open, so a closed dialog loads no thumbnails and
  // the choice starts empty each time it opens.
  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.root}
      aria-labelledby={titleId}
      onCancel={handleCancel}
    >
      <h2 className={styles.title} id={titleId}>
        Добавить работы
      </h2>
      {isOpen ? <AddWorksChoice {...choiceProps} /> : null}
    </dialog>,
    document.body,
  );
}
