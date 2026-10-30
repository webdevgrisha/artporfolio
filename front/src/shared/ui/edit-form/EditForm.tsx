import clsx from "clsx";
import type { FormEventHandler, ReactNode } from "react";

import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { FormActions } from "@/shared/ui/form-actions";
import { useReportUnsavedChanges } from "@/shared/ui/unsaved-changes";

import styles from "./EditForm.module.css";

/** A save refused because the data changed since the form read it, e.g. in another tab. */
interface EditFormConflict {
  isOpen: boolean;
  /** Keeps the changes in the form; saving them would be refused again. */
  onKeep: () => void;
  /** Drops the changes and shows the data as it is now. */
  onTakeLatest: () => void;
}

export interface EditFormProps {
  /** The fields. */
  children: ReactNode;
  className?: string;
  conflict: EditFormConflict;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  /** Brings back the saved values. */
  onRevert: () => void;
  /** Usually react-hook-form's `handleSubmit`; the schema validates, not the browser. */
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/**
 * A form that edits saved data: the fields, then the revert and save buttons at the bottom.
 * Leaving the page with unsaved changes asks first; a page may have several such forms. Its props,
 * but the fields, come from `useSavedForm`.
 */
export function EditForm({
  children,
  className,
  conflict,
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
      <ConfirmDialog
        isOpen={conflict.isOpen}
        title="Данные изменили в другой вкладке"
        description="Загрузить актуальную версию? Несохранённые изменения на этой странице пропадут."
        cancelLabel="Оставить мои"
        confirmLabel="Загрузить"
        onCancel={conflict.onKeep}
        onConfirm={conflict.onTakeLatest}
      />
    </form>
  );
}
