import { IconBase, type IconProps } from "@/components/Icon/IconBase";

export function CloseIcon(props: IconProps) {
  return (
    <IconBase width={24} height={24} viewBox="0 0 24 24" {...props}>
      <path d="M1 1 23 23M23 1 1 23" stroke="currentColor" strokeWidth="2" />
    </IconBase>
  );
}
