import type { QuerySnapshot } from "firebase-admin/firestore";

import { orderedProjects, projectDocument } from "#modules/projects/document";
import { firestore } from "#shared/firebase/firestore";
import { UnprocessableContentError } from "#shared/http/errors";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";

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
