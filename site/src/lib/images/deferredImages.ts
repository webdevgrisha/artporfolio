/**
 * Loads the deferred images of `container` (see `Picture`): moves their files from the data
 * attributes in place, so the browser fetches them. An image loaded already is left as it is.
 */
export function loadDeferredImages(container: Element): void {
  for (const element of container.querySelectorAll<HTMLImageElement | HTMLSourceElement>(
    "[data-deferred-srcset]",
  )) {
    element.srcset = element.dataset.deferredSrcset ?? "";
    delete element.dataset.deferredSrcset;
  }

  for (const image of container.querySelectorAll<HTMLImageElement>("img[data-deferred-src]")) {
    image.src = image.dataset.deferredSrc ?? "";
    delete image.dataset.deferredSrc;
  }
}
