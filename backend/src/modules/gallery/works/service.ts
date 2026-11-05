import { type DocumentSnapshot, Timestamp, type Transaction } from "firebase-admin/firestore";

import type { Reader } from "#modules/auth/schema";
import { ratesDocument, ratesIn } from "#modules/currencies/service";
import { collectionDocument } from "#modules/gallery/collections/document";
import { maxCollectionWorks } from "#modules/gallery/collections/schema";
import { colorIdsIn, colorsDocument } from "#modules/gallery/colors/service";
import { materialIdsIn, materialsDocument } from "#modules/gallery/materials/service";
import { paletteIdsIn, palettesDocument } from "#modules/gallery/palettes/service";
import {
  sectionGroupsIn,
  sectionIdsIn,
  sectionsCollection,
} from "#modules/gallery/sections/service";
import { workDocument, worksCollection } from "#modules/gallery/works/document";
import { pricesIn } from "#modules/gallery/works/prices";
import {
  discountedAmount,
  type StoredWork,
  storedWorkSchema,
  type Work,
  type WorkBody,
  type WorkSummary,
  type WorkUsage,
} from "#modules/gallery/works/schema";
import { ownGroups, usageByItem } from "#modules/gallery/works/usage";
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
import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/stored-image";
import { publishUpload } from "#shared/images/uploads";

/** What a work is returned by: the saved items of each list it refers to, and the rates. */
interface KnownData {
  /** Every section and subsection. */
  sections: Set<string>;
  materials: Set<string>;
  colors: Set<string>;
  palettes: Set<string>;
  /** How many units of each currency in use one US dollar buys. */
  rates: Record<string, number>;
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

const centimetresPerInch = 2.54;

/**
 * A side in inches, rounded to hundredths. A side measured in inches with two decimals and saved in
 * centimetres comes back as measured: 16 inches are stored as 40.64 cm and read as 16 again.
 */
function toInches(centimetres: number): number {
  return Math.round((centimetres / centimetresPerInch) * 100) / 100;
}

/**
 * The price as the API returns it, with the amount after the discount rounded to a whole unit, and
 * the price in every other currency in use.
 */
function toPrice(price: StoredWork["price"], rates: Record<string, number>): Work["price"] {
  if (price === null) {
    return null;
  }

  const { amount, currency, discountPercent } = price;

  return {
    amount,
    currency,
    discountPercent,
    finalAmount: discountedAmount(amount, discountPercent),
    prices: pricesIn(price, rates),
  };
}

/**
 * The stored work as the list of works returns it, with download URLs and ISO 8601 dates. A
 * section, a material, a color or a palette deleted since the work was saved is left out (`known`,
 * the ids that exist).
 */
function toWorkSummary(
  id: string,
  {
    city,
    collectionId,
    colorIds,
    country,
    createdAt,
    format,
    materialIds,
    month,
    paletteIds,
    partCount,
    photo,
    price,
    published,
    saleStatus,
    sectionIds,
    size,
    title,
    updatedAt,
    year,
  }: StoredWork,
  known: KnownData,
): WorkSummary {
  return {
    city,
    collectionId,
    colorIds: colorIds.filter((colorId) => known.colors.has(colorId)),
    country,
    createdAt: createdAt.toDate().toISOString(),
    format,
    id,
    materialIds: materialIds.filter((materialId) => known.materials.has(materialId)),
    month,
    paletteIds: paletteIds.filter((paletteId) => known.palettes.has(paletteId)),
    partCount,
    photo: toPhoto(photo),
    price: toPrice(price, known.rates),
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

/** The stored work as the API returns it alone: its summary, its description and process photos. */
function toWork(id: string, work: StoredWork, known: KnownData): Work {
  return {
    ...toWorkSummary(id, work, known),
    description: work.description,
    processPhotos: work.processPhotos.map(toListPhoto),
  };
}

/**
 * The work as the API returns it, tagged by that representation: deleting a section, a material, a
 * color or a palette the work refers to, or changing a rate, changes what is returned, and so its
 * tag, without changing the stored work.
 */
function toSavedWork(id: string, work: StoredWork, known: KnownData): Tagged<Work> {
  const data = toWork(id, work, known);

  return { data, etag: entityTag(data) };
}

/**
 * Rejects with 412 a change of the work unless `ifMatch` names the tag of the work as it is
 * returned now.
 */
function assertWorkIfMatch(ifMatch: string, id: string, work: StoredWork, known: KnownData): void {
  assertIfMatch(ifMatch, toWork(id, work, known));
}

/** Everything a work is returned by, read in `transaction` when there is one. */
async function readKnownData(transaction?: Transaction): Promise<KnownData> {
  const [sections, materials, colors, palettes, rates] = await Promise.all([
    transaction ? transaction.get(sectionsCollection()) : sectionsCollection().get(),
    transaction ? transaction.get(materialsDocument()) : materialsDocument().get(),
    transaction ? transaction.get(colorsDocument()) : colorsDocument().get(),
    transaction ? transaction.get(palettesDocument()) : palettesDocument().get(),
    transaction ? transaction.get(ratesDocument()) : ratesDocument().get(),
  ]);

  return {
    colors: colorIdsIn(colors),
    materials: materialIdsIn(materials),
    palettes: paletteIdsIn(palettes),
    rates: ratesIn(rates),
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
 * Rejects with 422 a section, a material, a color, a palette (`known`, read in the transaction) or
 * a collection the work names that does not exist, such as one deleted while the form was open,
 * and with 409 a move into a full collection (`currentCollectionId`, the collection the work is in
 * now). Read in the transaction, so a change made meanwhile is caught too.
 */
async function assertReferencesExist(
  transaction: Transaction,
  body: WorkBody,
  currentCollectionId: string | null,
  known: KnownData,
): Promise<void> {
  const collection =
    body.collectionId === null
      ? null
      : await transaction.get(collectionDocument(body.collectionId));

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
}

/** The latest month first; works of one month, the latest created first. */
function compareWorks(a: StoredWork, b: StoredWork): number {
  return b.year - a.year || b.month - a.month || b.createdAt.toMillis() - a.createdAt.toMillis();
}

/** Whether `reader` sees the work: a hidden work is the admin's alone. */
export function isVisibleTo(work: StoredWork, reader: Reader): boolean {
  return work.published || reader === "admin";
}

/** The saved works in the order the site shows them. */
export function worksInOrder(docs: DocumentSnapshot[]): { id: string; work: StoredWork }[] {
  return docs
    .map((snapshot) => ({ id: snapshot.id, work: readWork(snapshot) }))
    .sort((a, b) => compareWorks(a.work, b.work));
}

/**
 * Every work `reader` sees in the order the site shows them, each by its summary, tagged by what is
 * returned.
 */
export async function listWorks(reader: Reader): Promise<Tagged<WorkSummary[]>> {
  const [{ docs }, known] = await Promise.all([worksCollection().get(), readKnownData()]);
  const works = worksInOrder(docs).filter(({ work }) => isVisibleTo(work, reader));
  const data = works.map(({ id, work }) => toWorkSummary(id, work, known));

  // Tagged by what is returned: deleting an item of a list a work refers to, such as a section, or
  // changing a rate, changes the list without changing a work.
  return { data, etag: entityTag(data) };
}

/**
 * How the works `reader` sees use each section, material, color and palette, tagged by what is
 * returned. Counted afresh from every work on each request, so it never drifts from the works.
 */
export async function getWorkUsage(reader: Reader): Promise<Tagged<WorkUsage>> {
  const [{ docs }, sections, materials, colors, palettes] = await Promise.all([
    worksCollection().get(),
    sectionsCollection().get(),
    materialsDocument().get(),
    colorsDocument().get(),
    palettesDocument().get(),
  ]);
  const works = docs.map(readWork).filter((work) => isVisibleTo(work, reader));
  const data: WorkUsage = {
    sections: usageByItem(
      works.map((work) => work.sectionIds),
      sectionGroupsIn(sections),
    ),
    materials: usageByItem(
      works.map((work) => work.materialIds),
      ownGroups(materialIdsIn(materials)),
    ),
    colors: usageByItem(
      works.map((work) => work.colorIds),
      ownGroups(colorIdsIn(colors)),
    ),
    palettes: usageByItem(
      works.map((work) => work.paletteIds),
      ownGroups(paletteIdsIn(palettes)),
    ),
  };

  return { data, etag: entityTag(data) };
}

/** The work `id`; a hidden work is not found for a visitor, as if there were none. */
export async function getWork(id: string, reader: Reader): Promise<Tagged<Work>> {
  const [snapshot, known] = await Promise.all([workDocument(id).get(), readKnownData()]);
  const work = readWork(snapshot);

  if (!isVisibleTo(work, reader)) {
    throw new NotFoundError("There is no work");
  }

  return toSavedWork(id, work, known);
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
export async function createWork(id: string, body: WorkBody): Promise<Tagged<Work>> {
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
  let known: KnownData;

  try {
    [work, known] = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(workDocument(id))).exists) {
        throw new PreconditionFailedError("The work already exists");
      }

      const references = await readKnownData(transaction);

      await assertReferencesExist(transaction, body, null, references);

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
export async function replaceWork(
  id: string,
  body: WorkBody,
  ifMatch: string,
): Promise<Tagged<Work>> {
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
  let known: KnownData;

  try {
    [previous, work, known] = await firestore().runTransaction(async (transaction) => {
      const document = workDocument(id);
      const current = readWork(await transaction.get(document));
      const references = await readKnownData(transaction);

      assertWorkIfMatch(ifMatch, id, current, references);
      await assertReferencesExist(transaction, body, current.collectionId, references);

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
    const current = readWork(await transaction.get(document));

    assertWorkIfMatch(ifMatch, id, current, await readKnownData(transaction));
    transaction.delete(document);
  });

  await deleteImageFilesOrWarn(workFolder(id));
}
