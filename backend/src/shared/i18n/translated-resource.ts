import type { DocumentData, DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import type { ZodObject, ZodType } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { saveTranslations } from "#shared/i18n/translating";
import {
  type StoredTranslations,
  storedTranslationsSchema,
  type Translations,
  type TranslationsBody,
  toTranslations,
} from "#shared/i18n/translations";

/** The data as stored in Firestore, with its translations. */
export type StoredTranslated<TData extends object> = TData & { translations: StoredTranslations };

/** The data as the API returns it, with its translations. */
export type Translated<TData extends object> = TData & { translations: Translations };

/** The data as the client sends it, with what it sends for the translations. */
export type TranslatedBody<TData extends object> = TData & { translations: TranslationsBody };

interface TranslatedResourceOptions<TData extends object> {
  document: () => DocumentReference;
  /** What the resource is until it is first saved; also fills a field saved data lacks. */
  empty: TData;
  /** The field of the document that holds the data; without it, the data is the document itself. */
  field?: string;
  /** The shape of the saved data without its translations. */
  schema: ZodObject;
  /** The texts of the data in the source language, by the key of their translations. */
  sources: (data: TData) => Record<string, string>;
}

/** Data with translations that the site reads as a whole and the admin replaces as a whole. */
export interface TranslatedResource<TData extends object> {
  document: () => DocumentReference;
  /** The data with the entity tag for If-Match. */
  get(): Promise<Tagged<Translated<TData>>>;
  read(snapshot: DocumentSnapshot): StoredTranslated<TData>;
  /**
   * Replaces the data while it is still what the client read (`ifMatch`). The translator runs
   * before the transaction, which may run several times: the tag checked there covers the
   * translations, so the ones it started from are still the saved ones.
   */
  replace(body: TranslatedBody<TData>, ifMatch: string): Promise<Tagged<Translated<TData>>>;
  /** The stored data as the API returns it. */
  toResponse(stored: StoredTranslated<TData>): Translated<TData>;
}

/** Like documentResource, for data whose texts the site shows in every language. */
export function translatedResource<TData extends object>({
  document,
  empty,
  field,
  schema,
  sources,
}: TranslatedResourceOptions<TData>): TranslatedResource<TData> {
  const storedSchema = schema.extend({
    translations: storedTranslationsSchema,
  }) as unknown as ZodType<StoredTranslated<TData>>;

  function read(snapshot: DocumentSnapshot): StoredTranslated<TData> {
    const saved: unknown = field === undefined ? snapshot.data() : snapshot.get(field);

    return storedSchema.parse({ ...empty, translations: {}, ...(saved as object | undefined) });
  }

  function toResponse(stored: StoredTranslated<TData>): Translated<TData> {
    return { ...stored, translations: toTranslations(stored.translations, sources(stored)) };
  }

  function tagged(stored: StoredTranslated<TData>): Tagged<Translated<TData>> {
    const data = toResponse(stored);

    return { data, etag: entityTag(data) };
  }

  async function get(): Promise<Tagged<Translated<TData>>> {
    return tagged(read(await document().get()));
  }

  async function replace(
    { translations: sent, ...data }: TranslatedBody<TData>,
    ifMatch: string,
  ): Promise<Tagged<Translated<TData>>> {
    const saved = read(await document().get());

    // Nothing is paid for a change that the check in the transaction would reject anyway.
    assertIfMatch(ifMatch, toResponse(saved));

    const translations = await saveTranslations(
      sources(data as unknown as TData),
      saved.translations,
      sent,
    );
    const next = { ...data, translations } as unknown as StoredTranslated<TData>;
    const fields: DocumentData = field === undefined ? next : { [field]: next };

    await firestore().runTransaction(async (transaction) => {
      const reference = document();

      assertIfMatch(ifMatch, toResponse(read(await transaction.get(reference))));
      // Only these fields are replaced: the document may hold others, such as a photo.
      transaction.set(reference, fields, { mergeFields: Object.keys(fields) });
    });

    return tagged(next);
  }

  return { document, get, read, replace, toResponse };
}
