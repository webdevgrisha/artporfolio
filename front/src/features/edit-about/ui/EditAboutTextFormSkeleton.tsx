import { FieldSkeleton, FormSkeleton } from "@/shared/ui/skeleton";

import { aboutTextFields } from "../model/aboutTextFields";
import styles from "./AboutTextFields.module.css";

interface EditAboutTextFormSkeletonProps {
  className?: string;
}

/** EditAboutTextForm while its texts load: the texts side by side, as the form lays them out. */
export function EditAboutTextFormSkeleton({ className }: EditAboutTextFormSkeletonProps) {
  return (
    <FormSkeleton className={className}>
      <div className={styles.root}>
        {aboutTextFields.map((field) => (
          <FieldSkeleton key={field.name} rows={12} />
        ))}
      </div>
    </FormSkeleton>
  );
}
