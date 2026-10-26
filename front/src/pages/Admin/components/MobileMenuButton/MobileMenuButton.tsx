import type { Ref } from "react";
import { MenuToggleIcon } from "./MenuToggleIcon/MenuToggleIcon";
import styles from "./MobileMenuButton.module.css";

interface MobileMenuButtonProps {
  controls: string;
  isOpen: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function MobileMenuButton({ controls, isOpen, onClick, ref }: MobileMenuButtonProps) {
  return (
    <button
      ref={ref}
      className={styles.root}
      type="button"
      aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
      aria-controls={controls}
      aria-expanded={isOpen}
      onClick={onClick}
    >
      <MenuToggleIcon isOpen={isOpen} />
    </button>
  );
}
