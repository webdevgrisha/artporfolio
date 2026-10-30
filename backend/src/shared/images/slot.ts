import {
  type DocumentReference,
  type DocumentSnapshot,
  FieldValue,
  type Transaction,
} from "firebase-admin/firestore";
import type { ZodType } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/storage";
import { deleteUploadsOrWarn, publishUpload } from "#shared/images/uploads";

/** How a field of a document stores its image: the image alone, or with more, such as an alt text. */
export interface SlotField<TStored extends StoredImage> {
  field: string;
  schema: ZodType<TStored>;
}

/**
 * Where a single image is kept, such as a page hero or a photo with its alt text: a field of a
 * Firestore document, and a Storage folder with one subfolder per uploaded version.
 */
export interface ImageSlot<TStored extends StoredImage> extends SlotField<TStored> {
  document: () => DocumentReference;
  folder: string;
}

/** The image now in the slot, and whether it is the first one rather than a replacement. */
export interface FilledSlot<TStored extends StoredImage> {
  created: boolean;
  stored: TStored;
}

type SlotChange<TStored extends StoredImage, T> = (
  stored: TStored | null,
  transaction: Transaction,
  document: DocumentReference,
) => T;

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

/**
 * Reads the image and writes the change in one transaction: concurrent requests, such as a delete
 * and an alt update, would otherwise leave a broken image or files that nothing links to.
 */
export function changeSlot<TStored extends StoredImage, T>(
  slot: ImageSlot<TStored>,
  change: SlotChange<TStored, T>,
): Promise<T> {
  return firestore().runTransaction(async (transaction) => {
    const document = slot.document();

    return change(readSlot(slot, await transaction.get(document)), transaction, document);
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
  toStored: (image: StoredImage) => TStored,
): Promise<FilledSlot<TStored>> {
  const stored = toStored(await publishUpload(uploadId, slot.folder));
  let previous: TStored | null;

  try {
    previous = await changeSlot(slot, (current, transaction, document) => {
      // Merging keeps the other fields of the document.
      transaction.set(document, { [slot.field]: stored }, { merge: true });
      return current;
    });
  } catch (error) {
    await deleteImageFilesOrWarn(versionFolder(slot, stored.version));
    throw error;
  }

  if (previous) {
    await deleteImageFilesOrWarn(versionFolder(slot, previous.version));
  }

  await deleteUploadsOrWarn([uploadId]);

  return { created: previous === null, stored };
}

/** Removes the image and its files; does nothing when the slot is empty. */
export async function clearSlot<TStored extends StoredImage>(
  slot: ImageSlot<TStored>,
): Promise<void> {
  const deleted = await changeSlot(slot, (stored, transaction, document) => {
    if (stored) {
      transaction.update(document, { [slot.field]: FieldValue.delete() });
    }

    return stored;
  });

  if (deleted) {
    await deleteImageFilesOrWarn(versionFolder(slot, deleted.version));
  }
}
