import type { SitePageId } from "@/entities/site-page";

export interface HeroField {
  /** The name of the page in the admin. */
  label: string;
  page: SitePageId;
}

/** The heroes in display order, one per page. */
export const heroFields: readonly HeroField[] = [
  { label: "Главная", page: "home" },
  { label: "Проекты", page: "projects" },
  { label: "Контакты", page: "contacts" },
  { label: "Галерея", page: "gallery" },
  { label: "О сайте", page: "about" },
];
