/** The names the server gives the translations of each resource: `/translations/{name}`. */
export const translationResources = {
  aboutText: "about-text",
  galleryCollection: (id: string) => `gallery-collection-${id}`,
  galleryColors: "gallery-colors",
  galleryIntro: "gallery-intro",
  galleryMaterials: "gallery-materials",
  galleryPalettes: "gallery-palettes",
  gallerySection: (id: string) => `gallery-section-${id}`,
  galleryWork: (id: string) => `gallery-work-${id}`,
  project: (id: string) => `project-${id}`,
  projectsIntro: "projects-intro",
} as const;
