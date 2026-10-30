import React, { type ReactNode } from "react";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
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
  const contextValue = React.useMemo(() => ({ setHasUnsavedChanges }), [setHasUnsavedChanges]);

  return (
    <UnsavedChangesContext value={contextValue}>
      {children}
      <UnsavedChangesDialog hasUnsavedChanges={formsWithChanges.size > 0} />
    </UnsavedChangesContext>
  );
}
