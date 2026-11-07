import type { DocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";

import { type StoredSection, storedSectionSchema } from "#modules/gallery/sections/schema";
import { firestore } from "#shared/firebase/firestore";
import { NotFoundError } from "#shared/http/errors";

/** Every section; works read it to check the sections they refer to. */
export function sectionsCollection() {
  return firestore().collection("gallerySections");
}

export function sectionDocument(id: string) {
  return sectionsCollection().doc(id);
}

export function readSection(snapshot: DocumentSnapshot): StoredSection {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no section");
  }

  return storedSectionSchema.parse(snapshot.data());
}

/**
 * The ids a work can refer to: every saved section and every subsection. They never clash: see
 * assertNoClash in service.ts.
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
