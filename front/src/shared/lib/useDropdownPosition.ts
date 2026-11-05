import { autoUpdate, flip, offset, size, useFloating } from "@floating-ui/react";

// Pixels, as in Tooltip: the gap to the field (--space-1 at the default font size) and to the edge
// of the screen.
const fieldGap = 4;
const viewportPadding = 8;

/**
 * Places the list of a select or a combobox under its field, or above it when there is more room
 * there, and lets it be no taller than the room it has, so the list never opens off the screen.
 * The list sets its height limit through `--dropdown-available-height`. It is followed only while
 * open: the closed list stays in the page, as Downshift needs.
 */
export function useDropdownPosition(isOpen: boolean) {
  const { floatingStyles, refs } = useFloating({
    middleware: [
      offset(fieldGap),
      flip({ padding: viewportPadding }),
      size({
        apply: ({ availableHeight, elements }) => {
          elements.floating.style.setProperty(
            "--dropdown-available-height",
            `${String(Math.floor(availableHeight))}px`,
          );
        },
        padding: viewportPadding,
      }),
    ],
    open: isOpen,
    placement: "bottom-start",
    whileElementsMounted: isOpen ? autoUpdate : undefined,
  });

  return { floatingStyles, setField: refs.setReference, setList: refs.setFloating };
}
