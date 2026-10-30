import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

interface UnsavedChangesDialogProps {
  hasUnsavedChanges: boolean;
}

/** Asks before leaving a page with unsaved changes. `UnsavedChangesProvider` renders it once. */
export function UnsavedChangesDialog({ hasUnsavedChanges }: UnsavedChangesDialogProps) {
  const guard = useUnsavedChangesGuard(hasUnsavedChanges);

  return (
    <ConfirmDialog
      isOpen={guard.isBlocked}
      title="Уйти без сохранения?"
      description="Несохранённые изменения будут потеряны."
      cancelLabel="Остаться"
      confirmLabel="Уйти"
      onCancel={guard.stay}
      onConfirm={guard.leave}
    />
  );
}
