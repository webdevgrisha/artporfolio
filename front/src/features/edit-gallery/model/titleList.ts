import type { QueryKey, UseSuspenseQueryOptions } from "@tanstack/react-query";
import { z } from "zod";

import type { GalleryWorkUsage, WorkUsages } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";

import { refineUniqueTitles, titleSchema } from "./titles";

/** A row of a list of titles. */
export interface TitleItem {
  /** Picked by the form for a new row, so works can refer to it once it is saved. */
  id: string;
  title: string;
}

/**
 * A list of titles of the gallery that is edited and saved as a whole, such as the materials: how
 * it is read and saved, its limit and the words the form names it with.
 */
export interface TitleListConfig<TData, TQueryKey extends QueryKey = QueryKey> {
  getSaveErrorMessage: (error: unknown) => string;
  /** The most rows the list may hold. */
  max: number;
  /** Reads the list with its ETag; a save puts the saved list here. */
  query: UseSuspenseQueryOptions<Tagged<TData>, Error, Tagged<TData>, TQueryKey>;
  /** Replaces the whole list and returns it as saved, with its new ETag. */
  replace: (params: { etag: string; items: TitleItem[] }) => Promise<Tagged<TData>>;
  texts: {
    /** E.g. «Добавить материал». */
    add: string;
    /** E.g. «Такой материал уже есть». */
    duplicate: string;
    /** E.g. «Материалов пока нет». */
    empty: string;
    /** E.g. «Материалов уже 100, больше добавить нельзя». */
    full: string;
    /** The label of the list, e.g. «Материалы». */
    heading: string;
    /** The label of the field that adds a row, e.g. «Новый материал». */
    newItem: string;
    /** E.g. «Например: Акварель». */
    placeholder: string;
    /** Names a row with its title, e.g. «Название материала Акварель». */
    rowField: (title: string) => string;
    /** Names a row without a title, e.g. «материал» in «Удалить материал». */
    rowFallback: string;
    /** The other rows, as in «других материалов нет». */
    others: string;
    /** E.g. «Не больше 100 материалов». */
    tooMany: string;
  };
  toItems: (data: TData) => TitleItem[];
  toastId: string;
  /** How many works name each row, from the counts of every list. */
  usages: (usage: GalleryWorkUsage) => WorkUsages;
}

export interface TitleListFormValues {
  items: TitleItem[];
}

/** The rules of the form of a list: a title in every row, none twice, at most `max` rows. */
export function titleListFormSchema({
  max,
  texts,
}: Pick<TitleListConfig<unknown>, "max" | "texts">) {
  return z.object({
    items: z
      .array(z.object({ id: z.string(), title: titleSchema }))
      .max(max, texts.tooMany)
      .superRefine(refineUniqueTitles(texts.duplicate)),
  });
}
