import { IconBase, type IconProps } from "@/components/Icon/IconBase";

export function MenuIcon(props: IconProps) {
  return (
    <IconBase width={31} height={14} viewBox="0 0 31 14" {...props}>
      <rect width="31" height="2" fill="currentColor" />
      <rect y="12" width="31" height="2" fill="currentColor" />
    </IconBase>
  );
}
