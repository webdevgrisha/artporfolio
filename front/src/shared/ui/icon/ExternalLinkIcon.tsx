import { IconBase, type IconProps } from "./IconBase";

/** An arrow out of the corner: the link opens another site in a new tab. */
export function ExternalLinkIcon(props: IconProps) {
  return (
    <IconBase width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="M4 1h7v7M11 1 1 11" stroke="currentColor" strokeWidth="1.25" />
    </IconBase>
  );
}
