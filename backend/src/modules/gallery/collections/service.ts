import {
  type DocumentSnapshot,
  type QuerySnapshot,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";

import type { Reader } from "#modules/auth/schema";
import { collectionDocument, collectionsCollection } from "#modules/gallery/collections/document";
import {
  type Collection,
  type CollectionBody,
  type CollectionSummary,
  type StoredCollection,
  storedCollectionSchema,
} from "#modules/gallery/collections/schema";
import { collectionTexts } from "#modules/gallery/collections/texts";
import { worksCollection } from "#modules/gallery/works/document";
import { isVisibleTo, worksInOrder } from "#modules/gallery/works/service";
import { firestore } from "#shared/firebase/firestore";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { saveTranslations } from "#shared/i18n/translating";
import { toTranslations } from "#shared/i18n/translations";
import { toPhoto } from "#shared/images/photo";
import { saveWithImages } from "#shared/images/saving";
import { deleteImageFilesOrWarn } from "#shared/images/stored-image";
import { byTitle, titleKey } from "#shared/text/titles";

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

/** The stored collection as the list returns it, with download URLs and ISO 8601 dates. */
function toCollectionSummary(
  id: string,
  { cover, createdAt, description, endYear, startYear, title, updatedAt }: StoredCollection,
  workIds: string[],
): CollectionSummary {
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

/** The stored collection as the API returns it alone: its summary and its translations. */
function toCollection(id: string, collection: StoredCollection, workIds: string[]): Collection {
  return {
    ...toCollectionSummary(id, collection, workIds),
    translations: toTranslations(collection.translations, collectionTexts(collection)),
  };
}

/** The collection as the API returns it, tagged by that representation, its works included. */
function toSavedCollection(
  id: string,
  collection: StoredCollection,
  workIds: string[],
): Tagged<Collection> {
  const data = toCollection(id, collection, workIds);

  return { data, etag: entityTag(data) };
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
 * The works `ids` of the collection `collectionId` in the order the site shows them. Rejects with
 * 422 a work that does not exist, such as one deleted while the page was open, and a work of another
 * collection: the If-Match of this collection says nothing about that one, so a form opened earlier
 * would take the work away without having seen where it went. A work moves in its own form.
 */
async function readWorks(
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
export async function listCollections(reader: Reader): Promise<Tagged<CollectionSummary[]>> {
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
    .map(({ collection, id }) => toCollectionSummary(id, collection, workIds.get(id) ?? []));

  return { data, etag: entityTag(data) };
}

/** The collection `id` with the works `reader` sees. */
export async function getCollection(id: string, reader: Reader): Promise<Tagged<Collection>> {
  const [snapshot, members] = await Promise.all([
    collectionDocument(id).get(),
    membersQuery(id).get(),
  ]);

  return toSavedCollection(id, readCollection(snapshot), idsInOrder(members.docs, reader));
}

/**
 * Creates the collection `id`, which the client chose, with its works; rejects it with 412 once a
 * collection has that id, such as one an earlier try of the same request created, and with 409
 * when another collection has its title. A new collection has no saved cover, so its cover needs an
 * upload, or it is rejected with 422, as it is for a work that does not exist or is in another
 * collection.
 */
export async function createCollection(
  id: string,
  body: CollectionBody,
): Promise<Tagged<Collection>> {
  const { cover, translations: sent, workIds, ...fields } = body;
  const { uploadId } = cover;

  if (uploadId === undefined) {
    throw new UnprocessableContentError("A new collection needs an uploaded cover");
  }

  return saveWithImages(async (files) => {
    const translations = await saveTranslations(collectionTexts(body), {}, sent);
    const image = await files.publish(uploadId, coverFolder(id));
    const [collection, members] = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(collectionDocument(id))).exists) {
        throw new PreconditionFailedError("The collection already exists");
      }

      assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

      const ordered = await readWorks(transaction, id, workIds);
      const now = Timestamp.now();
      const created: StoredCollection = {
        ...fields,
        cover: { ...image, alt: cover.alt },
        createdAt: now,
        translations,
        updatedAt: now,
      };

      transaction.create(collectionDocument(id), created);
      moveWorks(transaction, id, [], ordered);
      return [created, ordered] as const;
    });

    return toSavedCollection(id, collection, members);
  });
}

/**
 * Replaces the collection and its works while it is still the one the client read (`ifMatch`);
 * rejects it with 409 when another collection has its title and with 422 for a work that does not
 * exist or is in another collection. The translator runs before the transaction, which may run
 * several times: the tag checked there covers the translations, so the ones it started from are
 * still the saved ones.
 */
export function replaceCollection(
  id: string,
  body: CollectionBody,
  ifMatch: string,
): Promise<Tagged<Collection>> {
  const { cover, translations: sent, workIds, ...fields } = body;
  const { uploadId } = cover;

  return saveWithImages(async (files) => {
    const [snapshot, savedMembers] = await Promise.all([
      collectionDocument(id).get(),
      membersQuery(id).get(),
    ]);
    const saved = readCollection(snapshot);

    // Nothing is paid for a change that the check in the transaction would reject anyway.
    assertIfMatch(ifMatch, toCollection(id, saved, idsInOrder(savedMembers.docs, "admin")));

    const translations = await saveTranslations(collectionTexts(body), saved.translations, sent);
    const image =
      uploadId === undefined ? undefined : await files.publish(uploadId, coverFolder(id));
    const [previous, collection, members] = await firestore().runTransaction(
      async (transaction) => {
        const document = collectionDocument(id);
        const current = readCollection(await transaction.get(document));
        const currentWorkIds = idsInOrder((await transaction.get(membersQuery(id))).docs, "admin");

        assertIfMatch(ifMatch, toCollection(id, current, currentWorkIds));
        assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

        const ordered = await readWorks(transaction, id, workIds);
        const next: StoredCollection = {
          ...current,
          ...fields,
          cover: { ...(image ?? current.cover), alt: cover.alt },
          translations,
          updatedAt: Timestamp.now(),
        };

        transaction.set(document, next);
        moveWorks(transaction, id, currentWorkIds, ordered);
        return [current, next, ordered] as const;
      },
    );

    if (image) {
      files.removeAfterSave(coverVersionFolder(id, previous.cover.version));
    }

    return toSavedCollection(id, collection, members);
  });
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

    assertIfMatch(ifMatch, toCollection(id, current, currentWorkIds));
    transaction.delete(document);
    moveWorks(transaction, id, currentWorkIds, []);
  });

  await deleteImageFilesOrWarn(collectionFolder(id));
}
