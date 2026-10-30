import clsx from "clsx";

import type { SitePages } from "@/entities/site-page";

import { heroFields } from "../model/heroFields";
import styles from "./EditPageHeroes.module.css";
import { PageHeroCard } from "./PageHeroCard";

interface EditPageHeroesProps {
  className?: string;
  /** The pages as stored on the server. */
  pages: SitePages;
}

/** The hero of every page, each saved on its own. */
export function EditPageHeroes({ className, pages }: EditPageHeroesProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {heroFields.map((field) => (
        <PageHeroCard key={field.page} field={field} hero={pages[field.page].hero} />
      ))}
    </div>
  );
}
