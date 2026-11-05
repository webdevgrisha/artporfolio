import { http } from "@/shared/api/http";

import { type Project, projectsResponseSchema } from "../../model/project";

/** Every project in the order the site shows them. */
export async function getProjects(): Promise<Project[]> {
  const { projects } = await http.get({ path: "/projects", schema: projectsResponseSchema });

  return projects;
}
