import clsx from "clsx";
import type { FormEventHandler, ReactNode } from "react";

import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { FormActions } from "@/shared/ui/form-actions";
import { useReportUnsavedChanges } from "@/shared/ui/unsaved-changes";

import styles from "./EditForm.module.css";

/**
 * A save refused with 412: the data changed since the form read it, e.g. in another tab, or a form
 * that creates data finds it already saved, by an earlier try whose response was lost.
 */
export interface EditFormConflict {
  isOpen: boolean;
  /** `changed` by default; `exists` for a form that creates the data. */
  reason?: "changed" | "exists";
  /**
   * Closes the question and keeps the changes in the form, so they can be copied before the latest
   * version is taken; saving them would be refused again.
   */
  onKeep: () => void;
  /** Drops the changes and shows the data as it is now. */
  onTakeLatest: () => void;
}

const conflictTexts = {
  changed: {
    confirmLabel: "Загрузить",
    description:
      "Ваши изменения сохранить нельзя: их нужно внести заново в актуальную версию. Чтобы не набирать текст снова, скопируйте его, затем ещё раз нажмите «Сохранить» и «Загрузить».",
    title: "Данные изменили в другой вкладке",
  },
  exists: {
    confirmLabel: "Открыть",
    description:
      "Прошлая попытка уже сохранила эти данные, но ответ сервера не дошёл. Откройте сохранённую версию и, если в форме есть изменения после той попытки, внесите их заново. Чтобы не набирать текст снова, скопируйте его, затем ещё раз нажмите «Сохранить» и «Открыть».",
    title: "Это уже сохранено",
  },
} satisfies Record<NonNullable<EditFormConflict["reason"]>, object>;

export interface EditFormProps {
  /** The fields. */
  children: ReactNode;
  className?: string;
  /** The question after a save refused with 412, from `useSavedForm` or `useCreateConflict`. */
  conflict?: EditFormConflict;
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
      {conflict && (
        <ConfirmDialog
          isOpen={conflict.isOpen}
          {...conflictTexts[conflict.reason ?? "changed"]}
          cancelLabel="Не сейчас"
          onCancel={conflict.onKeep}
          onConfirm={conflict.onTakeLatest}
        />
      )}
    </form>
  );
}
