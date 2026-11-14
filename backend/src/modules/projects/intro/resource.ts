import { type ProjectsIntro, projectsIntroSchema } from "#modules/projects/intro/schema";
import { documentResource } from "#shared/firebase/document-resource";
import { firestore } from "#shared/firebase/firestore";

/** Where the translations of the text go. */
export const projectsIntroTranslations = "projects-intro";

/** The text above the list of projects. */
export const projectsIntro = documentResource<ProjectsIntro>({
  document: () => firestore().doc("site/projectsIntro"),
  empty: { text: "" },
  schema: projectsIntroSchema,
  translated: { resource: projectsIntroTranslations, texts: ({ text }) => ({ text }) },
});
