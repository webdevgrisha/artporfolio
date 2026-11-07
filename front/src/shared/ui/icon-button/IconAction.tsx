import type { ComponentProps } from "react";

import { Tooltip } from "@/shared/ui/tooltip";

import { IconButton } from "./IconButton";

interface IconActionProps extends ComponentProps<typeof IconButton> {
  /** Positions the wrapper of the tooltip around the button. */
  tooltipClassName?: string;
}

/** An icon button with its name in a tooltip, so a person sees what the screen reader says. */
export function IconAction({ label, tooltipClassName, ...buttonProps }: IconActionProps) {
  return (
    <Tooltip className={tooltipClassName} content={label}>
      <IconButton label={label} {...buttonProps} />
    </Tooltip>
  );
}
