import type { DocumentReference, Transaction } from "firebase-admin/firestore";

import { currencyRates } from "#modules/currencies/resource";
import { collectionDocument } from "#modules/gallery/collections/document";
import { maxCollectionWorks } from "#modules/gallery/collections/schema";
import { colorIdsIn, galleryColors } from "#modules/gallery/colors/resource";
import { galleryMaterials, materialIdsIn } from "#modules/gallery/materials/resource";
import { galleryPalettes, paletteIdsIn } from "#modules/gallery/palettes/resource";
import { sectionIdsIn, sectionsCollection } from "#modules/gallery/sections/document";
import { worksCollection } from "#modules/gallery/works/document";
import type { WorkBody } from "#modules/gallery/works/schema";
import { ConflictError, UnprocessableContentError } from "#shared/http/errors";

/** What a work is returned by: the saved items of each list it refers to, and the rates. */
export interface KnownData {
  /** Every section and subsection. */
  sections: Set<string>;
  materials: Set<string>;
  colors: Set<string>;
  palettes: Set<string>;
  /** How many units of each currency in use one US dollar buys. */
  rates: Record<string, number>;
}

/** Everything a work is returned by, read in `transaction` when there is one. */
export async function readKnownData(transaction?: Transaction): Promise<KnownData> {
  const read = (document: DocumentReference) =>
    transaction ? transaction.get(document) : document.get();

  const [sections, materials, colors, palettes, rates] = await Promise.all([
    transaction ? transaction.get(sectionsCollection()) : sectionsCollection().get(),
    read(galleryMaterials.document()),
    read(galleryColors.document()),
    read(galleryPalettes.document()),
    read(currencyRates.document()),
  ]);

  return {
    colors: colorIdsIn(colors),
    materials: materialIdsIn(materials),
    palettes: paletteIdsIn(palettes),
    rates: currencyRates.read(rates).rates,
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
export async function assertReferencesExist(
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
