import { type DocumentSnapshot, type QuerySnapshot, Timestamp } from "firebase-admin/firestore";

import {
  type Project,
  type ProjectBody,
  type ProjectSummary,
  type StoredProject,
  storedProjectSchema,
} from "#modules/projects/schema";
import { firestore } from "#shared/firebase/firestore";
import {
  ConflictError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { saveTranslations } from "#shared/i18n/translating";
import { toTranslations } from "#shared/i18n/translations";
import { preparePhotoList, toListPhoto } from "#shared/images/photo-list";
import { saveWithImages } from "#shared/images/saving";
import { deleteImageFilesOrWarn } from "#shared/images/stored-image";
import { titleKey } from "#shared/text/titles";

function projectsCollection() {
  return firestore().collection("projects");
}

function projectDocument(id: string) {
  return projectsCollection().doc(id);
}

/** The projects in the order the site shows them. */
function orderedProjects() {
  return projectsCollection().orderBy("position");
}

/** Every file of the project; deleting the project removes the folder. */
function projectFolder(id: string): string {
  return `projects/${id}`;
}

function photosFolder(id: string): string {
  return `${projectFolder(id)}/photos`;
}

function readProject(snapshot: DocumentSnapshot): StoredProject {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no project");
  }

  return storedProjectSchema.parse(snapshot.data());
}

/**
 * Rejects with 409 a title that another project has, whatever the case: the visitor tells the
 * projects apart by their titles.
 */
function assertTitleIsFree(id: string, title: string, { docs }: QuerySnapshot): void {
  const isTaken = docs.some(
    (snapshot) => snapshot.id !== id && titleKey(readProject(snapshot).title) === titleKey(title),
  );

  if (isTaken) {
    throw new ConflictError("Another project has this title");
  }
}

/** The texts of a project in the source language, by the field their translations go under. */
function projectTexts({
  description,
  title,
}: Pick<StoredProject, "description" | "title">): Record<string, string> {
  return { description, title };
}

/** The stored project as the list returns it, with download URLs and ISO 8601 dates. */
function toProjectSummary(
  id: string,
  { createdAt, description, link, photos, title, updatedAt }: StoredProject,
): ProjectSummary {
  return {
    createdAt: createdAt.toDate().toISOString(),
    description,
    id,
    link,
    photos: photos.map(toListPhoto),
    title,
    updatedAt: updatedAt.toDate().toISOString(),
  };
}

/** The stored project as the API returns it alone: its summary and its translations. */
function toProject(id: string, project: StoredProject): Project {
  return {
    ...toProjectSummary(id, project),
    translations: toTranslations(project.translations, projectTexts(project)),
  };
}

/**
 * The project as the API returns it, tagged by that representation. It has no position: reordering
 * the projects does not make an open edit form outdated.
 */
function toSavedProject(id: string, project: StoredProject): Tagged<Project> {
  const data = toProject(id, project);

  return { data, etag: entityTag(data) };
}

/** Every project in the order the site shows them, tagged by the stored list. */
export async function listProjects(): Promise<Tagged<ProjectSummary[]>> {
  const { docs } = await orderedProjects().get();
  const projects = docs.map((snapshot) => ({ id: snapshot.id, project: readProject(snapshot) }));

  return {
    data: projects.map(({ id, project }) => toProjectSummary(id, project)),
    etag: entityTag(projects),
  };
}

export async function getProject(id: string): Promise<Tagged<Project>> {
  return toSavedProject(id, readProject(await projectDocument(id).get()));
}

/**
 * Creates the project `id`, which the client chose, at the top of the list; rejects it with 412
 * once a project has that id, such as one an earlier try of the same request created, and with 409
 * when another project has its title. Every photo of a new project is new: a photo `id` refers to
 * nothing, so it is rejected with 422.
 */
export function createProject(id: string, body: ProjectBody): Promise<Tagged<Project>> {
  return saveWithImages(async (files) => {
    const translations = await saveTranslations(projectTexts(body), {}, body.translations);
    const draft = await preparePhotoList(files, body.photos, photosFolder(id));
    const project = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(projectDocument(id))).exists) {
        throw new PreconditionFailedError("The project already exists");
      }

      const saved = await transaction.get(orderedProjects());
      assertTitleIsFree(id, body.title, saved);

      const first = saved.docs[0];
      const position = first ? readProject(first).position - 1 : 0;
      const now = Timestamp.now();
      const created: StoredProject = {
        ...body,
        createdAt: now,
        photos: draft.build([]),
        position,
        translations,
        updatedAt: now,
      };

      transaction.create(projectDocument(id), created);
      return created;
    });

    return toSavedProject(id, project);
  });
}

/**
 * Replaces the project while it is still the one the client read (`ifMatch`); it keeps its place
 * in the list. The photos are saved as one list: a saved photo left out is deleted, see
 * preparePhotoList. The translator runs before the transaction, which may run several times: the
 * tag checked there covers the translations, so the ones it started from are still the saved ones.
 */
export function replaceProject(
  id: string,
  body: ProjectBody,
  ifMatch: string,
): Promise<Tagged<Project>> {
  return saveWithImages(async (files) => {
    const saved = readProject(await projectDocument(id).get());

    // Nothing is paid for a change that the check in the transaction would reject anyway.
    assertIfMatch(ifMatch, toProject(id, saved));

    const translations = await saveTranslations(
      projectTexts(body),
      saved.translations,
      body.translations,
    );
    const draft = await preparePhotoList(files, body.photos, photosFolder(id));
    const [savedPhotos, project] = await firestore().runTransaction(async (transaction) => {
      const document = projectDocument(id);
      const current = readProject(await transaction.get(document));

      assertIfMatch(ifMatch, toProject(id, current));
      assertTitleIsFree(id, body.title, await transaction.get(orderedProjects()));

      const next: StoredProject = {
        ...current,
        ...body,
        photos: draft.build(current.photos),
        translations,
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      return [current.photos, next] as const;
    });

    draft.removeUnused(savedPhotos, project.photos);

    return toSavedProject(id, project);
  });
}

/** Deletes the project while it is still the one the client read, and then all its files. */
export async function deleteProject(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = projectDocument(id);

    assertIfMatch(ifMatch, toProject(id, readProject(await transaction.get(document))));
    transaction.delete(document);
  });

  await deleteImageFilesOrWarn(projectFolder(id));
}

/** The order alone: the query reads no field of a project but its position. */
function orderQuery() {
  return orderedProjects().select("position");
}

function idsOf({ docs }: QuerySnapshot): string[] {
  return docs.map((snapshot) => snapshot.id);
}

/** The order of the projects, tagged by the ids in that order. */
export async function getProjectsOrder(): Promise<Tagged<string[]>> {
  const ids = idsOf(await orderQuery().get());

  return { data: ids, etag: entityTag(ids) };
}

function isSameSet(ids: string[], current: string[]): boolean {
  const known = new Set(current);

  return ids.length === current.length && ids.every((id) => known.has(id));
}

/**
 * Puts the projects in the order of `ids` while the order is still the one the client read
 * (`ifMatch`). The ids must name every project once: a project left out would have no place.
 */
export async function replaceProjectsOrder(
  ids: string[],
  ifMatch: string,
): Promise<Tagged<string[]>> {
  await firestore().runTransaction(async (transaction) => {
    const current = idsOf(await transaction.get(orderQuery()));

    assertIfMatch(ifMatch, current);

    if (!isSameSet(ids, current)) {
      throw new UnprocessableContentError("The order must list every project once");
    }

    for (const [position, id] of ids.entries()) {
      transaction.update(projectDocument(id), { position });
    }
  });

  return { data: ids, etag: entityTag(ids) };
}
