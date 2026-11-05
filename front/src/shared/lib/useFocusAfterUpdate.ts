import React from "react";

/**
 * Moves the focus once the owner has updated what is on the page: the focused button may move or
 * disappear with its row, so `focusAfterUpdate` keeps how to focus for the next render.
 */
export function useFocusAfterUpdate() {
  const focusRef = React.useRef<() => void>(undefined);

  // Runs after every render: the owner's update is the next one.
  React.useLayoutEffect(() => {
    const focus = focusRef.current;

    focusRef.current = undefined;
    focus?.();
  });

  return function focusAfterUpdate(focus: () => void) {
    focusRef.current = focus;
  };
}
