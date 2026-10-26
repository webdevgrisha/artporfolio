import type { ComponentType } from "react";

export const loginPath = "/admin/login";
export const adminHomePath = "/admin/projects";

interface AdminPage {
  /** Loads the page component on first visit. */
  load: () => Promise<ComponentType>;
  title: string;
  to: string;
}

/** The single source for admin routes, navigation and page titles. */
export const adminPages: readonly AdminPage[] = [
  {
    load: () => import("@/pages/Admin/Gallery/Gallery").then((module) => module.Gallery),
    title: "Галерея",
    to: "/admin/gallery",
  },
  {
    load: () => import("@/pages/Admin/Projects/Projects").then((module) => module.Projects),
    title: "Проекты",
    to: "/admin/projects",
  },
  {
    load: () => import("@/pages/Admin/About/About").then((module) => module.About),
    title: "О сайте",
    to: "/admin/about",
  },
  {
    load: () => import("@/pages/Admin/Contacts/Contacts").then((module) => module.Contacts),
    title: "Контакты",
    to: "/admin/contacts",
  },
  {
    load: () =>
      import("@/pages/Admin/Personalization/Personalization").then(
        (module) => module.Personalization,
      ),
    title: "Персонализация",
    to: "/admin/personalization",
  },
];
