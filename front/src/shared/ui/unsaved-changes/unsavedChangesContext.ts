import React from "react";

interface UnsavedChangesContextValue {
  /** Records whether the form with the id has unsaved changes. */
  setHasUnsavedChanges: (formId: string, hasUnsavedChanges: boolean) => void;
}

export const UnsavedChangesContext = React.createContext<UnsavedChangesContextValue | null>(null);

/**
 * Tells `UnsavedChangesProvider` whether this form has unsaved changes, so that leaving the page
 * asks first. A form that unmounts no longer has any.
 */
export function useReportUnsavedChanges(hasUnsavedChanges: boolean): void {
  const context = React.use(UnsavedChangesContext);

  if (!context) {
    throw new Error("useReportUnsavedChanges must be used inside UnsavedChangesProvider");
  }

  const { setHasUnsavedChanges } = context;
  const formId = React.useId();

  React.useEffect(() => {
    setHasUnsavedChanges(formId, hasUnsavedChanges);

    return () => setHasUnsavedChanges(formId, false);
  }, [formId, hasUnsavedChanges, setHasUnsavedChanges]);
}
