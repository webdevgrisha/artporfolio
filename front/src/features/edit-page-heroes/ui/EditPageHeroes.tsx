import clsx from "clsx";

import { heroFields } from "../model/heroFields";
import styles from "./EditPageHeroes.module.css";
import { PageHeroCard } from "./PageHeroCard";

interface EditPageHeroesProps {
  className?: string;
}

/** The hero of every page, each saved on its own. */
export function EditPageHeroes({ className }: EditPageHeroesProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {heroFields.map((field) => (
        <PageHeroCard key={field.page} field={field} />
      ))}
    </div>
  );
}
