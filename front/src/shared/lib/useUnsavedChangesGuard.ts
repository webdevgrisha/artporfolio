import React from "react";
import { useBlocker } from "react-router";

/**
 * Stops leaving a page with unsaved changes. Navigation inside the app is held until `leave` or
 * `stay` is called, so the page can ask in its own dialog; closing or reloading the tab gets the
 * browser's own prompt.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  // The path the next navigation may go to without asking; any navigation clears it.
  const allowedPathname = React.useRef<string>(undefined);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const isAllowed = allowedPathname.current === nextLocation.pathname;
    allowedPathname.current = undefined;

    return hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname && !isAllowed;
  });

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

  /**
   * Lets the next navigation go to `pathname` without asking: a save that navigates itself, such
   * as opening a project once it is created, has saved the changes, but the guard would learn it
   * only on a later render. Only that one navigation is let through.
   */
  const allowNextNavigation = React.useCallback((pathname: string) => {
    allowedPathname.current = pathname;
  }, []);

  return {
    allowNextNavigation,
    isBlocked: blocker.state === "blocked",
    leave: () => blocker.proceed?.(),
    stay: () => blocker.reset?.(),
  };
}
