import { type Page, type PageId, pageIds } from "#modules/pages/schema";
import { firestore } from "#shared/firebase/firestore";
import { clearSlot, fillSlot, type ImageSlot, readSlot, type SlotField } from "#shared/images/slot";
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

/** The saved hero, and whether it is the first one of the page rather than a replacement. */
export interface SavedHero {
  created: boolean;
  hero: Image;
}

/** Puts the uploaded photo as the hero of the page, replacing the previous one. */
export async function savePageHero(page: PageId, uploadId: string): Promise<SavedHero> {
  const { created, stored } = await fillSlot(heroSlot(page), uploadId, (image) => image);

  return { created, hero: toImage(stored) };
}

export function deletePageHero(page: PageId): Promise<void> {
  return clearSlot(heroSlot(page));
}
