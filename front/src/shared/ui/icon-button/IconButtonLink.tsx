import clsx from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Link } from "react-router";

import styles from "./IconButton.module.css";

interface IconButtonLinkProps
  extends Omit<ComponentPropsWithRef<typeof Link>, "aria-label" | "children"> {
  /** The icon. It is decorative: the link is named by `label`. */
  children: ReactNode;
  /** Accessible name of the link. */
  label: string;
}

/** A link that looks like `IconButton`, such as the pencil that opens an edit page. */
export function IconButtonLink({ children, className, label, ...linkProps }: IconButtonLinkProps) {
  return (
    <Link className={clsx(styles.root, className)} aria-label={label} {...linkProps}>
      {children}
    </Link>
  );
}
