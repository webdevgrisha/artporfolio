import type { DocumentSnapshot } from "firebase-admin/firestore";

import { readWork } from "#modules/gallery/works/document";
import type { StoredWork } from "#modules/gallery/works/schema";

/** The latest month first; works of one month, the latest created first. */
function compareWorks(a: StoredWork, b: StoredWork): number {
  return b.year - a.year || b.month - a.month || b.createdAt.toMillis() - a.createdAt.toMillis();
}

/** The saved works in the order the site shows them. */
export function worksInOrder(docs: DocumentSnapshot[]): { id: string; work: StoredWork }[] {
  return docs
    .map((snapshot) => ({ id: snapshot.id, work: readWork(snapshot) }))
    .sort((a, b) => compareWorks(a.work, b.work));
}
