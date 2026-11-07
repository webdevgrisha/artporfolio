import type { DocumentSnapshot, Transaction } from "firebase-admin/firestore";

import type { Reader } from "#modules/auth/schema";
import { worksCollection } from "#modules/gallery/works/document";
import { worksInOrder } from "#modules/gallery/works/order";
import { isVisibleTo } from "#modules/gallery/works/visibility";
import { UnprocessableContentError } from "#shared/http/errors";

/** The works of the collection `id`: each work names the collection it is in. */
export function membersQuery(id: string) {
  return worksCollection().where("collectionId", "==", id);
}

/** The ids of the works `reader` sees in the order the site shows them; the admin sees them all. */
export function idsInOrder(docs: DocumentSnapshot[], reader: Reader): string[] {
  return worksInOrder(docs)
    .filter(({ work }) => isVisibleTo(work, reader))
    .map(({ id }) => id);
}

/**
 * The works `ids` of the collection `collectionId` in the order the site shows them. Rejects with
 * 422 a work that does not exist, such as one deleted while the page was open, and a work of another
 * collection: the If-Match of this collection says nothing about that one, so a form opened earlier
 * would take the work away without having seen where it went. A work moves in its own form.
 */
export async function readMembers(
  transaction: Transaction,
  collectionId: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) {
    return [];
  }

  const snapshots = await transaction.getAll(...ids.map((id) => worksCollection().doc(id)));
  const missing = snapshots.find((snapshot) => !snapshot.exists);

  if (missing) {
    throw new UnprocessableContentError(`There is no work ${missing.id}`);
  }

  const works = worksInOrder(snapshots);
  const taken = works.find(
    ({ work }) => work.collectionId !== null && work.collectionId !== collectionId,
  );

  if (taken) {
    throw new UnprocessableContentError(`The work ${taken.id} is in another collection`);
  }

  return works.map(({ id }) => id);
}

/**
 * Puts the works `next` in the collection `id` and takes out those of `current` left out. The date
 * a work was saved stays: the admin did not edit the work itself.
 */
export function moveWorks(
  transaction: Transaction,
  id: string,
  current: string[],
  next: string[],
): void {
  const previous = new Set(current);
  const kept = new Set(next);

  for (const workId of next.filter((workId) => !previous.has(workId))) {
    transaction.update(worksCollection().doc(workId), { collectionId: id });
  }

  for (const workId of current.filter((workId) => !kept.has(workId))) {
    transaction.update(worksCollection().doc(workId), { collectionId: null });
  }
}
