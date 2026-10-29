import clsx from "clsx";
import type { FormEventHandler, ReactNode } from "react";

import { FormActions } from "@/shared/ui/form-actions";
import { UnsavedChangesDialog } from "@/shared/ui/unsaved-changes-dialog";

import styles from "./EditForm.module.css";

interface EditFormProps {
  /** The fields. */
  children: ReactNode;
  className?: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  /** Brings back the saved values. */
  onRevert: () => void;
  /** Usually react-hook-form's `handleSubmit`; the schema validates, not the browser. */
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/**
 * A form that edits saved data: the fields, then the revert and save buttons at the bottom.
 * Leaving the page with unsaved changes asks first, so a page has one such form.
 */
export function EditForm({
  children,
  className,
  hasUnsavedChanges,
  isSaving,
  onRevert,
  onSubmit,
}: EditFormProps) {
  return (
    <form className={clsx(styles.root, className)} noValidate onSubmit={onSubmit}>
      {children}
      <FormActions
        className={styles.actions}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onRevert={onRevert}
      />
      <UnsavedChangesDialog hasUnsavedChanges={hasUnsavedChanges} />
    </form>
  );
}
