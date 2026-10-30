export const routes = {
  about: "/admin/about",
  aboutPhoto: "/admin/about/photo",
  aboutProcess: "/admin/about/process",
  aboutText: "/admin/about/text",
  contactLinks: "/admin/contacts/links",
  contactPhoto: "/admin/contacts/photo",
  contacts: "/admin/contacts",
  gallery: "/admin/gallery",
  login: "/admin/login",
  logout: "/admin/logout",
  personalization: "/admin/personalization",
  projects: "/admin/projects",
  sitePages: "/admin/pages",
} as const;

export const adminHomePath = routes.projects;

/**
 * The path to go to after signing in or a failed logout: a page of the admin, or the admin home.
 * The value comes from a URL or a form, so it never leads to another site.
 */
export function toAdminPath(value: FormDataEntryValue | null): string {
  return typeof value === "string" && value.startsWith("/admin/") ? value : adminHomePath;
}

/** Id of the admin layout route. Its loader provides the signed-in user. */
export const adminRouteId = "admin";

/** Admin navigation in display order; the titles are also used as page headings. */
export const adminNavigation = [
  { title: "Галерея", to: routes.gallery },
  { title: "Проекты", to: routes.projects },
  { title: "О сайте", to: routes.about },
  { title: "Контакты", to: routes.contacts },
  { title: "Персонализация", to: routes.personalization },
  { title: "Страницы", to: routes.sitePages },
] as const;
