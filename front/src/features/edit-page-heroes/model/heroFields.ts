import type { SitePageId } from "@/entities/site-page";

export interface HeroField {
  /**
   * The site does not show the page without a hero, so it can be replaced, not removed. Mirrors
   * `requiredHeroPages` in backend/src/modules/pages/schema.ts.
   */
  isRequired?: boolean;
  /** The name of the page in the admin. */
  label: string;
  page: SitePageId;
}

/** The heroes in display order, one per page. */
export const heroFields: readonly HeroField[] = [
  { isRequired: true, label: "Главная", page: "home" },
  { label: "Проекты", page: "projects" },
  { label: "Контакты", page: "contacts" },
  { label: "Галерея", page: "gallery" },
  { label: "О сайте", page: "about" },
];
