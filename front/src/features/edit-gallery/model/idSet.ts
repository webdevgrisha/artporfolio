/**
 * Ids a form holds as a set, such as the sections of a work, in one order whatever the order of
 * the choices: unchecking an id and checking it again then leaves the form unchanged. The order is
 * only for comparing; the lists show the ids in their own order.
 */
export function toIdSet(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort();
}
