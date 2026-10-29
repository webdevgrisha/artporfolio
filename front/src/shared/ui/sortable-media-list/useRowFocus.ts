import React from "react";

import type { RowControl } from "./SortableMediaRow";

/** Where the focus goes once the items are updated: a control of a row, or the add button. */
export type FocusTarget = { control: RowControl; itemId: string } | "add";

/**
 * Keeps the focus on a moved or removed row. The focused button can move or disappear with its
 * item, so it is focused again once the owner has updated the items.
 */
export function useRowFocus() {
  const listRef = React.useRef<HTMLUListElement>(null);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const targetRef = React.useRef<FocusTarget>(undefined);

  // Runs after every render: the owner's update is the next one.
  React.useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    targetRef.current = undefined;
    if (target === "add") {
      addButtonRef.current?.focus();
      return;
    }

    const row = listRef.current?.querySelector(`[data-item-id="${CSS.escape(target.itemId)}"]`);
    const button = row?.querySelector<HTMLButtonElement>(
      `[data-control="${target.control}"]:not(:disabled)`,
    );
    // An arrow is disabled at the end of the list: the other one takes the focus.
    const fallback = row?.querySelector<HTMLButtonElement>('[data-control^="move"]:not(:disabled)');
    (button ?? fallback)?.focus();
  });

  function focusAfterUpdate(target: FocusTarget) {
    targetRef.current = target;
  }

  return { addButtonRef, focusAfterUpdate, listRef };
}
