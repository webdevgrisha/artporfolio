import { IconBase, type IconProps } from "./IconBase";

/** A small open arrowhead pointing down, as next to a sortable column in the design. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase width={10} height={6} viewBox="0 0 10 6" {...props}>
      <path d="m.5.5 4.5 4.5L9.5.5" stroke="currentColor" />
    </IconBase>
  );
}
