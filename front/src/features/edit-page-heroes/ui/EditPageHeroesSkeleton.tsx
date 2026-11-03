import clsx from "clsx";

import { MediaSkeleton, SkeletonRegion } from "@/shared/ui/skeleton";

import { heroFields } from "../model/heroFields";
import styles from "./EditPageHeroes.module.css";

interface EditPageHeroesSkeletonProps {
  className?: string;
}

/** EditPageHeroes while the heroes load: a photo per page, as it lays them out. */
export function EditPageHeroesSkeleton({ className }: EditPageHeroesSkeletonProps) {
  return (
    <SkeletonRegion className={clsx(styles.root, className)}>
      {heroFields.map((field) => (
        <MediaSkeleton key={field.page} />
      ))}
    </SkeletonRegion>
  );
}
