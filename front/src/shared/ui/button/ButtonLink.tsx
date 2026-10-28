import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";
import { Link } from "react-router";

import styles from "./Button.module.css";

type ButtonLinkProps = ComponentPropsWithRef<typeof Link>;

/** A link that looks like `Button`. */
export function ButtonLink({ children, className, ref, ...linkProps }: ButtonLinkProps) {
  return (
    <Link ref={ref} className={clsx(styles.root, className)} {...linkProps}>
      {children}
    </Link>
  );
}
