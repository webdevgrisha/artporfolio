import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { minWorkYear } from "#modules/gallery/works/schema";
import { type Photo, photoBodySchema, storedPhotoSchema } from "#shared/images/photo";

/** A collection holds works, so it starts no earlier than a work can be dated. */
export const minCollectionYear = minWorkYear;

/**
 * The most works one collection may hold; raise it when the artist needs more. Saving the
 * collection moves every added and removed work in one transaction, which this keeps small. Saving
 * a work checks it too.
 */
export const maxCollectionWorks = 200;

const collectionIdSchema = z.uuid();

/** The path parameters of a request about one collection. */
export const collectionParamsSchema = z.object({
  id: collectionIdSchema,
});

const collectionYearSchema = z.number().int().min(minCollectionYear);

/** A collection as the client sends it, to create one or to replace a saved one. Every field is sent. */
export const collectionBodySchema = z
  .strictObject({
    /** The name in the gallery, which tells the collections apart, so it cannot be empty. */
    title: z.string().trim().min(1).max(100),
    /**
     * What the collection is about, which the visitor reads beside it. Plain text: no HTML or
     * Markdown. Paragraphs are separated by a blank line.
     */
    description: z.string().trim().min(1).max(2_000),
    cover: photoBodySchema,
    /** The year the collection was started, which cannot be in the future. */
    startYear: collectionYearSchema,
    /** The year it was finished, after the start; null for a collection of one year. */
    endYear: collectionYearSchema.nullable(),
    /**
     * Every work of the collection, in any order: the site shows them by date. A work of another
     * collection moves to this one; a saved work left out becomes a work on its own.
     */
    workIds: z
      .array(z.uuid())
      .max(maxCollectionWorks)
      .refine((ids) => new Set(ids).size === ids.length, "Each id must appear once"),
  })
  .superRefine(({ endYear, startYear }, context) => {
    const thisYear = new Date().getFullYear();

    if (startYear > thisYear) {
      context.addIssue({
        code: "custom",
        message: "The year cannot be in the future",
        path: ["startYear"],
      });
    }

    if (endYear === null) {
      return;
    }

    // One year is told by a null end alone, so a collection has one way to say it.
    if (endYear <= startYear) {
      context.addIssue({
        code: "custom",
        message: "The end year must come after the start year",
        path: ["endYear"],
      });
    } else if (endYear > thisYear) {
      context.addIssue({
        code: "custom",
        message: "The year cannot be in the future",
        path: ["endYear"],
      });
    }
  });

/**
 * A collection as stored in Firestore, in its own document of the `galleryCollections`
 * collection. Its works are not stored here: each work names its collection. Only the shape is
 * checked: the rules above apply when a collection is saved, so tightening a rule later never makes
 * a saved collection unreadable.
 */
export const storedCollectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  cover: storedPhotoSchema,
  startYear: z.number(),
  endYear: z.number().nullable(),
  /** Set by the server when the collection is created. */
  createdAt: z.instanceof(Timestamp),
  /** Set by the server whenever the admin saves the collection. */
  updatedAt: z.instanceof(Timestamp),
});

export type CollectionParams = z.infer<typeof collectionParamsSchema>;
export type CollectionBody = z.infer<typeof collectionBodySchema>;
export type StoredCollection = z.infer<typeof storedCollectionSchema>;

/** A collection as the API returns it. */
export interface Collection {
  id: string;
  title: string;
  description: string;
  cover: Photo;
  startYear: number;
  /** Null for a collection of one year. */
  endYear: number | null;
  /** In the order the site shows them: the latest first. */
  workIds: string[];
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

export interface CollectionsResponse {
  /** In the order the site shows them: the latest first. */
  collections: Collection[];
}
