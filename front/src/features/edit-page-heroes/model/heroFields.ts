import type { SitePageId } from "@/entities/site-page";

export interface HeroField {
  /** The name of the page in the admin. */
  label: string;
  page: SitePageId;
}

/** The form fields in display order: the hero of each page. */
export const heroFields: readonly HeroField[] = [
  { label: "Главная", page: "home" },
  { label: "Проекты", page: "projects" },
  { label: "Контакты", page: "contacts" },
  { label: "Галерея", page: "gallery" },
  { label: "О сайте", page: "about" },
];
