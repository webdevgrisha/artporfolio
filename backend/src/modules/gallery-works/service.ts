import { type DocumentSnapshot, Timestamp, type Transaction } from "firebase-admin/firestore";

import { sectionIdsIn, sectionsCollection } from "#modules/gallery-sections/service";

import {
  type StoredWork,
  storedWorkSchema,
  type Work,
  type WorkBody,
} from "#modules/gallery-works/schema";
import { firestore } from "#shared/firebase/firestore";
import {
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

function worksCollection() {
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
  description,
  month,
  photo,
  processPhotos,
  sectionIds,
  size,
  title,
  year,
}: StoredWork) {
  return { description, month, photo, processPhotos, sectionIds, size, title, year };
}

/**
 * The stored work as the API returns it, with download URLs and ISO 8601 dates. A section deleted
 * since the work was saved is left out of its sections (`sectionIds`, the ids that exist).
 */
function toWork(
  id: string,
  {
    createdAt,
    description,
    month,
    photo,
    processPhotos,
    sectionIds,
    size,
    title,
    updatedAt,
    year,
  }: StoredWork,
  knownSectionIds: Set<string>,
): Work {
  return {
    createdAt: createdAt.toDate().toISOString(),
    description,
    id,
    month,
    photo: toPhoto(photo),
    processPhotos: processPhotos.map(toListPhoto),
    sectionIds: sectionIds.filter((sectionId) => knownSectionIds.has(sectionId)),
    size,
    title,
    updatedAt: updatedAt.toDate().toISOString(),
    year,
  };
}

function toSavedWork(id: string, work: StoredWork, knownSectionIds: Set<string>): SavedWork {
  return { data: toWork(id, work, knownSectionIds), etag: entityTag(editedContent(work)), id };
}

/** The ids of every section and subsection, which a work may refer to. */
async function readSectionIds(): Promise<Set<string>> {
  return sectionIdsIn(await sectionsCollection().get());
}

/**
 * Rejects with 422 a section the work names that does not exist, such as one deleted while the
 * form was open. Read in the transaction, so a section deleted meanwhile is caught too.
 */
async function assertSectionsExist(transaction: Transaction, ids: string[]): Promise<Set<string>> {
  const known = sectionIdsIn(await transaction.get(sectionsCollection()));
  const unknown = ids.find((id) => !known.has(id));

  if (unknown !== undefined) {
    throw new UnprocessableContentError(`There is no section ${unknown}`);
  }

  return known;
}

/** The latest month first; works of one month, the latest created first. */
function compareWorks(a: StoredWork, b: StoredWork): number {
  return b.year - a.year || b.month - a.month || b.createdAt.toMillis() - a.createdAt.toMillis();
}

/** Every work in the order the site shows them, tagged by the stored list. */
export async function listWorks(): Promise<Tagged<Work[]>> {
  const [{ docs }, knownSectionIds] = await Promise.all([
    worksCollection().get(),
    readSectionIds(),
  ]);
  const works = docs
    .map((snapshot) => ({ id: snapshot.id, work: readWork(snapshot) }))
    .sort((a, b) => compareWorks(a.work, b.work));
  const data = works.map(({ id, work }) => toWork(id, work, knownSectionIds));

  // Tagged by what is returned: deleting a section changes the list without changing a work.
  return { data, etag: entityTag(data) };
}

export async function getWork(id: string): Promise<SavedWork> {
  const [snapshot, knownSectionIds] = await Promise.all([workDocument(id).get(), readSectionIds()]);

  return toSavedWork(id, readWork(snapshot), knownSectionIds);
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
 * section that does not exist. The files are copied from their uploads first; if saving fails, the
 * copies are removed.
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
  let knownSectionIds: Set<string>;

  try {
    [work, knownSectionIds] = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(workDocument(id))).exists) {
        throw new PreconditionFailedError("The work already exists");
      }

      const known = await assertSectionsExist(transaction, body.sectionIds);

      const now = Timestamp.now();
      const created: StoredWork = {
        ...body,
        createdAt: now,
        photo: { ...image, alt },
        processPhotos: draft.build([]),
        updatedAt: now,
      };

      transaction.create(workDocument(id), created);
      return [created, known];
    });
  } catch (error) {
    await Promise.all([discardPhoto(id, image), draft.discard()]);
    throw error;
  }

  // A new work has no older files, so this removes only the used uploads.
  await draft.finish([], work.processPhotos);

  return toSavedWork(id, work, knownSectionIds);
}

/**
 * Replaces the work while it is still the one the client read (`ifMatch`). New files are copied
 * from their uploads first and the replaced ones are removed once the work is saved, so the site
 * never links to missing files; if saving fails, the copies are removed and the work stays as it
 * was. The process photos are saved as one list: a saved photo left out is deleted, see
 * preparePhotoList. A section that does not exist is rejected with 422.
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
  let knownSectionIds: Set<string>;

  try {
    [previous, work, knownSectionIds] = await firestore().runTransaction(async (transaction) => {
      const document = workDocument(id);
      const current = readWork(await transaction.get(document));

      assertIfMatch(ifMatch, editedContent(current));

      const known = await assertSectionsExist(transaction, body.sectionIds);

      const next: StoredWork = {
        ...current,
        ...body,
        photo: { ...(image ?? current.photo), alt: body.photo.alt },
        processPhotos: draft.build(current.processPhotos),
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      return [current, next, known];
    });
  } catch (error) {
    await Promise.all([discardPhoto(id, image), draft.discard()]);
    throw error;
  }

  if (image) {
    await deleteImageFilesOrWarn(photoVersionFolder(id, previous.photo.version));
  }

  await draft.finish(previous.processPhotos, work.processPhotos);

  return toSavedWork(id, work, knownSectionIds);
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
