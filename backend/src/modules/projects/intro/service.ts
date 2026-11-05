import type { DocumentSnapshot } from "firebase-admin/firestore";

import { type ProjectsIntro, projectsIntroSchema } from "#modules/projects/intro/schema";
import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";

const emptyIntro: ProjectsIntro = { text: "" };

/** The document that holds the text above the list of projects, and nothing else. */
function introDocument() {
  return firestore().doc("site/projectsIntro");
}

function readIntro(snapshot: DocumentSnapshot): ProjectsIntro {
  return snapshot.exists ? projectsIntroSchema.parse(snapshot.data()) : emptyIntro;
}

/** The text with the entity tag for If-Match; the text is empty until it is first saved. */
export async function getProjectsIntro(): Promise<Tagged<ProjectsIntro>> {
  const intro = readIntro(await introDocument().get());

  return { data: intro, etag: entityTag(intro) };
}

/** Replaces the text while it is still the one the client read (`ifMatch`). */
export async function replaceProjectsIntro(
  intro: ProjectsIntro,
  ifMatch: string,
): Promise<Tagged<ProjectsIntro>> {
  await firestore().runTransaction(async (transaction) => {
    const document = introDocument();

    assertIfMatch(ifMatch, readIntro(await transaction.get(document)));
    transaction.set(document, intro);
  });

  return { data: intro, etag: entityTag(intro) };
}
