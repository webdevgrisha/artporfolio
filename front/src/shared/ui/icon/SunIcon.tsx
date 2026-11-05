import { IconBase, type IconProps } from "./IconBase";

export function SunIcon(props: IconProps) {
  return (
    <IconBase width={24} height={24} viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </IconBase>
  );
}
