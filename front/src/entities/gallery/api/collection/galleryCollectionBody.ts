import type { PhotoBody } from "@/shared/api/photo";
import type { TranslationsBody } from "@/shared/api/translations";

/** A collection as the admin saves it: every field and its works at once. */
export interface GalleryCollectionBody {
  title: string;
  description: string;
  cover: PhotoBody;
  startYear: number;
  /** Null for a collection of one year. */
  endYear: number | null;
  /**
   * Every work of the collection, in any order. A work of another collection moves to this one; a
   * saved work left out becomes a work on its own.
   */
  workIds: readonly string[];
  /** The texts in the other languages; the server makes those sent as null. */
  translations: TranslationsBody;
}
