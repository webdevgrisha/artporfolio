/**
 * Rolls `dialog` up before it closes, in every browser the same way. Every way of closing it asks
 * first by a `cancel` event: Escape, a click beside it (`closedby`) and its button
 * (`request-close`). The dialog is then marked `data-closing` while still open, its style rolls it
 * up by its own transitions, and it closes once they end, into the same style, so nothing moves
 * again. On a screen without motion there are none to wait for, and it closes at once.
 *
 * A browser may make a `cancel` impossible to stop, as Chrome does after one without a click or a
 * key in between; the dialog then closes at once, as it would without this script.
 */
export function rollUpOnClose(dialog: HTMLDialogElement): void {
  dialog.addEventListener("cancel", (event) => {
    if (!event.cancelable) return;

    event.preventDefault();
    if (!dialog.hasAttribute("data-closing")) void rollUp(dialog);
  });
}

async function rollUp(dialog: HTMLDialogElement): Promise<void> {
  dialog.setAttribute("data-closing", "");

  try {
    // Asked for after the mark, so the style has started them.
    const transitions = dialog
      .getAnimations()
      .filter(
        (animation) =>
          animation instanceof CSSTransition && animation.transitionProperty === "clip-path",
      );

    await Promise.all(transitions.map((transition) => transition.finished));
  } catch {
    // A transition cancelled before its end, as by another style: the dialog closes all the same.
  } finally {
    // Closed whatever the transitions do, so the page never stays behind an open menu.
    dialog.close();
    dialog.removeAttribute("data-closing");
  }
}
