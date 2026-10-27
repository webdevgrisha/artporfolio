import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";
import { Link } from "react-router";

import styles from "./Button.module.css";

type ButtonProps = ComponentPropsWithRef<"button">;
type ButtonLinkProps = ComponentPropsWithRef<typeof Link>;

export function Button({ children, className, ref, type = "button", ...buttonProps }: ButtonProps) {
  return (
    <button ref={ref} className={clsx(styles.root, className)} type={type} {...buttonProps}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, className, ref, ...linkProps }: ButtonLinkProps) {
  return (
    <Link ref={ref} className={clsx(styles.root, className)} {...linkProps}>
      {children}
    </Link>
  );
}
