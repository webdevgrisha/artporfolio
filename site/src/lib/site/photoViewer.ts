import PhotoSwipeLightbox from "photoswipe/lightbox";

import "photoswipe/style.css";

/** What the viewer of a photo says, in the language of the page. */
export interface ViewerLabels {
  close: string;
  error: string;
  next: string;
  previous: string;
  zoom: string;
}

/**
 * Opens the photos of `gallery` on the whole screen, where they can be zoomed and followed, with
 * PhotoSwipe: each link of `linkSelector` leads to its largest file and gives its size. The viewer
 * itself loads only when a photo is first opened. `onClose` gets the photo it closes on, in the
 * order of the links, as it starts to close.
 */
export function setUpPhotoViewer(
  gallery: HTMLElement,
  linkSelector: string,
  labels: ViewerLabels,
  onClose: (index: number) => void,
): void {
  const lightbox = new PhotoSwipeLightbox({
    arrowNextTitle: labels.next,
    arrowPrevTitle: labels.previous,
    bgOpacity: 1,
    children: linkSelector,
    closeTitle: labels.close,
    errorMsg: labels.error,
    gallery,
    pswpModule: () => import("photoswipe"),
    zoomTitle: labels.zoom,
  });

  lightbox.on("close", () => onClose(lightbox.pswp?.currIndex ?? 0));
  lightbox.init();
}
