import React, { type FocusEvent, type PointerEvent, type ReactNode } from "react";

import styles from "./Tooltip.module.css";

interface TooltipProps {
  /** The trigger. It must already have the same accessible name as `content`. */
  children: ReactNode;
  content: string;
}

/**
 * A visible label for an icon-only control, shown on mouse hover and keyboard focus.
 * It only repeats the trigger's accessible name, so it is hidden from assistive technology.
 * Escape hides it without moving the pointer or the focus (WCAG 1.4.13).
 */
export function Tooltip({ children, content }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    // On document: a hovered trigger does not have the focus, so it gets no key events.
    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function handlePointerEnter(event: PointerEvent) {
    // A tap is not a hover: on touch screens the tooltip would stay open after the tap.
    if (event.pointerType === "mouse") setIsOpen(true);
  }

  function handleFocus(event: FocusEvent) {
    // Only keyboard focus: a mouse click already had the hover.
    if (event.target.matches(":focus-visible")) setIsOpen(true);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Listens to events bubbling from the trigger; the wrapper itself is not interactive.
    <span
      className={styles.root}
      onBlur={() => setIsOpen(false)}
      onFocus={handleFocus}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setIsOpen(false)}
    >
      {children}
      <span className={styles.tooltip} data-open={isOpen} aria-hidden="true">
        {content}
      </span>
    </span>
  );
}
