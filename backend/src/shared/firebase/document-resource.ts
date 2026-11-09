import type { DocumentData, DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import type { ZodType } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { requestTranslations, saveSources } from "#shared/i18n/translation-requests";

interface DocumentResourceOptions<TData extends object> {
  document: () => DocumentReference;
  /** What the resource is until it is first saved; also fills a field saved data lacks. */
  empty: TData;
  /** The field of the document that holds the data; without it, the data is the document itself. */
  field?: string;
  /**
   * The shape of the saved data. Only the shape: the rules of a body apply when it is saved, so
   * tightening a rule later never makes saved data unreadable.
   */
  schema: ZodType<TData>;
  /** For data the site shows in every language: where its translations go, and its texts by key. */
  translated?: { resource: string; texts: (data: TData) => Record<string, string> };
}

/** Data the site reads as a whole and the admin replaces as a whole, kept in one document. */
export interface DocumentResource<TData extends object> {
  document: () => DocumentReference;
  /** The data with the entity tag for If-Match. */
  get(): Promise<Tagged<TData>>;
  read(snapshot: DocumentSnapshot): TData;
  /** Replaces the data while it is still what the client read (`ifMatch`). */
  replace(data: TData, ifMatch: string): Promise<Tagged<TData>>;
}

export function documentResource<TData extends object>({
  document,
  empty,
  field,
  schema,
  translated,
}: DocumentResourceOptions<TData>): DocumentResource<TData> {
  function read(snapshot: DocumentSnapshot): TData {
    const saved: unknown = field === undefined ? snapshot.data() : snapshot.get(field);

    return schema.parse({ ...empty, ...(saved as object | undefined) });
  }

  async function get(): Promise<Tagged<TData>> {
    const data = read(await document().get());

    return { data, etag: entityTag(data) };
  }

  async function replace(data: TData, ifMatch: string): Promise<Tagged<TData>> {
    const fields: DocumentData = field === undefined ? data : { [field]: data };

    await firestore().runTransaction(async (transaction) => {
      const reference = document();

      assertIfMatch(ifMatch, read(await transaction.get(reference)));
      // Only these fields are replaced: the document may hold others, such as a photo.
      transaction.set(reference, fields, { mergeFields: Object.keys(fields) });

      if (translated) {
        saveSources(transaction, translated.resource, translated.texts(data));
      }
    });

    if (translated) {
      await requestTranslations(translated.resource);
    }

    return { data, etag: entityTag(data) };
  }

  return { document, get, read, replace };
}
