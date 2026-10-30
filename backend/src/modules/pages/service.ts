import { type Page, type PageId, pageIds } from "#modules/pages/schema";
import { firestore } from "#shared/firebase/firestore";
import type { Tagged } from "#shared/http/etag";
import {
  clearSlot,
  fillSlot,
  getSlot,
  type ImageSlot,
  readSlot,
  type SlotField,
} from "#shared/images/slot";
import { type Image, type StoredImage, storedImageSchema, toImage } from "#shared/images/storage";

/** A hero is the image alone: a background under the page title, so it has no alt text. */
const heroField: SlotField<StoredImage> = { field: "hero", schema: storedImageSchema };

/** One document per page, so saving one page never conflicts with saving another. */
function pageDocument(page: PageId) {
  return firestore().doc(`pages/${page}`);
}

function heroSlot(page: PageId): ImageSlot<StoredImage> {
  return { ...heroField, document: () => pageDocument(page), folder: `pages/${page}/hero` };
}

export async function getPages(): Promise<Record<PageId, Page>> {
  const snapshots = await firestore().getAll(...pageIds.map(pageDocument));
  const pages = snapshots.map((snapshot) => {
    const hero = readSlot(heroField, snapshot);

    return [snapshot.id, { hero: hero && toImage(hero) }] as const;
  });

  // The documents are named after the pages, so every page has an entry.
  return Object.fromEntries(pages) as Record<PageId, Page>;
}

/** The hero of the page, `null` until one is uploaded, with the entity tag for If-Match. */
export async function getPageHero(page: PageId): Promise<Tagged<Image | null>> {
  const { data, etag } = await getSlot(heroSlot(page));

  return { data: data && toImage(data), etag };
}

/** The saved hero with its tag, and whether it is the first one of the page rather than a replacement. */
export interface SavedHero extends Tagged<Image> {
  created: boolean;
}

/** Puts the uploaded photo as the hero of the page, replacing the previous one. */
export async function savePageHero(
  page: PageId,
  uploadId: string,
  ifMatch: string,
): Promise<SavedHero> {
  const { created, data, etag } = await fillSlot(
    heroSlot(page),
    uploadId,
    ifMatch,
    (image) => image,
  );

  return { created, data: toImage(data), etag };
}

/** Removes the hero and its files; returns the entity tag of the empty hero. */
export function deletePageHero(page: PageId, ifMatch: string): Promise<string> {
  return clearSlot(heroSlot(page), ifMatch);
}
