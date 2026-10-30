import {
  type DocumentReference,
  type DocumentSnapshot,
  FieldValue,
  type Transaction,
} from "firebase-admin/firestore";

import { type Page, type PageId, pageIds } from "#modules/pages/schema";
import { firestore } from "#shared/firebase/firestore";
import {
  deleteImageFilesOrWarn,
  type Image,
  type StoredImage,
  storedImageSchema,
  toImage,
} from "#shared/images/storage";
import { deleteUploadsOrWarn, publishUpload } from "#shared/images/uploads";

type HeroChange<T> = (
  hero: StoredImage | null,
  transaction: Transaction,
  document: DocumentReference,
) => T;

/** One document per page, so saving one page never conflicts with saving another. */
function pageDocument(page: PageId) {
  return firestore().doc(`pages/${page}`);
}

function heroFolder(page: PageId): string {
  return `pages/${page}/hero`;
}

function versionFolder(page: PageId, version: string): string {
  return `${heroFolder(page)}/${version}`;
}

function readHero(snapshot: DocumentSnapshot): StoredImage | null {
  const hero: unknown = snapshot.get("hero");

  return hero === undefined ? null : storedImageSchema.parse(hero);
}

/**
 * Reads the hero and writes the change in one transaction: concurrent requests for the page, such
 * as an upload and a delete, would otherwise leave files that no hero links to.
 */
function changeHero<T>(page: PageId, change: HeroChange<T>): Promise<T> {
  return firestore().runTransaction(async (transaction) => {
    const document = pageDocument(page);

    return change(readHero(await transaction.get(document)), transaction, document);
  });
}

export async function getPages(): Promise<Record<PageId, Page>> {
  const snapshots = await firestore().getAll(...pageIds.map(pageDocument));
  const pages = snapshots.map((snapshot) => {
    const hero = readHero(snapshot);

    return [snapshot.id, { hero: hero && toImage(hero) }] as const;
  });

  // The documents are named after the pages, so every page has an entry.
  return Object.fromEntries(pages) as Record<PageId, Page>;
}

/** The saved hero, and whether it is the first one of the page rather than a replacement. */
export interface SavedHero {
  created: boolean;
  hero: Image;
}

/**
 * Puts the uploaded photo as the hero, before removing the previous one, so the site never links
 * to missing files. If the hero cannot be saved, its copy is removed and the upload is kept.
 */
export async function savePageHero(page: PageId, uploadId: string): Promise<SavedHero> {
  const hero = await publishUpload(uploadId, heroFolder(page));
  let previous: StoredImage | null;

  try {
    previous = await changeHero(page, (current, transaction, document) => {
      // Merging keeps the other fields of the page document.
      transaction.set(document, { hero }, { merge: true });
      return current;
    });
  } catch (error) {
    await deleteImageFilesOrWarn(versionFolder(page, hero.version));
    throw error;
  }

  if (previous) {
    await deleteImageFilesOrWarn(versionFolder(page, previous.version));
  }

  await deleteUploadsOrWarn([uploadId]);

  return { created: previous === null, hero: toImage(hero) };
}

export async function deletePageHero(page: PageId): Promise<void> {
  const deleted = await changeHero(page, (hero, transaction, document) => {
    if (hero) {
      transaction.update(document, { hero: FieldValue.delete() });
    }

    return hero;
  });

  if (deleted) {
    await deleteImageFilesOrWarn(versionFolder(page, deleted.version));
  }
}
