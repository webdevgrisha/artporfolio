import clsx from "clsx";
import type { FormEventHandler, ReactNode } from "react";

import { FormActions } from "@/shared/ui/form-actions";
import { useReportUnsavedChanges } from "@/shared/ui/unsaved-changes";

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
 * Leaving the page with unsaved changes asks first; a page may have several such forms.
 */
export function EditForm({
  children,
  className,
  hasUnsavedChanges,
  isSaving,
  onRevert,
  onSubmit,
}: EditFormProps) {
  useReportUnsavedChanges(hasUnsavedChanges);

  return (
    <form className={clsx(styles.root, className)} noValidate onSubmit={onSubmit}>
      {children}
      <FormActions
        className={styles.actions}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onRevert={onRevert}
      />
    </form>
  );
}
