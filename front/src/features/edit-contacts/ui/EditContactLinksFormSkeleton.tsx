import { FieldSkeleton, FormSkeleton } from "@/shared/ui/skeleton";

import { contactFields } from "../model/contactFields";
import styles from "./ContactLinksFields.module.css";

interface EditContactLinksFormSkeletonProps {
  className?: string;
}

/** EditContactLinksForm while its links load: a field per network, as the form lays them out. */
export function EditContactLinksFormSkeleton({ className }: EditContactLinksFormSkeletonProps) {
  return (
    <FormSkeleton className={className}>
      <div className={styles.root}>
        {contactFields.map((field) => (
          <FieldSkeleton key={field.name} />
        ))}
      </div>
    </FormSkeleton>
  );
}
