/**
 * Closed by the mouse or a finger, `dialog` gives the focus back to the button that opened it
 * without the ring of the keyboard; closed by the keyboard, the ring stays. Safari draws it after
 * a click too, carried over from what the dialog focused as it opened; the other browsers already
 * do so.
 */
export function returnFocusQuietly(dialog: HTMLDialogElement): void {
  let byPointer = false;

  dialog.addEventListener("pointerdown", () => {
    byPointer = true;
  });
  dialog.addEventListener("keydown", () => {
    byPointer = false;
  });
  // The browser has given the focus back by the time the dialog says it is closed.
  dialog.addEventListener("close", () => {
    const opener = document.activeElement;

    if (byPointer && opener instanceof HTMLElement && opener.matches(":focus-visible")) {
      opener.blur();
      opener.focus({ focusVisible: false, preventScroll: true });
    }
  });
}
