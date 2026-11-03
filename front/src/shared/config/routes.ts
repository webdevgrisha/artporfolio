export const routes = {
  about: "/admin/about",
  aboutPhoto: "/admin/about/photo",
  aboutProcess: "/admin/about/process",
  aboutText: "/admin/about/text",
  contactLinks: "/admin/contacts/links",
  contactPhoto: "/admin/contacts/photo",
  contacts: "/admin/contacts",
  gallery: "/admin/gallery",
  galleryColors: "/admin/gallery/colors",
  galleryIntro: "/admin/gallery/intro",
  galleryMaterials: "/admin/gallery/materials",
  galleryPalettes: "/admin/gallery/palettes",
  gallerySectionNew: "/admin/gallery/sections/new",
  gallerySections: "/admin/gallery/sections",
  login: "/admin/login",
  logout: "/admin/logout",
  personalization: "/admin/personalization",
  projectNew: "/admin/projects/new",
  projects: "/admin/projects",
  projectsAll: "/admin/projects/all",
  projectsIntro: "/admin/projects/intro",
  projectsOrder: "/admin/projects/order",
  sitePages: "/admin/pages",
} as const;

export const adminHomePath = routes.gallery;

/** The edit page of one section of the gallery. */
export function gallerySectionPath(id: string): string {
  return `${routes.gallerySections}/${encodeURIComponent(id)}`;
}

/** The edit page of one project. */
export function projectPath(id: string): string {
  return `${routes.projects}/${encodeURIComponent(id)}`;
}

/** The search parameter of the login page: the admin page to come back to after signing in. */
export const redirectToParam = "redirectTo";

/** The login page, which brings the user back to `redirectTo` after signing in. */
export function loginPath(redirectTo: string): string {
  return `${routes.login}?${new URLSearchParams({ [redirectToParam]: redirectTo }).toString()}`;
}

/**
 * The path to go to after signing in or a failed logout: a page of the admin, or the admin home.
 * The value comes from a URL or a form, so it never leads to another site.
 */
export function toAdminPath(value: FormDataEntryValue | null): string {
  return typeof value === "string" && value.startsWith("/admin/") ? value : adminHomePath;
}

/** Id of the admin layout route. Its loader provides the signed-in user. */
export const adminRouteId = "admin";

/**
 * Admin navigation in display order, the most used pages first; the titles are also used as page
 * headings.
 */
export const adminNavigation = [
  { title: "Галерея", to: routes.gallery },
  { title: "Проекты", to: routes.projects },
  { title: "О сайте", to: routes.about },
  { title: "Контакты", to: routes.contacts },
  { title: "Страницы", to: routes.sitePages },
  { title: "Персонализация", to: routes.personalization },
] as const;
