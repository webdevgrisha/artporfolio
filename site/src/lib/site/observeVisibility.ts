/** Reports whether an element is in the viewport of a visible document; no scroll handler. */
export function observeVisibility(
  element: Element,
  update: (visible: boolean) => void,
): () => void {
  let inView = false;
  const report = (): void => update(inView && !document.hidden);
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === element) inView = entry.isIntersecting;
    }
    report();
  });

  report();
  observer.observe(element);
  document.addEventListener("visibilitychange", report);

  return () => {
    observer.disconnect();
    document.removeEventListener("visibilitychange", report);
  };
}
