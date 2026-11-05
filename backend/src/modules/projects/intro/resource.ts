import { type ProjectsIntro, projectsIntroSchema } from "#modules/projects/intro/schema";
import { firestore } from "#shared/firebase/firestore";
import { documentResource } from "#shared/http/document-resource";

/** The text above the list of projects. */
export const projectsIntro = documentResource<ProjectsIntro>({
  document: () => firestore().doc("site/projectsIntro"),
  empty: { text: "" },
  schema: projectsIntroSchema,
});
