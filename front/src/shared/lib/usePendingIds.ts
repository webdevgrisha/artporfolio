import { type MutationKey, useMutationState } from "@tanstack/react-query";

/**
 * The ids of the items that the pending mutations with the key work on, such as the works being
 * deleted; the variables of each mutation name its item by `id`.
 */
export function usePendingIds(mutationKey: MutationKey): readonly string[] {
  return useMutationState({
    filters: { mutationKey, status: "pending" },
    select: (mutation) => (mutation.state.variables as { id: string }).id,
  });
}
