import { useSuspenseQuery } from "@tanstack/react-query";

import { projectsOrderQuery, projectsQuery } from "@/entities/project";
import { EditProjectsOrderForm } from "@/features/edit-projects";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FormSkeleton, ListSkeleton } from "@/shared/ui/skeleton";

import styles from "./ProjectsPage.module.css";

export function ProjectsOrderSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <ListSkeleton rows={9} />
        </FormSkeleton>
      }
    >
      <ProjectsOrder />
    </AwaitPageData>
  );
}

function ProjectsOrder() {
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: order } = useSuspenseQuery(projectsOrderQuery);

  return <EditProjectsOrderForm className={styles.form} order={order} projects={projects} />;
}
