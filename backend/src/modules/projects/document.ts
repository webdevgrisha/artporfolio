import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type StoredProject, storedProjectSchema } from "#modules/projects/schema";
import { firestore } from "#shared/firebase/firestore";
import { NotFoundError } from "#shared/http/errors";

function projectsCollection() {
  return firestore().collection("projects");
}

export function projectDocument(id: string) {
  return projectsCollection().doc(id);
}

/** The projects in the order the site shows them. */
export function orderedProjects() {
  return projectsCollection().orderBy("position");
}

export function readProject(snapshot: DocumentSnapshot): StoredProject {
  if (!snapshot.exists) {
    throw new NotFoundError("There is no project");
  }

  return storedProjectSchema.parse(snapshot.data());
}
