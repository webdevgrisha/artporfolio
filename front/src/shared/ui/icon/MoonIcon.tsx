import { IconBase, type IconProps } from "./IconBase";

export function MoonIcon(props: IconProps) {
  return (
    <IconBase width={24} height={24} viewBox="0 0 24 24" {...props}>
      <path
        d="M21 14.2A9 9 0 1 1 9.8 3a7.2 7.2 0 0 0 11.2 11.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </IconBase>
  );
}
