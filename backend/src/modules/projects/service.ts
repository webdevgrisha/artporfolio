import { type QuerySnapshot, Timestamp } from "firebase-admin/firestore";

import { orderedProjects, projectDocument, readProject } from "#modules/projects/document";
import type { Project, ProjectBody, StoredProject } from "#modules/projects/schema";
import { newProjectSlug } from "#modules/projects/slug";
import { firestore } from "#shared/firebase/firestore";
import { ConflictError, PreconditionFailedError } from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import type { Language } from "#shared/i18n/languages";
import { readEachTranslations, translatedText } from "#shared/i18n/translated-text";
import {
  deleteTranslations,
  requestTranslations,
  saveSources,
} from "#shared/i18n/translation-requests";
import type { StoredTranslations } from "#shared/i18n/translations";
import { textsById } from "#shared/i18n/translations";
import { preparePhotoList, toListPhoto } from "#shared/images/photo-list";
import { saveWithImages } from "#shared/images/saving";
import { deleteImageFilesOrWarn } from "#shared/images/stored-image";
import { titleKey } from "#shared/text/titles";

/** Every file of the project; deleting the project removes the folder. */
function projectFolder(id: string): string {
  return `projects/${id}`;
}

function photosFolder(id: string): string {
  return `${projectFolder(id)}/photos`;
}

/** Where the translations of the project go. */
function projectTranslations(id: string): string {
  return `project-${id}`;
}

/**
 * The texts of a project the site shows in every language: the alt text of a photo goes by the id
 * of the photo. No form shows those: they are translated and stay as made.
 */
function projectTexts({ description, photos, title }: StoredProject) {
  return { description, title, ...textsById(photos, ({ alt }) => alt) };
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

/** The stored project as the API returns it, with download URLs and ISO 8601 dates. */
function toProject(
  id: string,
  { createdAt, description, link, photos, slug, title, updatedAt }: StoredProject,
): Project {
  return {
    createdAt: createdAt.toDate().toISOString(),
    description,
    id,
    link,
    photos: photos.map(toListPhoto),
    slug,
    title,
    updatedAt: updatedAt.toDate().toISOString(),
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

/** The project with its title, description and alt texts in `language`. */
function translatedProject(
  project: Project,
  translations: StoredTranslations,
  language: Language,
): Project {
  return {
    ...project,
    description: translatedText(translations, language, "description", project.description),
    photos: project.photos.map((photo) => ({
      ...photo,
      alt: translatedText(translations, language, photo.id, photo.alt),
    })),
    title: translatedText(translations, language, "title", project.title),
  };
}

/**
 * Every project in the order the site shows them, with the texts in `language`, tagged by that
 * list. The admin reads them in the source language, in which they are saved.
 */
export async function listProjects(language: Language): Promise<Tagged<Project[]>> {
  const { docs } = await orderedProjects().get();
  const translations = await readEachTranslations(
    docs.map(({ id }) => projectTranslations(id)),
    language,
  );
  const data = docs.map((snapshot, index) =>
    translatedProject(
      toProject(snapshot.id, readProject(snapshot)),
      translations[index] ?? {},
      language,
    ),
  );

  return { data, etag: entityTag(data) };
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
    const draft = await preparePhotoList(files, body.photos, photosFolder(id));
    const project = await firestore().runTransaction(async (transaction) => {
      if ((await transaction.get(projectDocument(id))).exists) {
        throw new PreconditionFailedError("The project already exists");
      }

      const saved = await transaction.get(orderedProjects());
      assertTitleIsFree(id, body.title, saved);

      const first = saved.docs[0];
      const position = first ? readProject(first).position - 1 : 0;
      const slugs = new Set(saved.docs.map((snapshot) => readProject(snapshot).slug));
      const now = Timestamp.now();
      const created: StoredProject = {
        ...body,
        createdAt: now,
        photos: draft.build([]),
        position,
        slug: newProjectSlug(body.title, slugs),
        updatedAt: now,
      };

      transaction.create(projectDocument(id), created);
      saveSources(transaction, projectTranslations(id), projectTexts(created));
      return created;
    });

    await requestTranslations(projectTranslations(id));

    return toSavedProject(id, project);
  });
}

/**
 * Replaces the project while it is still the one the client read (`ifMatch`); it keeps its place
 * in the list. The photos are saved as one list: a saved photo left out is deleted, see
 * preparePhotoList.
 */
export function replaceProject(
  id: string,
  body: ProjectBody,
  ifMatch: string,
): Promise<Tagged<Project>> {
  return saveWithImages(async (files) => {
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
        updatedAt: Timestamp.now(),
      };

      transaction.set(document, next);
      saveSources(transaction, projectTranslations(id), projectTexts(next));
      return [current.photos, next] as const;
    });

    draft.removeUnused(savedPhotos, project.photos);
    await requestTranslations(projectTranslations(id));

    return toSavedProject(id, project);
  });
}

/** Deletes the project while it is still the one the client read, and then all its files. */
export async function deleteProject(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = projectDocument(id);

    assertIfMatch(ifMatch, toProject(id, readProject(await transaction.get(document))));
    transaction.delete(document);
    deleteTranslations(transaction, projectTranslations(id));
  });

  await deleteImageFilesOrWarn(projectFolder(id));
}
