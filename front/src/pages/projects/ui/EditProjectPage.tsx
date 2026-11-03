import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { projectQuery } from "@/entities/project";
import { EditProjectForm } from "@/features/edit-projects";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FieldSkeleton, FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./ProjectsPage.module.css";

export function EditProjectPage() {
  const { id = "" } = useParams();

  return (
    <div className={styles.root}>
      {/* Keyed: another project shows its skeleton, then a form of its own, whose values come
          from the project it opened with. */}
      <AwaitPageData
        key={id}
        fallback={
          <FormSkeleton className={styles.form} isNarrow>
            <FieldSkeleton />
            <FieldSkeleton rows={8} />
            <FieldSkeleton />
            <MediaSkeleton />
          </FormSkeleton>
        }
      >
        <EditProject id={id} />
      </AwaitPageData>
    </div>
  );
}

interface EditProjectProps {
  id: string;
}

function EditProject({ id }: EditProjectProps) {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: project } = useSuspenseQuery(projectQuery(id));

  return <EditProjectForm className={styles.form} project={project} />;
}
