import type { ItemUsage } from "#modules/gallery-works/schema";

/** Each id as a group of its own, for a list whose items cover nothing but themselves. */
export function ownGroups(ids: ReadonlySet<string>): Map<string, Set<string>> {
  return new Map([...ids].map((id) => [id, new Set([id])]));
}

/**
 * How the works use each item of a gallery list, by its id. `groups` gives the ids each item
 * covers, itself among them (a section covers its subsections too); every id of the list has a
 * group. A work counts for an item when it names any id the item covers, and for `onlyCount` when
 * it names nothing else of the list, so removing the item would leave it with none. An id that is
 * not in the list, deleted since the work was saved, is not counted.
 */
export function usageByItem(
  worksIds: readonly (readonly string[])[],
  groups: ReadonlyMap<string, ReadonlySet<string>>,
): Record<string, ItemUsage> {
  const listed = worksIds.map((ids) => ids.filter((id) => groups.has(id)));
  const usages: Record<string, ItemUsage> = {};

  for (const [itemId, covered] of groups) {
    const usage: ItemUsage = { count: 0, onlyCount: 0 };

    for (const ids of listed) {
      if (!ids.some((id) => covered.has(id))) continue;

      usage.count += 1;
      if (ids.every((id) => covered.has(id))) usage.onlyCount += 1;
    }

    usages[itemId] = usage;
  }

  return usages;
}
