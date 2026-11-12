/**
 * Calls back as the scroll of the page comes to rest: on scrollend, or, in Safari before 26.2,
 * which lacks it, after a pause in the scroll. Remove the stand-in once those are gone.
 */
export function onScrollEnd(callback: () => void): void {
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", callback);

    return;
  }

  let pause = 0;

  document.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(pause);
      pause = window.setTimeout(callback, 150);
    },
    { passive: true },
  );
}
