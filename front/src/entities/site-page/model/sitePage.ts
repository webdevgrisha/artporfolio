/** The pages of the public site that open with a main photo. Mirrors backend/src/modules/pages/schema.ts. */
export const sitePageIds = [
  "home",
  "gallery",
  "exhibitions",
  "projects",
  "about",
  "contacts",
] as const;

export type SitePageId = (typeof sitePageIds)[number];
