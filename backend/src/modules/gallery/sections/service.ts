import type { QuerySnapshot } from "firebase-admin/firestore";

import {
  readSection,
  sectionDocument,
  sectionsCollection,
} from "#modules/gallery/sections/document";
import type { Section, SectionBody, StoredSection } from "#modules/gallery/sections/schema";
import { firestore } from "#shared/firebase/firestore";
import { ConflictError, PreconditionFailedError } from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import {
  deleteTranslations,
  requestTranslations,
  saveSources,
} from "#shared/i18n/translation-requests";
import { textsById } from "#shared/i18n/translations";
import { byTitle, titleKey } from "#shared/text/titles";

/** Where the translations of the section go. */
function sectionTranslations(id: string): string {
  return `gallery-section-${id}`;
}

/** The titles of a section and of its subsections, each by its id. */
function sectionTexts({ subsections, title }: StoredSection): Record<string, string> {
  return { title, ...textsById(subsections, (subsection) => subsection.title) };
}

/** The section as stored: the subsections sorted by title, as the site shows them. */
function toStoredSection({ subsections, title }: SectionBody): StoredSection {
  return { subsections: subsections.toSorted(byTitle), title };
}

function toSavedSection(id: string, section: StoredSection): Tagged<Section> {
  return { data: { id, ...section }, etag: entityTag(section) };
}

/**
 * Rejects with 409 a section `id` that clashes with another saved section: by the title, which
 * the visitor tells sections apart by, or by the id of the section or of a subsection, which works
 * refer to.
 */
function assertNoClash(id: string, section: StoredSection, { docs }: QuerySnapshot): void {
  const subsectionIds = new Set(section.subsections.map((subsection) => subsection.id));

  if (subsectionIds.has(id)) {
    throw new ConflictError("A subsection has the id of its section");
  }

  for (const snapshot of docs) {
    if (snapshot.id === id) {
      continue;
    }

    const other = readSection(snapshot);

    if (titleKey(other.title) === titleKey(section.title)) {
      throw new ConflictError("Another section has this title");
    }

    const otherIds = [snapshot.id, ...other.subsections.map((subsection) => subsection.id)];

    if (otherIds.includes(id)) {
      throw new ConflictError("The section has the id of a subsection of another section");
    }

    if (otherIds.some((otherId) => subsectionIds.has(otherId))) {
      throw new ConflictError("A subsection has the id of another section or its subsection");
    }
  }
}

/** Every section sorted by title, tagged by the stored list. */
export async function listSections(): Promise<Tagged<Section[]>> {
  const { docs } = await sectionsCollection().get();
  const sections = docs
    .map((snapshot): Section => ({ id: snapshot.id, ...readSection(snapshot) }))
    .toSorted(byTitle);

  return { data: sections, etag: entityTag(sections) };
}

export async function getSection(id: string): Promise<Tagged<Section>> {
  return toSavedSection(id, readSection(await sectionDocument(id).get()));
}

/**
 * Creates the section `id`, which the client chose; rejects it with 412 once a section has that
 * id, such as one an earlier try of the same request created.
 */
export async function createSection(id: string, body: SectionBody): Promise<Tagged<Section>> {
  const section = toStoredSection(body);

  await firestore().runTransaction(async (transaction) => {
    const document = sectionDocument(id);

    if ((await transaction.get(document)).exists) {
      throw new PreconditionFailedError("The section already exists");
    }

    assertNoClash(id, section, await transaction.get(sectionsCollection()));
    transaction.create(document, section);
    saveSources(transaction, sectionTranslations(id), sectionTexts(section));
  });

  await requestTranslations(sectionTranslations(id));

  return toSavedSection(id, section);
}

/**
 * Replaces the section while it is still the one the client read (`ifMatch`). A saved subsection
 * left out is deleted.
 */
export async function replaceSection(
  id: string,
  body: SectionBody,
  ifMatch: string,
): Promise<Tagged<Section>> {
  const section = toStoredSection(body);

  await firestore().runTransaction(async (transaction) => {
    const document = sectionDocument(id);

    assertIfMatch(ifMatch, readSection(await transaction.get(document)));
    assertNoClash(id, section, await transaction.get(sectionsCollection()));
    transaction.set(document, section);
    saveSources(transaction, sectionTranslations(id), sectionTexts(section));
  });

  await requestTranslations(sectionTranslations(id));

  return toSavedSection(id, section);
}

/** Deletes the section, with its subsections, while it is still the one the client read. */
export async function deleteSection(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = sectionDocument(id);

    assertIfMatch(ifMatch, readSection(await transaction.get(document)));
    transaction.delete(document);
    deleteTranslations(transaction, sectionTranslations(id));
  });
}
