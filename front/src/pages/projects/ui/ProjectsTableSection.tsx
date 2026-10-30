import { useSuspenseQuery } from "@tanstack/react-query";

import { projectsQuery } from "@/entities/project";
import { ProjectsTable } from "@/features/edit-projects";

export function ProjectsTableSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return <ProjectsTable projects={projects} />;
}
