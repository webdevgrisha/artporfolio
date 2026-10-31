import { useQuery } from "@tanstack/react-query";

import { projectQuery } from "@/entities/project";

interface ProjectTitleProps {
  id: string;
}

/** The title of a project, which follows a save; the loader of its page has fetched it. */
export function ProjectTitle({ id }: ProjectTitleProps) {
  const { data } = useQuery(projectQuery(id));

  return data?.data.title ?? "";
}
