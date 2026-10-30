import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deletePageHero,
  pageHeroQuery,
  replacePageHero,
  type SitePageId,
} from "@/entities/site-page";
import { uploadImage } from "@/shared/api/upload";

import { getDeleteHeroErrorMessage, getSaveHeroErrorMessage } from "../lib/saveErrorMessages";
import type { HeroField } from "./heroFields";

/** The toasts of one hero replace each other: a later upload or deletion replaces an error. */
function getHeroToastId(page: SitePageId): string {
  return `page-hero-${page}`;
}

interface UploadPageHeroParams {
  /** The ETag of the hero the card shows. */
  etag: string;
  file: File;
}

interface DeletePageHeroParams {
  /** The ETag of the hero the card shows. */
  etag: string;
}

/**
 * Uploads the hero of the page at once and puts the saved hero into the cache. A failed upload
 * loads the hero again: a request that failed may still have changed it on the server, or another
 * tab may have changed it before.
 */
export function useUploadPageHero({ label, page }: HeroField) {
  const queryClient = useQueryClient();
  const { queryKey } = pageHeroQuery(page);

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error) => getSaveHeroErrorMessage(error, label),
        successMessage: `Фото страницы «${label}» сохранено`,
        toastId: getHeroToastId(page),
      },
    },
    mutationFn: async ({ etag, file }: UploadPageHeroParams) =>
      replacePageHero({ etag, page, uploadId: await uploadImage(file) }),
    onError: () => queryClient.invalidateQueries({ queryKey }),
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
  });
}

/**
 * Deletes the hero of the page at once and puts the empty hero with its ETag into the cache. A
 * failed deletion loads the hero again: a request that failed may still have deleted it.
 */
export function useDeletePageHero({ label, page }: HeroField) {
  const queryClient = useQueryClient();
  const { queryKey } = pageHeroQuery(page);

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error) => getDeleteHeroErrorMessage(error, label),
        successMessage: `Фото страницы «${label}» удалено`,
        toastId: getHeroToastId(page),
      },
    },
    mutationFn: ({ etag }: DeletePageHeroParams) => deletePageHero({ etag, page }),
    onError: () => queryClient.invalidateQueries({ queryKey }),
    onSuccess: (empty) => queryClient.setQueryData(queryKey, empty),
  });
}
