import type { WorkUsage } from "@/entities/gallery";
import { useConfirmation } from "@/shared/lib/useConfirmation";

/** The row waiting for the confirmation of its removal, and how the works use it. */
interface PendingRemoval {
  index: number;
  usage: WorkUsage;
}

/**
 * The removal of a row of a list that works name: a row no work names goes at once, another after
 * a confirmation, shown while `pending` is set.
 */
export function useRowRemoval(remove: (index: number) => void) {
  const { ask, cancel, confirm, pending } = useConfirmation<PendingRemoval>(({ index }) =>
    remove(index),
  );

  return {
    cancel,
    confirm,
    pending,
    /** Removes the row, or asks first if any work names it. */
    request(index: number, usage: WorkUsage) {
      if (usage.count === 0) {
        remove(index);
      } else {
        ask({ index, usage });
      }
    },
  };
}
