import { type DocumentSnapshot, type QuerySnapshot, Timestamp } from "firebase-admin/firestore";

import {
  type Project,
  type ProjectBody,
  type StoredProject,
  storedProjectSchema,
} from "#modules/projects/schema";
import { firestore } from "#shared/firebase/firestore";
import {
  NotFoundError,
  PreconditionFailedError,
  UnprocessableContentError,
} from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { preparePhotoList, type StoredListPhoto, toListPhoto } from "#shared/images/photo-list";
import { deleteImageFilesOrWarn } from "#shared/images/storage";

/** A saved project with the id it is known by. */
export interface SavedProject extends Tagged<Project> {
  id: string;
}

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
 * What the client edits, which the entity tag of a project follows. The position is left out:
 * reordering the projects must not make an open edit form outdated.
 */
function editedContent({ description, link, photos, title }: StoredProject) {
  return { description, link, photos, title };
}

/** The stored project as the API returns it, with download URLs and ISO 8601 dates. */
function toProject(
  id: string,
  { createdAt, description, link, photos, title, updatedAt }: StoredProject,
): Project {
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

function toSavedProject(id: string, project: StoredProject): SavedProject {
  return { data: toProject(id, project), etag: entityTag(editedContent(project)), id };
}

/** Every project in the order the site shows them, tagged by the stored list. */
export async function listProjects(): Promise<Tagged<Project[]>> {
  const { docs } = await orderedProjects().get();
  const projects = docs.map((snapshot) => ({ id: snapshot.id, project: readProject(snapshot) }));

  return {
    data: projects.map(({ id, project }) => toProject(id, project)),
    etag: entityTag(projects),
  };
}

export async function getProject(id: string): Promise<SavedProject> {
  return toSavedProject(id, readProject(await projectDocument(id).get()));
}

/**
 * Creates the project `id`, which the client chose, at the top of the list; rejects it with 412
 * once a project has that id, such as one an earlier try of the same request created. The photo
 * files are copied from their uploads first; if saving fails, the copies are removed. Every photo
 * of a new project is new: a photo `id` refers to nothing, so it is rejected with 422.
 */
export async function createProject(id: string, body: ProjectBody): Promise<SavedProject> {
  const draft = await preparePhotoList(body.photos, photosFolder(id));
  let project: StoredProject;

  try {
    project = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(projectDocument(id))).exists) {
        throw new PreconditionFailedError("The project already exists");
      }

      const { docs } = await transaction.get(orderedProjects().limit(1));
      const first = docs[0];
      const position = first ? readProject(first).position - 1 : 0;
      const now = Timestamp.now();
      const created: StoredProject = {
        ...body,
        createdAt: now,
        photos: draft.build([]),
        position,
        updatedAt: now,
      };

      transaction.create(projectDocument(id), created);
      return created;
    });
  } catch (error) {
    await draft.discard();
    throw error;
  }

  // A new project has no older files, so this removes only the used uploads.
  await draft.finish([], project.photos);

  return toSavedProject(id, project);
}

/**
 * Replaces the project while it is still the one the client read (`ifMatch`); it keeps its place
 * in the list. The photos are saved as one list: a saved photo left out is deleted, see
 * preparePhotoList. If anything fails, the copies are removed and the project stays as it was.
 */
export async function replaceProject(
  id: string,
  body: ProjectBody,
  ifMatch: string,
): Promise<SavedProject> {
  const draft = await preparePhotoList(body.photos, photosFolder(id));
  let savedPhotos: StoredListPhoto[];
  let project: StoredProject;

  try {
    [savedPhotos, project] = await firestore().runTransaction(async (transaction) => {
      const document = projectDocument(id);
      const current = readProject(await transaction.get(document));

      assertIfMatch(ifMatch, editedContent(current));

      const next: StoredProject = {
        ...current,
        ...body,
        photos: draft.build(current.photos),
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      return [current.photos, next];
    });
  } catch (error) {
    await draft.discard();
    throw error;
  }

  await draft.finish(savedPhotos, project.photos);

  return toSavedProject(id, project);
}

/** Deletes the project while it is still the one the client read, and then all its files. */
export async function deleteProject(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = projectDocument(id);

    assertIfMatch(ifMatch, editedContent(readProject(await transaction.get(document))));
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
