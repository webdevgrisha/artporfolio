import type { Ref } from "react";

import { MenuIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./MobileMenuButton.module.css";

const label = "Открыть меню";

interface MobileMenuButtonProps {
  controls: string;
  isExpanded: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function MobileMenuButton({ controls, isExpanded, onClick, ref }: MobileMenuButtonProps) {
  return (
    <Tooltip className={styles.root} content={label}>
      <IconButton
        ref={ref}
        label={label}
        aria-controls={controls}
        aria-expanded={isExpanded}
        onClick={onClick}
      >
        <MenuIcon />
      </IconButton>
    </Tooltip>
  );
}
