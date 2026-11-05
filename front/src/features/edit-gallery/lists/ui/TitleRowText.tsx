import { formatWorkCount } from "../../model/workUsage";
import styles from "./TitleList.module.css";

export interface TitleRow {
  /** Added since the save: none of it is on the server yet. */
  isNew: boolean;
  title: string;
  /** How many works name the row; none for a row added since the save. */
  workCount?: number | undefined;
}

/** The title of a row that is not being edited, with how many works name it. */
export function TitleRowText({ isNew, title, workCount }: TitleRow) {
  return (
    <span className={styles.rowTitle}>
      <span className={styles.rowTitleText}>
        {title}
        {isNew ? <span className={styles.rowNote}> — новый</span> : null}
      </span>
      {workCount === undefined ? null : (
        <span className={styles.rowCount}>{formatWorkCount(workCount)}</span>
      )}
    </span>
  );
}
