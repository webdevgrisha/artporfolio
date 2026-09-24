import { IconBase, type IconProps } from "@/components/Icon/IconBase";

export function TrashIcon(props: IconProps) {
  return (
    <IconBase width={38} height={43.75} viewBox="0 0 38 43.75" {...props}>
      <rect x="5.75" y="11.5" width="26.5" height="31.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M0 10.75H38" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M29 10.75C29 5.227 24.523.75 19 .75S9 5.227 9 10.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M15 15.75V37.75M23 15.75V37.75" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}
