import { type DocumentSnapshot, type QuerySnapshot, Timestamp } from "firebase-admin/firestore";

import {
  type Collection,
  type CollectionBody,
  type StoredCollection,
  storedCollectionSchema,
} from "#modules/gallery-collections/schema";
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

function collectionsCollection() {
  return firestore().collection("galleryCollections");
}

function collectionDocument(id: string) {
  return collectionsCollection().doc(id);
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

function readCollection(snapshot: DocumentSnapshot): StoredCollection {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no collection");
  }

  return storedCollectionSchema.parse(snapshot.data());
}

/** What the client edits, which the entity tag of a collection follows. */
function editedContent({ cover, description, endYear, startYear, title }: StoredCollection) {
  return { cover, description, endYear, startYear, title };
}

/** The stored collection as the API returns it, with download URLs and ISO 8601 dates. */
function toCollection(
  id: string,
  { cover, createdAt, description, endYear, startYear, title, updatedAt }: StoredCollection,
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
  };
}

function toSavedCollection(id: string, collection: StoredCollection): SavedCollection {
  return { data: toCollection(id, collection), etag: entityTag(editedContent(collection)), id };
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

/** The latest finished first, then the latest started; collections of the same years by title. */
function compareCollections(a: StoredCollection, b: StoredCollection): number {
  return (
    (b.endYear ?? b.startYear) - (a.endYear ?? a.startYear) ||
    b.startYear - a.startYear ||
    byTitle(a, b)
  );
}

/** Every collection in the order the site shows them, tagged by the stored list. */
export async function listCollections(): Promise<Tagged<Collection[]>> {
  const { docs } = await collectionsCollection().get();
  const collections = docs
    .map((snapshot) => ({ collection: readCollection(snapshot), id: snapshot.id }))
    .sort((a, b) => compareCollections(a.collection, b.collection));

  return {
    data: collections.map(({ collection, id }) => toCollection(id, collection)),
    etag: entityTag(collections),
  };
}

export async function getCollection(id: string): Promise<SavedCollection> {
  return toSavedCollection(id, readCollection(await collectionDocument(id).get()));
}

/** Removes the copied file of a cover that was not saved. */
async function discardCover(id: string, image: StoredImage | undefined): Promise<void> {
  if (image) {
    await deleteImageFilesOrWarn(coverVersionFolder(id, image.version));
  }
}

/**
 * Creates the collection `id`, which the client chose; rejects it with 412 once a collection has
 * that id, such as one an earlier try of the same request created, and with 409 when another
 * collection has its title. A new collection has no saved cover, so its cover needs an upload, or
 * it is rejected with 422. The file is copied from its upload first; if saving fails, the copy is
 * removed.
 */
export async function createCollection(id: string, body: CollectionBody): Promise<SavedCollection> {
  const { alt, uploadId } = body.cover;

  if (uploadId === undefined) {
    throw new UnprocessableContentError("A new collection needs an uploaded cover");
  }

  const image = await publishUpload(uploadId, coverFolder(id));
  let collection: StoredCollection;

  try {
    collection = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(collectionDocument(id))).exists) {
        throw new PreconditionFailedError("The collection already exists");
      }

      assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

      const now = Timestamp.now();
      const created: StoredCollection = {
        ...body,
        cover: { ...image, alt },
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(collectionDocument(id), created);
      return created;
    });
  } catch (error) {
    await discardCover(id, image);
    throw error;
  }

  return toSavedCollection(id, collection);
}

/**
 * Replaces the collection while it is still the one the client read (`ifMatch`); rejects it with
 * 409 when another collection has its title. A new cover is copied from its upload first and the
 * replaced one is removed once the collection is saved, so the site never links to a missing file;
 * if saving fails, the copy is removed and the collection stays as it was.
 */
export async function replaceCollection(
  id: string,
  body: CollectionBody,
  ifMatch: string,
): Promise<SavedCollection> {
  const { alt, uploadId } = body.cover;
  const image = uploadId === undefined ? undefined : await publishUpload(uploadId, coverFolder(id));
  let previous: StoredCollection;
  let collection: StoredCollection;

  try {
    [previous, collection] = await firestore().runTransaction(async (transaction) => {
      const document = collectionDocument(id);
      const current = readCollection(await transaction.get(document));

      assertIfMatch(ifMatch, editedContent(current));
      assertTitleIsFree(id, body.title, await transaction.get(collectionsCollection()));

      const next: StoredCollection = {
        ...current,
        ...body,
        cover: { ...(image ?? current.cover), alt },
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      return [current, next];
    });
  } catch (error) {
    await discardCover(id, image);
    throw error;
  }

  if (image) {
    await deleteImageFilesOrWarn(coverVersionFolder(id, previous.cover.version));
  }

  return toSavedCollection(id, collection);
}

/** Deletes the collection while it is still the one the client read, and then all its files. */
export async function deleteCollection(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = collectionDocument(id);

    assertIfMatch(ifMatch, editedContent(readCollection(await transaction.get(document))));
    transaction.delete(document);
  });

  await deleteImageFilesOrWarn(collectionFolder(id));
}
