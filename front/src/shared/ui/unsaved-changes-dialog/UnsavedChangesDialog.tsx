import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

interface UnsavedChangesDialogProps {
  hasUnsavedChanges: boolean;
}

/**
 * Asks before leaving a page with unsaved changes. React Router allows one blocker at a time, so a
 * page renders one.
 */
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
