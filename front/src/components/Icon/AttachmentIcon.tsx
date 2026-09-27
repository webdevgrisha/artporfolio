import { IconBase, type IconProps } from "@/components/Icon/IconBase";

export function AttachmentIcon(props: IconProps) {
  return (
    <IconBase width={18.5} height={45.5} viewBox="0 0 18.5 45.5" {...props}>
      <path
        d="M17.75 8.083V39.25c0 3.038-2.854 5.5-6.375 5.5S5 42.288 5 39.25V15.632m12.75-7.549v16.5m0-16.5C17.75 4.033 13.944.75 9.25.75S.75 4.033.75 8.083V36.5M5 30.083v-16.5c0-2.025 1.903-3.666 4.25-3.666s4.25 1.641 4.25 3.666V36.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </IconBase>
  );
}
