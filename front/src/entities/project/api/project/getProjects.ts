import { http } from "@/shared/api/http";

import { type ProjectSummary, projectsResponseSchema } from "../../model/project";

/** Every project in the order the site shows them. */
export async function getProjects(): Promise<ProjectSummary[]> {
  const { projects } = await http.get({ path: "/projects", schema: projectsResponseSchema });

  return projects;
}
