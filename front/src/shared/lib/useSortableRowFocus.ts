import React from "react";

/**
 * Where the focus goes once the items are updated: a button of a row, named in its `data-control`
 * inside the element with `data-item-id`, or another element, such as an add button.
 */
export type SortableFocusTarget =
  | { control: string; itemId: string }
  | { element: HTMLElement | null };

/**
 * Keeps the focus on a moved or removed row. The focused button can move or disappear with its
 * item, so it is focused again once the owner has updated the items.
 */
export function useSortableRowFocus<TList extends HTMLElement>() {
  const listRef = React.useRef<TList>(null);
  const targetRef = React.useRef<SortableFocusTarget>(undefined);

  // Runs after every render: the owner's update is the next one.
  React.useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    targetRef.current = undefined;
    if ("element" in target) {
      target.element?.focus();
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

  function focusAfterUpdate(target: SortableFocusTarget) {
    targetRef.current = target;
  }

  return { focusAfterUpdate, listRef };
}
