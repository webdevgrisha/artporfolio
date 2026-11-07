import { type QuerySnapshot, Timestamp } from "firebase-admin/firestore";

import type { Reader } from "#modules/auth/schema";
import {
  collectionDocument,
  collectionsCollection,
  readCollection,
} from "#modules/gallery/collections/document";
import {
  idsInOrder,
  membersQuery,
  moveWorks,
  readMembers,
} from "#modules/gallery/collections/members";
import { compareCollections } from "#modules/gallery/collections/order";
import { toCollection, toSavedCollection } from "#modules/gallery/collections/representation";
import type {
  Collection,
  CollectionBody,
  StoredCollection,
} from "#modules/gallery/collections/schema";
import { worksCollection } from "#modules/gallery/works/document";
import { worksInOrder } from "#modules/gallery/works/order";
import { isVisibleTo } from "#modules/gallery/works/visibility";
import { firestore } from "#shared/firebase/firestore";
import {
  ConflictError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import {
  deleteTranslations,
  requestTranslations,
  saveSources,
} from "#shared/i18n/translation-requests";
import { saveWithImages } from "#shared/images/saving";
import { deleteImageFilesOrWarn } from "#shared/images/stored-image";
import { titleKey } from "#shared/text/titles";

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

/** Where the translations of the collection go. */
function collectionTranslations(id: string): string {
  return `gallery-collection-${id}`;
}

/** The texts of a collection the site shows in every language. */
function collectionTexts({ cover, description, title }: StoredCollection) {
  return { alt: cover.alt, description, title };
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
  const { cover, workIds, ...fields } = body;
  const { uploadId } = cover;

  if (uploadId === undefined) {
    throw new UnprocessableContentError("A new collection needs an uploaded cover");
  }

  return saveWithImages(async (files) => {
    const image = await files.publish(uploadId, coverFolder(id));
    const [collection, members] = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(collectionDocument(id))).exists) {
        throw new PreconditionFailedError("The collection already exists");
      }

      assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

      const ordered = await readMembers(transaction, id, workIds);
      const now = Timestamp.now();
      const created: StoredCollection = {
        ...fields,
        cover: { ...image, alt: cover.alt },
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(collectionDocument(id), created);
      moveWorks(transaction, id, [], ordered);
      saveSources(transaction, collectionTranslations(id), collectionTexts(created));
      return [created, ordered] as const;
    });

    await requestTranslations(collectionTranslations(id));

    return toSavedCollection(id, collection, members);
  });
}

/**
 * Replaces the collection and its works while it is still the one the client read (`ifMatch`);
 * rejects it with 409 when another collection has its title and with 422 for a work that does not
 * exist or is in another collection.
 */
export function replaceCollection(
  id: string,
  body: CollectionBody,
  ifMatch: string,
): Promise<Tagged<Collection>> {
  const { cover, workIds, ...fields } = body;
  const { uploadId } = cover;

  return saveWithImages(async (files) => {
    const image =
      uploadId === undefined ? undefined : await files.publish(uploadId, coverFolder(id));
    const [previous, collection, members] = await firestore().runTransaction(
      async (transaction) => {
        const document = collectionDocument(id);
        const current = readCollection(await transaction.get(document));
        const currentWorkIds = idsInOrder((await transaction.get(membersQuery(id))).docs, "admin");

        assertIfMatch(ifMatch, toCollection(id, current, currentWorkIds));
        assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

        const ordered = await readMembers(transaction, id, workIds);
        const next: StoredCollection = {
          ...current,
          ...fields,
          cover: { ...(image ?? current.cover), alt: cover.alt },
          updatedAt: Timestamp.now(),
        };

        transaction.set(document, next);
        moveWorks(transaction, id, currentWorkIds, ordered);
        saveSources(transaction, collectionTranslations(id), collectionTexts(next));
        return [current, next, ordered] as const;
      },
    );

    if (image) {
      files.removeAfterSave(coverVersionFolder(id, previous.cover.version));
    }

    await requestTranslations(collectionTranslations(id));

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
  await deleteTranslations(collectionTranslations(id));
}
