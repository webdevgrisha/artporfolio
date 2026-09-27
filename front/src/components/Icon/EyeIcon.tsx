import { IconBase, type IconProps } from "@/components/Icon/IconBase";

export function EyeIcon(props: IconProps) {
  return (
    <IconBase width={32} height={18} viewBox="0 0 45 25.3125" {...props}>
      <path
        d="M22.5.75c5.968 0 11.43 3.046 15.449 6.17a40.984 40.984 0 0 1 6.07 5.736 40.97 40.97 0 0 1-6.07 5.737c-4.02 3.123-9.481 6.17-15.449 6.17s-11.43-3.047-15.45-6.17a40.98 40.98 0 0 1-6.07-5.737A40.994 40.994 0 0 1 7.05 6.92C11.07 3.796 16.532.75 22.5.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="22.5" cy="12.656" r="6.281" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}
