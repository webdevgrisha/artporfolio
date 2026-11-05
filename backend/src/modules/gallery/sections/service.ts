import type { DocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";

import {
  type Section,
  type SectionBody,
  type StoredSection,
  storedSectionSchema,
} from "#modules/gallery/sections/schema";
import { firestore } from "#shared/firebase/firestore";
import { ConflictError, NotFoundError, PreconditionFailedError } from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { byTitle, titleKey } from "#shared/text/titles";

/** Every section; works read it to check the sections they refer to. */
export function sectionsCollection() {
  return firestore().collection("gallerySections");
}

function sectionDocument(id: string) {
  return sectionsCollection().doc(id);
}

function readSection(snapshot: DocumentSnapshot): StoredSection {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no section");
  }

  return storedSectionSchema.parse(snapshot.data());
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

/**
 * The ids a work can refer to: every saved section and every subsection. They never clash, see
 * assertNoClash.
 */
export function sectionIdsIn({ docs }: QuerySnapshot): Set<string> {
  return new Set(
    docs.flatMap((snapshot) => [
      snapshot.id,
      ...readSection(snapshot).subsections.map((subsection) => subsection.id),
    ]),
  );
}

/**
 * The ids each saved section and subsection covers, by its id: a section covers itself and its
 * subsections, a subsection only itself.
 */
export function sectionGroupsIn({ docs }: QuerySnapshot): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>();

  for (const snapshot of docs) {
    const subsectionIds = readSection(snapshot).subsections.map((subsection) => subsection.id);

    groups.set(snapshot.id, new Set([snapshot.id, ...subsectionIds]));
    for (const id of subsectionIds) groups.set(id, new Set([id]));
  }

  return groups;
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
  });

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
  });

  return toSavedSection(id, section);
}

/** Deletes the section, with its subsections, while it is still the one the client read. */
export async function deleteSection(id: string, ifMatch: string): Promise<void> {
  await firestore().runTransaction(async (transaction) => {
    const document = sectionDocument(id);

    assertIfMatch(ifMatch, readSection(await transaction.get(document)));
    transaction.delete(document);
  });
}
