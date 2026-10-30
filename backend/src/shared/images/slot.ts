import {
  type DocumentReference,
  type DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import type { ZodType } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/storage";
import { deleteUploadsOrWarn, publishUpload } from "#shared/images/uploads";

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
}

/** What the slot stores after a change, with its tag, and what it stored before. */
export interface ChangedSlot<TStored extends StoredImage, TNext extends TStored | null>
  extends Tagged<TNext> {
  previous: TStored | null;
}

/** The image now in the slot, with its tag, and whether it is the first one rather than a replacement. */
export interface FilledSlot<TStored extends StoredImage> extends Tagged<TStored> {
  created: boolean;
}

function versionFolder(slot: ImageSlot<StoredImage>, version: string): string {
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
 * Replaces what the slot stores with `next(current)`, `null` to empty it. One transaction reads
 * the slot, checks that it is still what the client read (`ifMatch`) and writes the change:
 * concurrent requests, such as a delete and an alt update, would otherwise leave a broken image
 * or files that nothing links to.
 */
export function changeSlot<TStored extends StoredImage, TNext extends TStored | null>(
  slot: ImageSlot<TStored>,
  ifMatch: string,
  next: (current: TStored | null) => TNext,
): Promise<ChangedSlot<TStored, TNext>> {
  return firestore().runTransaction(async (transaction) => {
    const document = slot.document();
    const previous = readSlot(slot, await transaction.get(document));

    assertIfMatch(ifMatch, previous);

    const stored = next(previous);

    if (stored) {
      // Merging keeps the other fields of the document.
      transaction.set(document, { [slot.field]: stored }, { merge: true });
    } else if (previous) {
      transaction.update(document, { [slot.field]: FieldValue.delete() });
    }

    return { data: stored, etag: entityTag(stored), previous };
  });
}

/**
 * Puts the uploaded image in the slot, before removing the previous one, so the site never links
 * to missing files. `toStored` adds what the field keeps besides the image. If the image cannot be
 * saved, its copy is removed and the upload is kept.
 */
export async function fillSlot<TStored extends StoredImage>(
  slot: ImageSlot<TStored>,
  uploadId: string,
  ifMatch: string,
  toStored: (image: StoredImage) => TStored,
): Promise<FilledSlot<TStored>> {
  const stored = toStored(await publishUpload(uploadId, slot.folder));
  let changed: ChangedSlot<TStored, TStored>;

  try {
    changed = await changeSlot(slot, ifMatch, () => stored);
  } catch (error) {
    await deleteImageFilesOrWarn(versionFolder(slot, stored.version));
    throw error;
  }

  if (changed.previous) {
    await deleteImageFilesOrWarn(versionFolder(slot, changed.previous.version));
  }

  await deleteUploadsOrWarn([uploadId]);

  return { created: changed.previous === null, data: stored, etag: changed.etag };
}

/** Removes the image and its files; an empty slot stays empty. */
export async function clearSlot<TStored extends StoredImage>(
  slot: ImageSlot<TStored>,
  ifMatch: string,
): Promise<void> {
  const { previous } = await changeSlot(slot, ifMatch, () => null);

  if (previous) {
    await deleteImageFilesOrWarn(versionFolder(slot, previous.version));
  }
}
