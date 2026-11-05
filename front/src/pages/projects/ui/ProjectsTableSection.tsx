import { useSuspenseQuery } from "@tanstack/react-query";

import { projectsQuery } from "@/entities/project";
import { ProjectsTable } from "@/features/edit-projects";
import { AwaitPageData } from "@/shared/ui/page-data";
import { TableSkeleton } from "@/shared/ui/skeleton";

export function ProjectsTableSection() {
  return (
    <AwaitPageData fallback={<TableSkeleton rows={6} />}>
      <Projects />
    </AwaitPageData>
  );
}

function Projects() {
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return <ProjectsTable projects={projects} />;
}
