import {
  type GalleryPalettes,
  galleryPalettesQuery,
  maxPalettes,
  replaceGalleryPalettes,
} from "@/entities/gallery";

import { getSavePalettesErrorMessage } from "../lib/saveErrorMessages";
import type { TitleListConfig } from "./titleList";

/** The palettes: the coloring of a work as a whole. */
export const palettesList: TitleListConfig<GalleryPalettes, string[]> = {
  getSaveErrorMessage: getSavePalettesErrorMessage,
  max: maxPalettes,
  query: galleryPalettesQuery,
  replace: ({ etag, items }) => replaceGalleryPalettes({ etag, palettes: { palettes: items } }),
  texts: {
    add: "Добавить палитру",
    duplicate: "Такая палитра уже есть",
    empty: "Палитр пока нет",
    full: `Палитр уже ${String(maxPalettes)}, больше добавить нельзя`,
    heading: "Палитры",
    newItem: "Новая палитра",
    placeholder: "Например: Пастельная",
    rowField: (title) => `Название палитры ${title}`,
    rowFallback: "палитру",
    tooMany: `Не больше ${String(maxPalettes)} палитр`,
  },
  toItems: ({ palettes }) => palettes.map(({ id, title }) => ({ id, title })),
  toastId: "gallery-palettes-save",
};
