import { IconBase, type IconProps } from "./IconBase";

export function ErrorIcon(props: IconProps) {
  return (
    <IconBase width={24} height={24} viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="11.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
    </IconBase>
  );
}
