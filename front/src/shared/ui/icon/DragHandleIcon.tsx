import { IconBase, type IconProps } from "./IconBase";

/** Two columns of dots: the grip of an item that can be dragged. */
export function DragHandleIcon(props: IconProps) {
  return (
    <IconBase width={12} height={20} viewBox="0 0 12 20" {...props}>
      <circle cx="3" cy="3" r="1.5" fill="currentColor" />
      <circle cx="9" cy="3" r="1.5" fill="currentColor" />
      <circle cx="3" cy="10" r="1.5" fill="currentColor" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="3" cy="17" r="1.5" fill="currentColor" />
      <circle cx="9" cy="17" r="1.5" fill="currentColor" />
    </IconBase>
  );
}
