import { useQuery } from "@tanstack/react-query";

import { projectQuery } from "@/entities/project";

interface ProjectTitleProps {
  id: string;
}

/**
 * The title of a project, which follows a save. The loader of its page loads it; until then the title
 * is the one in the cache, or none.
 */
export function ProjectTitle({ id }: ProjectTitleProps) {
  const { data } = useQuery(projectQuery(id));

  return data?.data.title ?? "";
}
