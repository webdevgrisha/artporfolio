import { type RequestHandler, Router } from "express";
import type { DocumentData, DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import type { ZodType } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { assertIfMatch, entityTag, type Tagged } from "#shared/http/etag";
import { requireContentType } from "#shared/middleware/content-type";
import { ifMatchHeader, requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

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
    });

    return { data, etag: entityTag(data) };
  }

  return { document, get, read, replace };
}

/**
 * The routes of a resource: reading it is public, as the site shows it to every visitor. A change
 * replaces all of it, and only what the client read: it sends the ETag in If-Match.
 */
export function documentResourceRouter<TData extends object, TBody = TData>(
  resource: {
    get(): Promise<Tagged<TData>>;
    replace(body: TBody, ifMatch: string): Promise<Tagged<TData>>;
  },
  bodySchema: ZodType,
): Router {
  const read: RequestHandler<object, TData> = async (_request, response) => {
    const { data, etag } = await resource.get();

    response.status(200).set("ETag", etag).json(data);
  };

  const replace: RequestHandler<object, TData, TBody> = async (request, response) => {
    const { data, etag } = await resource.replace(request.body, ifMatchHeader(request));

    response.status(200).set("ETag", etag).json(data);
  };

  const router = Router();

  router.get("/", read);
  router.put(
    "/",
    requireContentType("application/json"),
    requireIfMatch,
    validateBody(bodySchema),
    replace,
  );

  return router;
}
