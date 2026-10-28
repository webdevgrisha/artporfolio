import type { SitePageId, SitePages } from "@/entities/site-page";
import type { Image } from "@/shared/api/image";

/** The field value that keeps the hero already on the server. */
export const savedHero = "saved";

/** The saved hero, a newly picked file, or `null` for no hero. */
type HeroValue = typeof savedHero | File | null;

/** One field per page, named after it. */
export type PageHeroesFormValues = Record<SitePageId, HeroValue>;

export function toHeroValue(hero: Image | null): HeroValue {
  return hero ? savedHero : null;
}

export function toPageHeroesFormValues(pages: SitePages): PageHeroesFormValues {
  return {
    about: toHeroValue(pages.about.hero),
    contacts: toHeroValue(pages.contacts.hero),
    gallery: toHeroValue(pages.gallery.hero),
    home: toHeroValue(pages.home.hero),
    projects: toHeroValue(pages.projects.hero),
  };
}
