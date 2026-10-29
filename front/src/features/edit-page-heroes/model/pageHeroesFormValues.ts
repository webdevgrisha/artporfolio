import type { SitePageId, SitePages } from "@/entities/site-page";
import { type ImageFieldValue, toImageFieldValue } from "@/shared/lib/imageFieldValue";

/** One field per page, named after it. */
export type PageHeroesFormValues = Record<SitePageId, ImageFieldValue>;

export function toPageHeroesFormValues(pages: SitePages): PageHeroesFormValues {
  return {
    about: toImageFieldValue(pages.about.hero),
    contacts: toImageFieldValue(pages.contacts.hero),
    gallery: toImageFieldValue(pages.gallery.hero),
    home: toImageFieldValue(pages.home.hero),
    projects: toImageFieldValue(pages.projects.hero),
  };
}
