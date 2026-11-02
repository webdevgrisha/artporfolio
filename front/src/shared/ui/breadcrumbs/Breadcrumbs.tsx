import clsx from "clsx";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { ChevronRightIcon } from "@/shared/ui/icon";

import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: ReactNode;
  /** The page of the item; none for the current page, the last item. */
  to?: string;
}

interface BreadcrumbsProps {
  className?: string;
  /** From the top down; the last one is the current page. */
  items: readonly BreadcrumbItem[];
}

/** The way to the current page: the pages above it are links, the page itself is plain text. */
export function Breadcrumbs({ className, items }: BreadcrumbsProps) {
  return (
    <nav className={clsx(styles.root, className)} aria-label="Вы здесь">
      <ol className={styles.list}>
        {items.map((item, index) => (
          // The labels may repeat a page title elsewhere, but not within one trail.
          // biome-ignore lint/suspicious/noArrayIndexKey: the trail is rebuilt, never reordered.
          <li key={index} className={styles.item}>
            {index > 0 ? <ChevronRightIcon className={styles.separator} /> : null}
            {item.to ? (
              <Link className={styles.link} to={item.to}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
