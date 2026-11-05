import {
  type DocumentSnapshot,
  type QuerySnapshot,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";

import type { Reader } from "#modules/auth/schema";
import { collectionDocument, collectionsCollection } from "#modules/gallery-collections/document";
import {
  type Collection,
  type CollectionBody,
  type StoredCollection,
  storedCollectionSchema,
} from "#modules/gallery-collections/schema";
import { isVisibleTo, worksCollection, worksInOrder } from "#modules/gallery-works/service";
import { firestore } from "#shared/firebase/firestore";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { toPhoto } from "#shared/images/photo";
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/storage";
import { publishUpload } from "#shared/images/uploads";
import { byTitle, titleKey } from "#shared/text/titles";

/** A saved collection with the id it is known by. */
export interface SavedCollection extends Tagged<Collection> {
  id: string;
}

/** Every file of the collection; deleting the collection removes the folder. */
function collectionFolder(id: string): string {
  return `galleryCollections/${id}`;
}

/** The cover keeps one subfolder per uploaded version. */
function coverFolder(id: string): string {
  return `${collectionFolder(id)}/cover`;
}

function coverVersionFolder(id: string, version: string): string {
  return `${coverFolder(id)}/${version}`;
}

/** The works of the collection `id`: each work names the collection it is in. */
function membersQuery(id: string) {
  return worksCollection().where("collectionId", "==", id);
}

/** The ids of the works `reader` sees in the order the site shows them; the admin sees them all. */
function idsInOrder(docs: DocumentSnapshot[], reader: Reader): string[] {
  return worksInOrder(docs)
    .filter(({ work }) => isVisibleTo(work, reader))
    .map(({ id }) => id);
}

function readCollection(snapshot: DocumentSnapshot): StoredCollection {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no collection");
  }

  return storedCollectionSchema.parse(snapshot.data());
}

/** What the client edits, which the entity tag of a collection follows: its works included. */
function editedContent(
  { cover, description, endYear, startYear, title }: StoredCollection,
  workIds: string[],
) {
  return { cover, description, endYear, startYear, title, workIds };
}

/** The stored collection as the API returns it, with download URLs and ISO 8601 dates. */
function toCollection(
  id: string,
  { cover, createdAt, description, endYear, startYear, title, updatedAt }: StoredCollection,
  workIds: string[],
): Collection {
  return {
    cover: toPhoto(cover),
    createdAt: createdAt.toDate().toISOString(),
    description,
    endYear,
    id,
    startYear,
    title,
    updatedAt: updatedAt.toDate().toISOString(),
    workIds,
  };
}

function toSavedCollection(
  id: string,
  collection: StoredCollection,
  workIds: string[],
): SavedCollection {
  return {
    data: toCollection(id, collection, workIds),
    etag: entityTag(editedContent(collection, workIds)),
    id,
  };
}

/**
 * Rejects with 409 a title that another collection has, whatever the case: the visitor tells the
 * collections apart by their titles.
 */
function assertTitleIsFree(id: string, title: string, { docs }: QuerySnapshot): void {
  const isTaken = docs.some(
    (snapshot) =>
      snapshot.id !== id && titleKey(readCollection(snapshot).title) === titleKey(title),
  );

  if (isTaken) {
    throw new ConflictError("Another collection has this title");
  }
}

/**
 * The works `ids` in the order the site shows them; rejects with 422 one that does not exist, such
 * as one deleted while the page was open.
 */
async function readWorks(transaction: Transaction, ids: string[]): Promise<string[]> {
  if (ids.length === 0) {
    return [];
  }

  const snapshots = await transaction.getAll(...ids.map((id) => worksCollection().doc(id)));
  const missing = snapshots.find((snapshot) => !snapshot.exists);

  if (missing) {
    throw new UnprocessableContentError(`There is no work ${missing.id}`);
  }

  return idsInOrder(snapshots, "admin");
}

/**
 * Puts the works `next` in the collection `id` and takes out those of `current` left out. A work
 * moved from another collection leaves it. The date a work was saved stays: the admin did not edit
 * the work itself.
 */
function moveWorks(transaction: Transaction, id: string, current: string[], next: string[]): void {
  const previous = new Set(current);
  const kept = new Set(next);

  for (const workId of next.filter((workId) => !previous.has(workId))) {
    transaction.update(worksCollection().doc(workId), { collectionId: id });
  }

  for (const workId of current.filter((workId) => !kept.has(workId))) {
    transaction.update(worksCollection().doc(workId), { collectionId: null });
  }
}

/** The latest finished first, then the latest started; collections of the same years by title. */
function compareCollections(a: StoredCollection, b: StoredCollection): number {
  return (
    (b.endYear ?? b.startYear) - (a.endYear ?? a.startYear) ||
    b.startYear - a.startYear ||
    byTitle(a, b)
  );
}

/**
 * Every collection with the works `reader` sees in the order the site shows them, tagged by what is
 * returned: moving a work changes the list without changing a stored collection.
 */
export async function listCollections(reader: Reader): Promise<Tagged<Collection[]>> {
  const [collections, works] = await Promise.all([
    collectionsCollection().get(),
    worksCollection().get(),
  ]);
  const workIds = new Map<string, string[]>();

  for (const { id, work } of worksInOrder(works.docs)) {
    if (work.collectionId !== null && isVisibleTo(work, reader)) {
      workIds.set(work.collectionId, [...(workIds.get(work.collectionId) ?? []), id]);
    }
  }

  const data = collections.docs
    .map((snapshot) => ({ collection: readCollection(snapshot), id: snapshot.id }))
    .sort((a, b) => compareCollections(a.collection, b.collection))
    .map(({ collection, id }) => toCollection(id, collection, workIds.get(id) ?? []));

  return { data, etag: entityTag(data) };
}

/** The collection `id` with the works `reader` sees. */
export async function getCollection(id: string, reader: Reader): Promise<SavedCollection> {
  const [snapshot, members] = await Promise.all([
    collectionDocument(id).get(),
    membersQuery(id).get(),
  ]);

  return toSavedCollection(id, readCollection(snapshot), idsInOrder(members.docs, reader));
}

/** Removes the copied file of a cover that was not saved. */
async function discardCover(id: string, image: StoredImage | undefined): Promise<void> {
  if (image) {
    await deleteImageFilesOrWarn(coverVersionFolder(id, image.version));
  }
}

/**
 * Creates the collection `id`, which the client chose, with its works; rejects it with 412 once a
 * collection has that id, such as one an earlier try of the same request created, and with 409
 * when another collection has its title. A new collection has no saved cover, so its cover needs an
 * upload, or it is rejected with 422, as it is for a work that does not exist. The file is copied
 * from its upload first; if saving fails, the copy is removed.
 */
export async function createCollection(id: string, body: CollectionBody): Promise<SavedCollection> {
  const { cover, workIds, ...fields } = body;

  if (cover.uploadId === undefined) {
    throw new UnprocessableContentError("A new collection needs an uploaded cover");
  }

  const image = await publishUpload(cover.uploadId, coverFolder(id));
  let collection: StoredCollection;
  let members: string[];

  try {
    [collection, members] = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(collectionDocument(id))).exists) {
        throw new PreconditionFailedError("The collection already exists");
      }

      assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

      const ordered = await readWorks(transaction, workIds);
      const now = Timestamp.now();
      const created: StoredCollection = {
        ...fields,
        cover: { ...image, alt: cover.alt },
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(collectionDocument(id), created);
      moveWorks(transaction, id, [], ordered);
      return [created, ordered];
    });
  } catch (error) {
    await discardCover(id, image);
    throw error;
  }

  return toSavedCollection(id, collection, members);
}

/**
 * Replaces the collection and its works while it is still the one the client read (`ifMatch`);
 * rejects it with 409 when another collection has its title and with 422 for a work that does not
 * exist. A new cover is copied from its upload first and the replaced one is removed once the
 * collection is saved, so the site never links to a missing file; if saving fails, the copy is
 * removed and the collection stays as it was.
 */
export async function replaceCollection(
  id: string,
  body: CollectionBody,
  ifMatch: string,
): Promise<SavedCollection> {
  const { cover, workIds, ...fields } = body;
  const image =
    cover.uploadId === undefined ? undefined : await publishUpload(cover.uploadId, coverFolder(id));
  let previous: StoredCollection;
  let collection: StoredCollection;
  let members: string[];

  try {
    [previous, collection, members] = await firestore().runTransaction(async (transaction) => {
      const document = collectionDocument(id);
      const current = readCollection(await transaction.get(document));
      const currentWorkIds = idsInOrder((await transaction.get(membersQuery(id))).docs, "admin");

      assertIfMatch(ifMatch, editedContent(current, currentWorkIds));
      assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

      const ordered = await readWorks(transaction, workIds);
      const next: StoredCollection = {
        ...current,
        ...fields,
        cover: { ...(image ?? current.cover), alt: cover.alt },
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      moveWorks(transaction, id, currentWorkIds, ordered);
      return [current, next, ordered];
    });
  } catch (error) {
    await discardCover(id, image);
    throw error;
  }

  if (image) {
    await deleteImageFilesOrWarn(coverVersionFolder(id, previous.cover.version));
  }

  return toSavedCollection(id, collection, members);
}

/**
 * Deletes the collection while it is still the one the client read, and then all its files. Its
 * works stay, each on its own.
 */
export async function deleteCollection(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = collectionDocument(id);
    const current = readCollection(await transaction.get(document));
    const currentWorkIds = idsInOrder((await transaction.get(membersQuery(id))).docs, "admin");

    assertIfMatch(ifMatch, editedContent(current, currentWorkIds));
    transaction.delete(document);
    moveWorks(transaction, id, currentWorkIds, []);
  });

  await deleteImageFilesOrWarn(collectionFolder(id));
}
