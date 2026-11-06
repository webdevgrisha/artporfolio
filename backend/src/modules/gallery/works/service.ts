import { type DocumentSnapshot, Timestamp } from "firebase-admin/firestore";

import type { Reader } from "#modules/auth/schema";
import { colorIdsIn, galleryColors } from "#modules/gallery/colors/resource";
import { galleryMaterials, materialIdsIn } from "#modules/gallery/materials/resource";
import { galleryPalettes, paletteIdsIn } from "#modules/gallery/palettes/resource";
import { sectionGroupsIn, sectionsCollection } from "#modules/gallery/sections/service";
import { workDocument, worksCollection } from "#modules/gallery/works/document";
import {
  assertReferencesExist,
  type KnownData,
  readKnownData,
} from "#modules/gallery/works/references";
import { toWork, toWorkSummary } from "#modules/gallery/works/representation";
import {
  type StoredWork,
  storedWorkSchema,
  type Work,
  type WorkBody,
  type WorkSummary,
  type WorkUsage,
} from "#modules/gallery/works/schema";
import { workTexts } from "#modules/gallery/works/texts";
import { ownGroups, usageByItem } from "#modules/gallery/works/usage";
import { firestore } from "#shared/firebase/firestore";
import {
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { saveTranslations } from "#shared/i18n/translating";
import { preparePhotoList } from "#shared/images/photo-list";
import { saveWithImages } from "#shared/images/saving";
import { deleteImageFilesOrWarn } from "#shared/images/stored-image";

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
 * How the works, hidden ones too, use each section, material, color and palette, tagged by what is
 * returned. Counted afresh from every work on each request, so it never drifts from the works.
 */
export async function getWorkUsage(): Promise<Tagged<WorkUsage>> {
  const [{ docs }, sections, materials, colors, palettes] = await Promise.all([
    worksCollection().get(),
    sectionsCollection().get(),
    galleryMaterials.document().get(),
    galleryColors.document().get(),
    galleryPalettes.document().get(),
  ]);
  const works = docs.map(readWork);
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
 * Creates the work `id`, which the client chose; rejects it with 412 once a work has that id, such
 * as one an earlier try of the same request created. A new work has no saved photos, so its photo
 * needs an upload and a process photo cannot name an id, or it is rejected with 422, as it is for a
 * section, a material, a color, a palette or a collection that does not exist.
 */
export async function createWork(id: string, body: WorkBody): Promise<Tagged<Work>> {
  const { alt, uploadId } = body.photo;

  if (uploadId === undefined) {
    throw new UnprocessableContentError("A new work needs an uploaded photo");
  }

  return saveWithImages(async (files) => {
    const translations = await saveTranslations(workTexts(body), {}, body.translations);
    const image = await files.publish(uploadId, photoFolder(id));
    const draft = await preparePhotoList(files, body.processPhotos, processPhotosFolder(id));
    const [work, known] = await firestore().runTransaction(async (transaction) => {
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
        translations,
        updatedAt: now,
      };

      transaction.create(workDocument(id), created);
      return [created, references] as const;
    });

    return toSavedWork(id, work, known);
  });
}

/**
 * Replaces the work while it is still the one the client read (`ifMatch`). The process photos are
 * saved as one list: a saved photo left out is deleted, see preparePhotoList. A section, a
 * material, a color, a palette or a collection that does not exist is rejected with 422. Moving
 * the work to another collection changes both collections. The translator runs before the
 * transaction, which may run several times: the tag checked there covers the translations, so the
 * ones it started from are still the saved ones.
 */
export function replaceWork(id: string, body: WorkBody, ifMatch: string): Promise<Tagged<Work>> {
  const { alt, uploadId } = body.photo;

  return saveWithImages(async (files) => {
    const [snapshot, knownBefore] = await Promise.all([workDocument(id).get(), readKnownData()]);
    const saved = readWork(snapshot);

    // Nothing is paid for a change that the check in the transaction would reject anyway.
    assertWorkIfMatch(ifMatch, id, saved, knownBefore);

    const translations = await saveTranslations(
      workTexts(body),
      saved.translations,
      body.translations,
    );
    const image =
      uploadId === undefined ? undefined : await files.publish(uploadId, photoFolder(id));
    const draft = await preparePhotoList(files, body.processPhotos, processPhotosFolder(id));
    const [previous, work, known] = await firestore().runTransaction(async (transaction) => {
      const document = workDocument(id);
      const current = readWork(await transaction.get(document));
      const references = await readKnownData(transaction);

      assertWorkIfMatch(ifMatch, id, current, references);
      await assertReferencesExist(transaction, body, current.collectionId, references);

      const next: StoredWork = {
        ...current,
        ...body,
        photo: { ...(image ?? current.photo), alt },
        processPhotos: draft.build(current.processPhotos),
        translations,
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      return [current, next, references] as const;
    });

    if (image) {
      files.removeAfterSave(photoVersionFolder(id, previous.photo.version));
    }

    draft.removeUnused(previous.processPhotos, work.processPhotos);

    return toSavedWork(id, work, known);
  });
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
