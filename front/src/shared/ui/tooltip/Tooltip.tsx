import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import clsx from "clsx";
import React, { type ReactNode } from "react";

import styles from "./Tooltip.module.css";

// Pixels: the distance to the trigger and to the viewport edge stay the same at any font size.
const triggerGap = 8;
const viewportPadding = 8;
const openDelay = 300;

interface TooltipProps {
  /** The trigger. It must already have the same accessible name as `content`. */
  children: ReactNode;
  /** Positions the wrapper around the trigger. */
  className?: string;
  content: string;
}

/**
 * A visible label for an icon-only control, shown on mouse hover and keyboard focus.
 * It only repeats the trigger's accessible name, so it is hidden from assistive technology.
 * Escape hides it, and the pointer can move onto it without closing it (WCAG 1.4.13).
 */
export function Tooltip({ children, className, content }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { context, floatingStyles, refs } = useFloating({
    middleware: [offset(triggerGap), flip(), shift({ padding: viewportPadding })],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: "top",
    whileElementsMounted: autoUpdate,
  });
  const { getFloatingProps, getReferenceProps } = useInteractions([
    // A tap is not a hover: on touch screens the tooltip would stay open after the tap.
    useHover(context, { delay: { open: openDelay }, handleClose: safePolygon(), mouseOnly: true }),
    // Only keyboard focus: a mouse click already had the hover.
    useFocus(context, { visibleOnly: true }),
    useDismiss(context),
  ]);

  return (
    <>
      {/* The wrapper receives the trigger's bubbling events, so any trigger works without a ref. */}
      <span
        ref={refs.setReference}
        className={clsx(styles.trigger, className)}
        {...getReferenceProps()}
      >
        {children}
      </span>
      {isOpen ? (
        <FloatingPortal>
          <span
            ref={refs.setFloating}
            className={styles.tooltip}
            style={floatingStyles}
            aria-hidden="true"
            {...getFloatingProps()}
          >
            {content}
          </span>
        </FloatingPortal>
      ) : null}
    </>
  );
}
