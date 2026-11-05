import type { GalleryWorkSummary } from "@/entities/gallery";

import { formatWorkFormat } from "../model/workDisplay";
import styles from "./WorksList.module.css";

interface WorkFormatCellProps {
  work: GalleryWorkSummary;
}

/** The format of a work; a single work, the usual one, is muted, so the others stand out. */
export function WorkFormatCell({ work }: WorkFormatCellProps) {
  return (
    <span className={work.format === "single" ? styles.muted : undefined}>
      {formatWorkFormat(work)}
    </span>
  );
}
