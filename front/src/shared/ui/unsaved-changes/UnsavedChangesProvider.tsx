import React, { type ReactNode } from "react";

import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

import { UnsavedChangesContext } from "./unsavedChangesContext";

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

/**
 * Asks before leaving a page while any form inside has unsaved changes; the forms report them with
 * `useReportUnsavedChanges`. React Router allows one blocker at a time, so the app renders one
 * provider around its pages, however many forms a page has.
 */
export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [formsWithChanges, setFormsWithChanges] = React.useState<ReadonlySet<string>>(new Set());
  const guard = useUnsavedChangesGuard(formsWithChanges.size > 0);
  const { allowNextNavigation } = guard;

  const setHasUnsavedChanges = React.useCallback((formId: string, hasUnsavedChanges: boolean) => {
    setFormsWithChanges((forms) => {
      if (forms.has(formId) === hasUnsavedChanges) return forms;

      const nextForms = new Set(forms);
      if (hasUnsavedChanges) {
        nextForms.add(formId);
      } else {
        nextForms.delete(formId);
      }

      return nextForms;
    });
  }, []);
  const contextValue = React.useMemo(
    () => ({ allowNextNavigation, setHasUnsavedChanges }),
    [allowNextNavigation, setHasUnsavedChanges],
  );

  return (
    <UnsavedChangesContext value={contextValue}>
      {children}
      <ConfirmDialog
        isOpen={guard.isBlocked}
        title="Уйти без сохранения?"
        description="Несохранённые изменения будут потеряны."
        cancelLabel="Остаться"
        confirmLabel="Уйти"
        onCancel={guard.stay}
        onConfirm={guard.leave}
      />
    </UnsavedChangesContext>
  );
}
