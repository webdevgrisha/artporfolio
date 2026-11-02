import { IconBase, type IconProps } from "./IconBase";

/** A small open arrowhead pointing right, such as between breadcrumbs. */
export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase width={6} height={10} viewBox="0 0 6 10" {...props}>
      <path d="m.5.5 4.5 4.5L.5 9.5" stroke="currentColor" />
    </IconBase>
  );
}
