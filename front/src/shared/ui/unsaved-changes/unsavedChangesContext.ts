import React from "react";

interface UnsavedChangesContextValue {
  /** Lets the next navigation go to the path without asking, once. */
  allowNextNavigation: (pathname: string) => void;
  /** Records whether the form with the id has unsaved changes. */
  setHasUnsavedChanges: (formId: string, hasUnsavedChanges: boolean) => void;
}

export const UnsavedChangesContext = React.createContext<UnsavedChangesContextValue | null>(null);

function useUnsavedChangesContext(hookName: string): UnsavedChangesContextValue {
  const context = React.use(UnsavedChangesContext);

  if (!context) {
    throw new Error(`${hookName} must be used inside UnsavedChangesProvider`);
  }

  return context;
}

/**
 * Tells `UnsavedChangesProvider` whether this form has unsaved changes, so that leaving the page
 * asks first. A form that unmounts no longer has any.
 */
export function useReportUnsavedChanges(hasUnsavedChanges: boolean): void {
  const { setHasUnsavedChanges } = useUnsavedChangesContext("useReportUnsavedChanges");
  const formId = React.useId();

  React.useEffect(() => {
    setHasUnsavedChanges(formId, hasUnsavedChanges);

    return () => setHasUnsavedChanges(formId, false);
  }, [formId, hasUnsavedChanges, setHasUnsavedChanges]);
}

/**
 * For a form that navigates once it is saved: its changes are saved, but they are reported as
 * unsaved until it renders again. Call the returned function with the path right before navigating
 * there.
 */
export function useAllowNextNavigation(): (pathname: string) => void {
  return useUnsavedChangesContext("useAllowNextNavigation").allowNextNavigation;
}
