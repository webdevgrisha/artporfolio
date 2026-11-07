import { type ProjectsIntro, projectsIntroSchema } from "#modules/projects/intro/schema";
import { firestore } from "#shared/firebase/firestore";
import { translatedResource } from "#shared/i18n/translated-resource";

/** The text above the list of projects. */
export const projectsIntro = translatedResource<ProjectsIntro>({
  document: () => firestore().doc("site/projectsIntro"),
  empty: { text: "" },
  schema: projectsIntroSchema,
  sources: ({ text }) => ({ text }),
});
