import React from "react";
import { useBlocker } from "react-router";

/**
 * Stops leaving a page with unsaved changes. Navigation inside the app is held until `leave` or
 * `stay` is called, so the page can ask in its own dialog; closing or reloading the tab gets the
 * browser's own prompt.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  React.useEffect(() => {
    if (!hasUnsavedChanges) return;

    function preventUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", preventUnload);

    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [hasUnsavedChanges]);

  // The changes may be saved or reverted while the navigation is held; nothing is left to lose.
  React.useEffect(() => {
    if (blocker.state === "blocked" && !hasUnsavedChanges) {
      blocker.reset();
    }
  }, [blocker, hasUnsavedChanges]);

  return {
    isBlocked: blocker.state === "blocked",
    leave: () => blocker.proceed?.(),
    stay: () => blocker.reset?.(),
  };
}
