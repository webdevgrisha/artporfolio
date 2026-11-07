import type { Reader } from "#modules/auth/schema";
import type { StoredWork } from "#modules/gallery/works/schema";

/** Whether `reader` sees the work: a hidden work is the admin's alone. */
export function isVisibleTo(work: StoredWork, reader: Reader): boolean {
  return work.published || reader === "admin";
}
