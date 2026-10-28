import { IconBase, type IconProps } from "./IconBase";

export function CheckIcon(props: IconProps) {
  return (
    <IconBase width={24} height={24} viewBox="0 0 24 24" {...props}>
      <path d="M3.5 12.5 9.5 18.5 20.5 6" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}
