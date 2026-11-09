import type { DocumentReference, DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import type { ZodType } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { saveWithImages } from "#shared/images/saving";
import type { StoredImage } from "#shared/images/stored-image";

/** How a field of a document stores its image: the image alone, or with more, such as an alt text. */
export interface SlotField<TStored extends StoredImage> {
  field: string;
  schema: ZodType<TStored>;
}

/**
 * Where a single image is kept, such as a page hero or a photo with its alt text: a field of a
 * Firestore document, and a Storage folder with one subfolder per uploaded version. The entity
 * tag of the slot follows what the field stores, `null` while it is empty.
 */
export interface ImageSlot<TStored extends StoredImage> extends SlotField<TStored> {
  document: () => DocumentReference;
  folder: string;
  /** What else is written with the slot, in the same transaction. */
  saveAlong?: (transaction: Transaction, stored: TStored) => void;
}

/** What the slot stores after a change, with its tag, and what it stored before. */
export interface ChangedSlot<TStored extends StoredImage> extends Tagged<TStored> {
  previous: TStored | null;
}

/** The image now in the slot, with its tag, and whether it is the first one rather than a replacement. */
export interface FilledSlot<TStored extends StoredImage> extends Tagged<TStored> {
  created: boolean;
}

function versionFolder(slot: { folder: string }, version: string): string {
  return `${slot.folder}/${version}`;
}

export function readSlot<TStored extends StoredImage>(
  { field, schema }: SlotField<TStored>,
  snapshot: DocumentSnapshot,
): TStored | null {
  const stored: unknown = snapshot.get(field);

  return stored === undefined ? null : schema.parse(stored);
}

/** What the slot stores, with the entity tag for If-Match. */
export async function getSlot<TStored extends StoredImage>(
  slot: ImageSlot<TStored>,
): Promise<Tagged<TStored | null>> {
  const stored = readSlot(slot, await slot.document().get());

  return { data: stored, etag: entityTag(stored) };
}

/**
 * Replaces what the slot stores with `next(current)`. One transaction reads the slot, checks that
 * it is still what the client read (`ifMatch`) and writes the change: concurrent requests, such as
 * two saves of one photo, would otherwise leave files that nothing links to.
 */
export function changeSlot<TStored extends StoredImage>(
  slot: ImageSlot<TStored>,
  ifMatch: string,
  next: (current: TStored | null) => TStored,
): Promise<ChangedSlot<TStored>> {
  return firestore().runTransaction(async (transaction) => {
    const document = slot.document();
    const previous = readSlot(slot, await transaction.get(document));

    assertIfMatch(ifMatch, previous);

    const stored = next(previous);

    // Merging keeps the other fields of the document.
    transaction.set(document, { [slot.field]: stored }, { merge: true });
    slot.saveAlong?.(transaction, stored);

    return { data: stored, etag: entityTag(stored), previous };
  });
}

/**
 * Puts the uploaded image in the slot, replacing the previous one. `toStored` adds what the field
 * keeps besides the image.
 */
export function fillSlot<TStored extends StoredImage>(
  slot: ImageSlot<TStored>,
  uploadId: string,
  ifMatch: string,
  toStored: (image: StoredImage) => TStored,
): Promise<FilledSlot<TStored>> {
  return saveWithImages(async (files) => {
    const stored = toStored(await files.publish(uploadId, slot.folder));
    const { etag, previous } = await changeSlot(slot, ifMatch, () => stored);

    if (previous) {
      files.removeAfterSave(versionFolder(slot, previous.version));
    }

    return { created: previous === null, data: stored, etag };
  });
}
