import React from "react";

import type { WorkUsage } from "./workUsage";

/** The row waiting for the confirmation of its removal, and how the works use it. */
interface PendingRemoval {
  index: number;
  usage: WorkUsage;
}

interface UseRowRemovalParams {
  /** Removes the row from the form. */
  remove: (index: number) => void;
  /** Moves the focus once the row has gone, unless `remove` sees to it. */
  onRemoved?: () => void;
}

/**
 * The removal of a row of a list that works name: a row no work names goes at once, another after
 * a confirmation, shown while `pending` is set. The focus moves once the row has gone and the
 * confirmation has closed, since the page is inert while it is open.
 */
export function useRowRemoval({ onRemoved, remove }: UseRowRemovalParams) {
  const [pending, setPending] = React.useState<PendingRemoval>();
  const isRemoved = React.useRef(false);

  // After every render: the confirmation, a child, has closed by then in its own effect.
  React.useEffect(() => {
    if (isRemoved.current) {
      isRemoved.current = false;
      onRemoved?.();
    }
  });

  function removeNow(index: number) {
    remove(index);
    isRemoved.current = true;
  }

  return {
    pending,
    /** Removes the row, or asks first if any work names it. */
    request(index: number, usage: WorkUsage) {
      if (usage.count === 0) {
        removeNow(index);
      } else {
        setPending({ index, usage });
      }
    },
    confirm() {
      if (pending) removeNow(pending.index);
      setPending(undefined);
    },
    cancel() {
      setPending(undefined);
    },
  };
}
