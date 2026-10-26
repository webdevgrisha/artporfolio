import type { Ref } from "react";

import { MenuIcon } from "@/components/Icon/MenuIcon";
import styles from "@/pages/Admin/components/MobileMenuButton/MobileMenuButton.module.css";

interface MobileMenuButtonProps {
  controls: string;
  isExpanded: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function MobileMenuButton({ controls, isExpanded, onClick, ref }: MobileMenuButtonProps) {
  return (
    <button
      ref={ref}
      className={styles.root}
      type="button"
      aria-label="Открыть меню"
      aria-controls={controls}
      aria-expanded={isExpanded}
      onClick={onClick}
    >
      <MenuIcon />
    </button>
  );
}
