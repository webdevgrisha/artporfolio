import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deletePageHero,
  replacePageHero,
  type SitePageId,
  sitePagesQuery,
} from "@/entities/site-page";
import type { Image } from "@/shared/api/image";
import { uploadImage } from "@/shared/api/upload";

import { getDeleteHeroErrorMessage, getSaveHeroErrorMessage } from "../lib/saveErrorMessages";
import type { HeroField } from "./heroFields";

/** The toasts of one hero replace each other: a later upload or deletion replaces an error. */
function getHeroToastId(page: SitePageId): string {
  return `page-hero-${page}`;
}

/** Puts the hero the server answered with into the loaded pages, without loading them again. */
function setPageHero(queryClient: QueryClient, page: SitePageId, hero: Image | null) {
  queryClient.setQueryData(sitePagesQuery.queryKey, (pages) =>
    pages ? { ...pages, [page]: { ...pages[page], hero } } : pages,
  );
}

/**
 * Uploads the hero of the page at once. A failed upload loads the pages again: a request that
 * failed may still have changed the hero on the server.
 */
export function useUploadPageHero({ label, page }: HeroField) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error) => getSaveHeroErrorMessage(error, label),
        successMessage: `Фото страницы «${label}» сохранено`,
        toastId: getHeroToastId(page),
      },
    },
    mutationFn: async (file: File) => replacePageHero({ page, uploadId: await uploadImage(file) }),
    onError: () => queryClient.invalidateQueries({ queryKey: sitePagesQuery.queryKey }),
    onSuccess: (hero) => setPageHero(queryClient, page, hero),
  });
}

/**
 * Deletes the hero of the page at once. A failed deletion loads the pages again: a request that
 * failed may still have deleted the hero on the server.
 */
export function useDeletePageHero({ label, page }: HeroField) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error) => getDeleteHeroErrorMessage(error, label),
        successMessage: `Фото страницы «${label}» удалено`,
        toastId: getHeroToastId(page),
      },
    },
    mutationFn: () => deletePageHero({ page }),
    onError: () => queryClient.invalidateQueries({ queryKey: sitePagesQuery.queryKey }),
    onSuccess: () => setPageHero(queryClient, page, null),
  });
}
