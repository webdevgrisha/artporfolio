import { type DocumentSnapshot, Timestamp, type Transaction } from "firebase-admin/firestore";

import { collectionDocument } from "#modules/gallery-collections/document";
import { maxCollectionWorks } from "#modules/gallery-collections/schema";
import { colorIdsIn, colorsDocument } from "#modules/gallery-colors/service";
import { materialIdsIn, materialsDocument } from "#modules/gallery-materials/service";
import { paletteIdsIn, palettesDocument } from "#modules/gallery-palettes/service";
import { sectionIdsIn, sectionsCollection } from "#modules/gallery-sections/service";

import {
  discountedAmount,
  type StoredWork,
  storedWorkSchema,
  type Work,
  type WorkBody,
} from "#modules/gallery-works/schema";
import { firestore } from "#shared/firebase/firestore";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { type StoredPhoto, toPhoto } from "#shared/images/photo";
import {
  type PhotoListDraft,
  preparePhotoList,
  type StoredListPhoto,
  toListPhoto,
} from "#shared/images/photo-list";
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/storage";
import { publishUpload } from "#shared/images/uploads";

/** A saved work with the id it is known by. */
export interface SavedWork extends Tagged<Work> {
  id: string;
}

/** The ids of the saved items of each gallery list a work refers to. */
interface KnownIds {
  /** Every section and subsection. */
  sections: Set<string>;
  materials: Set<string>;
  colors: Set<string>;
  palettes: Set<string>;
}

/** Every work; a collection reads it to find its works. */
export function worksCollection() {
  return firestore().collection("galleryWorks");
}

function workDocument(id: string) {
  return worksCollection().doc(id);
}

/** Every file of the work; deleting the work removes the folder. */
function workFolder(id: string): string {
  return `galleryWorks/${id}`;
}

/** The photo keeps one subfolder per uploaded version. */
function photoFolder(id: string): string {
  return `${workFolder(id)}/photo`;
}

function photoVersionFolder(id: string, version: string): string {
  return `${photoFolder(id)}/${version}`;
}

/** Each process photo keeps its versions in a subfolder of its own. */
function processPhotosFolder(id: string): string {
  return `${workFolder(id)}/process`;
}

function readWork(snapshot: DocumentSnapshot): StoredWork {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no work");
  }

  return storedWorkSchema.parse(snapshot.data());
}

/** What the client edits, which the entity tag of a work follows. */
function editedContent({
  city,
  collectionId,
  colorIds,
  country,
  description,
  format,
  materialIds,
  month,
  paletteIds,
  partCount,
  photo,
  price,
  processPhotos,
  published,
  saleStatus,
  sectionIds,
  size,
  title,
  year,
}: StoredWork) {
  return {
    city,
    collectionId,
    colorIds,
    country,
    description,
    format,
    materialIds,
    month,
    paletteIds,
    partCount,
    photo,
    price,
    processPhotos,
    published,
    saleStatus,
    sectionIds,
    size,
    title,
    year,
  };
}

const centimetresPerInch = 2.54;

/**
 * A side in inches, rounded to hundredths. A side measured in inches with two decimals and saved in
 * centimetres comes back as measured: 16 inches are stored as 40.64 cm and read as 16 again.
 */
function toInches(centimetres: number): number {
  return Math.round((centimetres / centimetresPerInch) * 100) / 100;
}

/** The price as the API returns it, with the amount after the discount rounded to a whole unit. */
function toPrice(price: StoredWork["price"]): Work["price"] {
  if (price === null) {
    return null;
  }

  const { amount, currency, discountPercent } = price;

  return {
    amount,
    currency,
    discountPercent,
    finalAmount: discountedAmount(amount, discountPercent),
  };
}

/**
 * The stored work as the API returns it, with download URLs and ISO 8601 dates. A section, a
 * material, a color or a palette deleted since the work was saved is left out (`known`, the ids
 * that exist).
 */
function toWork(
  id: string,
  {
    city,
    collectionId,
    colorIds,
    country,
    createdAt,
    description,
    format,
    materialIds,
    month,
    paletteIds,
    partCount,
    photo,
    price,
    processPhotos,
    published,
    saleStatus,
    sectionIds,
    size,
    title,
    updatedAt,
    year,
  }: StoredWork,
  known: KnownIds,
): Work {
  return {
    city,
    collectionId,
    colorIds: colorIds.filter((colorId) => known.colors.has(colorId)),
    country,
    createdAt: createdAt.toDate().toISOString(),
    description,
    format,
    id,
    materialIds: materialIds.filter((materialId) => known.materials.has(materialId)),
    month,
    paletteIds: paletteIds.filter((paletteId) => known.palettes.has(paletteId)),
    partCount,
    photo: toPhoto(photo),
    price: toPrice(price),
    processPhotos: processPhotos.map(toListPhoto),
    published,
    saleStatus,
    sectionIds: sectionIds.filter((sectionId) => known.sections.has(sectionId)),
    size,
    sizeInches: { width: toInches(size.width), height: toInches(size.height) },
    title,
    updatedAt: updatedAt.toDate().toISOString(),
    year,
  };
}

function toSavedWork(id: string, work: StoredWork, known: KnownIds): SavedWork {
  return { data: toWork(id, work, known), etag: entityTag(editedContent(work)), id };
}

/** The ids of everything a work may refer to. */
async function readKnownIds(): Promise<KnownIds> {
  const [sections, materials, colors, palettes] = await Promise.all([
    sectionsCollection().get(),
    materialsDocument().get(),
    colorsDocument().get(),
    palettesDocument().get(),
  ]);

  return {
    colors: colorIdsIn(colors),
    materials: materialIdsIn(materials),
    palettes: paletteIdsIn(palettes),
    sections: sectionIdsIn(sections),
  };
}

/** Rejects with 422 an id the work names that is not one of `known`, saying what it should be. */
function assertKnown(ids: string[], known: Set<string>, kind: string): void {
  const unknown = ids.find((id) => !known.has(id));

  if (unknown !== undefined) {
    throw new UnprocessableContentError(`There is no ${kind} ${unknown}`);
  }
}

/**
 * Rejects with 409 a work moved into a collection that already holds the most works it may, as
 * saving the collection would refuse them too.
 */
async function assertCollectionHasRoom(
  transaction: Transaction,
  collectionId: string,
): Promise<void> {
  const members = worksCollection().where("collectionId", "==", collectionId).count();
  const { count } = (await transaction.get(members)).data();

  if (count >= maxCollectionWorks) {
    throw new ConflictError(`The collection already has ${String(maxCollectionWorks)} works`);
  }
}

/**
 * Rejects with 422 a section, a material, a color, a palette or a collection the work names that
 * does not exist, such as one deleted while the form was open, and with 409 a move into a full
 * collection (`currentCollectionId`, the collection the work is in now). Read in the transaction,
 * so a change made meanwhile is caught too.
 */
async function assertReferencesExist(
  transaction: Transaction,
  body: WorkBody,
  currentCollectionId: string | null,
): Promise<KnownIds> {
  const [sections, materials, colors, palettes, collection] = await Promise.all([
    transaction.get(sectionsCollection()),
    transaction.get(materialsDocument()),
    transaction.get(colorsDocument()),
    transaction.get(palettesDocument()),
    body.collectionId === null ? null : transaction.get(collectionDocument(body.collectionId)),
  ]);
  const known: KnownIds = {
    colors: colorIdsIn(colors),
    materials: materialIdsIn(materials),
    palettes: paletteIdsIn(palettes),
    sections: sectionIdsIn(sections),
  };

  assertKnown(body.sectionIds, known.sections, "section");
  assertKnown(body.materialIds, known.materials, "material");
  assertKnown(body.colorIds, known.colors, "color");
  assertKnown(body.paletteIds, known.palettes, "palette");

  if (collection?.exists === false) {
    throw new UnprocessableContentError(`There is no collection ${String(body.collectionId)}`);
  }

  if (body.collectionId !== null && body.collectionId !== currentCollectionId) {
    await assertCollectionHasRoom(transaction, body.collectionId);
  }

  return known;
}

/** The latest month first; works of one month, the latest created first. */
function compareWorks(a: StoredWork, b: StoredWork): number {
  return b.year - a.year || b.month - a.month || b.createdAt.toMillis() - a.createdAt.toMillis();
}

/** The saved works in the order the site shows them. */
export function worksInOrder(docs: DocumentSnapshot[]): { id: string; work: StoredWork }[] {
  return docs
    .map((snapshot) => ({ id: snapshot.id, work: readWork(snapshot) }))
    .sort((a, b) => compareWorks(a.work, b.work));
}

/** Every work in the order the site shows them, tagged by the stored list. */
export async function listWorks(): Promise<Tagged<Work[]>> {
  const [{ docs }, known] = await Promise.all([worksCollection().get(), readKnownIds()]);
  const works = worksInOrder(docs);
  const data = works.map(({ id, work }) => toWork(id, work, known));

  // Tagged by what is returned: deleting an item of a list a work refers to, such as a section,
  // changes the list without changing a work.
  return { data, etag: entityTag(data) };
}

export async function getWork(id: string): Promise<SavedWork> {
  const [snapshot, known] = await Promise.all([workDocument(id).get(), readKnownIds()]);

  return toSavedWork(id, readWork(snapshot), known);
}

/**
 * The new file of the photo, copied from its upload, or `undefined` when the photo keeps its saved
 * file.
 */
async function publishPhoto(
  id: string,
  uploadId: string | undefined,
): Promise<StoredImage | undefined> {
  return uploadId === undefined ? undefined : publishUpload(uploadId, photoFolder(id));
}

/** Removes the copied file of a photo that was not saved. */
async function discardPhoto(id: string, image: StoredImage | undefined): Promise<void> {
  if (image) {
    await deleteImageFilesOrWarn(photoVersionFolder(id, image.version));
  }
}

/**
 * Creates the work `id`, which the client chose; rejects it with 412 once a work has that id, such
 * as one an earlier try of the same request created. A new work has no saved photos, so its photo
 * needs an upload and a process photo cannot name an id, or it is rejected with 422, as it is for a
 * section, a material, a color, a palette or a collection that does not exist. The files are copied
 * from their uploads first; if saving fails, the copies are removed.
 */
export async function createWork(id: string, body: WorkBody): Promise<SavedWork> {
  const { alt, uploadId } = body.photo;

  if (uploadId === undefined) {
    throw new UnprocessableContentError("A new work needs an uploaded photo");
  }

  const image = await publishUpload(uploadId, photoFolder(id));
  let draft: PhotoListDraft;

  try {
    draft = await preparePhotoList(body.processPhotos, processPhotosFolder(id));
  } catch (error) {
    await discardPhoto(id, image);
    throw error;
  }

  let work: StoredWork;
  let known: KnownIds;

  try {
    [work, known] = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(workDocument(id))).exists) {
        throw new PreconditionFailedError("The work already exists");
      }

      const references = await assertReferencesExist(transaction, body, null);

      const now = Timestamp.now();
      const created: StoredWork = {
        ...body,
        createdAt: now,
        photo: { ...image, alt },
        processPhotos: draft.build([]),
        updatedAt: now,
      };

      transaction.create(workDocument(id), created);
      return [created, references];
    });
  } catch (error) {
    await Promise.all([discardPhoto(id, image), draft.discard()]);
    throw error;
  }

  // A new work has no older files to remove, and the uploads stay until the bucket deletes them.

  return toSavedWork(id, work, known);
}

/**
 * Replaces the work while it is still the one the client read (`ifMatch`). New files are copied
 * from their uploads first and the replaced ones are removed once the work is saved, so the site
 * never links to missing files; if saving fails, the copies are removed and the work stays as it
 * was. The process photos are saved as one list: a saved photo left out is deleted, see
 * preparePhotoList. A section, a material, a color, a palette or a collection that does not exist
 * is rejected with 422. Moving the work to another collection changes both collections.
 */
export async function replaceWork(id: string, body: WorkBody, ifMatch: string): Promise<SavedWork> {
  const image = await publishPhoto(id, body.photo.uploadId);
  let draft: PhotoListDraft;

  try {
    draft = await preparePhotoList(body.processPhotos, processPhotosFolder(id));
  } catch (error) {
    await discardPhoto(id, image);
    throw error;
  }

  let previous: { photo: StoredPhoto; processPhotos: StoredListPhoto[] };
  let work: StoredWork;
  let known: KnownIds;

  try {
    [previous, work, known] = await firestore().runTransaction(async (transaction) => {
      const document = workDocument(id);
      const current = readWork(await transaction.get(document));

      assertIfMatch(ifMatch, editedContent(current));

      const references = await assertReferencesExist(transaction, body, current.collectionId);

      const next: StoredWork = {
        ...current,
        ...body,
        photo: { ...(image ?? current.photo), alt: body.photo.alt },
        processPhotos: draft.build(current.processPhotos),
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      return [current, next, references];
    });
  } catch (error) {
    await Promise.all([discardPhoto(id, image), draft.discard()]);
    throw error;
  }

  if (image) {
    await deleteImageFilesOrWarn(photoVersionFolder(id, previous.photo.version));
  }

  await draft.finish(previous.processPhotos, work.processPhotos);

  return toSavedWork(id, work, known);
}

/** Deletes the work while it is still the one the client read, and then all its files. */
export async function deleteWork(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = workDocument(id);

    assertIfMatch(ifMatch, editedContent(readWork(await transaction.get(document))));
    transaction.delete(document);
  });

  await deleteImageFilesOrWarn(workFolder(id));
}
