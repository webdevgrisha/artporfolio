import { IconBase, type IconProps } from "./IconBase";

/** Two arrowheads, up and down: a column that can be sorted but is not. */
export function SortIcon(props: IconProps) {
  return (
    <IconBase width={10} height={14} viewBox="0 0 10 14" {...props}>
      <path d="m.5 5 4.5-4.5L9.5 5M.5 9 5 13.5 9.5 9" stroke="currentColor" />
    </IconBase>
  );
}
