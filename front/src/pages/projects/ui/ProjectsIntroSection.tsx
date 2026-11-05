import { useSuspenseQuery } from "@tanstack/react-query";

import { projectsIntroQuery } from "@/entities/project";
import { EditProjectsIntroForm } from "@/features/edit-projects";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton } from "@/shared/ui/skeleton";

import styles from "./ProjectsPage.module.css";

export function ProjectsIntroSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form} isNarrow>
          <FieldSkeleton rows={12} />
        </FormSkeleton>
      }
    >
      <ProjectsIntro />
    </AwaitPageData>
  );
}

function ProjectsIntro() {
  const { data: intro } = useSuspenseQuery(projectsIntroQuery);

  return <EditProjectsIntroForm className={styles.form} intro={intro} />;
}
