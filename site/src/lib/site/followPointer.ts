import { loadDeferredImages } from "@/lib/images/deferredImages";

/**
 * Lets the previews of a list follow the mouse (`[data-preview]`, one per row, shown by CSS while
 * its row is under the pointer): each stands beside the pointer, on the side of the screen with
 * more room. Their photos load the first time the pointer comes into the list.
 *
 * Only for a mouse: a finger has nothing to follow, and its phone loads none of them.
 *
 * A script, as nothing in CSS knows where the pointer is; CSS moves them there, a little behind it.
 */
export function followPointer(list: HTMLElement): void {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const previews = [...list.querySelectorAll<HTMLElement>("[data-preview]")];
  let pointer: { x: number; y: number } | undefined;
  let frame = 0;

  /** Where the pointer last was, once a frame however often it moves. */
  const place = () => {
    frame = 0;
    if (!pointer) return;

    const flip = pointer.x > document.documentElement.clientWidth / 2 ? "1" : "0";

    for (const preview of previews) {
      preview.style.setProperty("--pointer-x", `${pointer.x}px`);
      preview.style.setProperty("--pointer-y", `${pointer.y}px`);
      preview.style.setProperty("--flip", flip);
    }
  };

  list.addEventListener(
    "pointerover",
    () => {
      for (const preview of previews) loadDeferredImages(preview);
    },
    { once: true },
  );

  list.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;

    const first = !pointer;

    pointer = { x: event.clientX, y: event.clientY };

    if (first) {
      // The first time, the previews stand at the pointer at once, not gliding from the corner of
      // the screen; from the next frame on they follow it.
      place();
      requestAnimationFrame(() => {
        list.dataset.following = "";
      });
    } else if (!frame) {
      frame = requestAnimationFrame(place);
    }
  });
}
