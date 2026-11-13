/**
 * Stands in for what a browser may lack of the controls of a modal dialog, each by what it does
 * where it is native, and does nothing where it is. Remove each once every browser has it:
 *
 * - buttons that open and close it by `commandfor` (Safari before 26.2), and the
 *   `request-close` among their commands;
 * - `requestClose()`, which asks it to close by a `cancel` event first (Safari before 18.4);
 * - a click beside it that closes it (`closedby="any"`, not in Safari yet).
 */
export function standInDialogControls(dialog: HTMLDialogElement): void {
  if (!knowsCommand("request-close")) {
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      `[commandfor="${dialog.id}"]`,
    )) {
      const command = button.getAttribute("command");

      // Where the browser has commands, it already opens the dialog by them.
      if (command === "show-modal" && knowsCommand("show-modal")) continue;

      button.addEventListener("click", () => {
        if (command === "show-modal") dialog.showModal();
        else if (command === "request-close") requestClose(dialog);
      });
    }
  }

  if (!("closedBy" in HTMLDialogElement.prototype)) {
    // A click on the backdrop lands on the dialog itself, outside its box.
    dialog.addEventListener("click", (event) => {
      const box = dialog.getBoundingClientRect();
      const outside =
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom;

      if (event.target === dialog && outside) requestClose(dialog);
    });
  }
}

/** Whether buttons of this browser know `command`: it reads back as empty where they do not. */
function knowsCommand(command: string): boolean {
  const button = document.createElement("button");

  button.setAttribute("command", command);
  return "command" in button && button.command === command;
}

/** Asks the dialog to close, as `requestClose()` does: by a `cancel` that can stop it first. */
function requestClose(dialog: HTMLDialogElement): void {
  if ("requestClose" in HTMLDialogElement.prototype) {
    dialog.requestClose();
  } else if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) {
    dialog.close();
  }
}
