export const routes = {
  about: "/admin/about",
  contacts: "/admin/contacts",
  gallery: "/admin/gallery",
  login: "/admin/login",
  logout: "/admin/logout",
  personalization: "/admin/personalization",
  projects: "/admin/projects",
} as const;

export const adminHomePath = routes.projects;

/** Id of the admin layout route. Its loader provides the signed-in user. */
export const adminRouteId = "admin";

/** Admin navigation in display order; the titles are also used as page headings. */
export const adminNavigation = [
  { title: "Галерея", to: routes.gallery },
  { title: "Проекты", to: routes.projects },
  { title: "О сайте", to: routes.about },
  { title: "Контакты", to: routes.contacts },
  { title: "Персонализация", to: routes.personalization },
] as const;
