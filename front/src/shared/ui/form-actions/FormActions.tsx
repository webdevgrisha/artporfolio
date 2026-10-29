import clsx from "clsx";
import React from "react";

import { Button } from "@/shared/ui/button";
import { ArrowLeftIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Spinner } from "@/shared/ui/spinner";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./FormActions.module.css";

const revertLabel = "Отменить изменения";

interface FormActionsProps {
  className?: string;
  /** Shows the revert button. */
  hasUnsavedChanges: boolean;
  /** Disables the buttons and shows a spinner in the save button. */
  isSaving: boolean;
  /** Brings back the saved values. */
  onRevert: () => void;
}

/** The revert and save buttons of an edit form. The save button submits the form around it. */
export function FormActions({
  className,
  hasUnsavedChanges,
  isSaving,
  onRevert,
}: FormActionsProps) {
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);

  function revert() {
    onRevert();
    // The revert button disappears together with the changes, so the focus moves to its neighbour.
    saveButtonRef.current?.focus();
  }

  return (
    <div className={clsx(styles.root, className)}>
      {hasUnsavedChanges ? (
        <Tooltip content={revertLabel}>
          <IconButton label={revertLabel} disabled={isSaving} onClick={revert}>
            <ArrowLeftIcon />
          </IconButton>
        </Tooltip>
      ) : null}
      <Button
        ref={saveButtonRef}
        className={styles.saveButton}
        type="submit"
        disabled={isSaving}
        aria-busy={isSaving}
      >
        {isSaving ? (
          <>
            <Spinner />
            <VisuallyHidden>Сохранение</VisuallyHidden>
          </>
        ) : (
          "Сохранить"
        )}
      </Button>
    </div>
  );
}
