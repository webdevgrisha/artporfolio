import {
  type GalleryMaterials,
  galleryMaterialsQuery,
  maxMaterials,
  replaceGalleryMaterials,
} from "@/entities/gallery";

import { getSaveMaterialsErrorMessage } from "../lib/saveErrorMessages";
import type { TitleListConfig } from "./titleList";

export const materialsList: TitleListConfig<GalleryMaterials, string[]> = {
  getSaveErrorMessage: getSaveMaterialsErrorMessage,
  max: maxMaterials,
  query: galleryMaterialsQuery,
  replace: ({ etag, items }) => replaceGalleryMaterials({ etag, materials: { materials: items } }),
  texts: {
    add: "Добавить материал",
    duplicate: "Такой материал уже есть",
    empty: "Материалов пока нет",
    full: `Материалов уже ${String(maxMaterials)}, больше добавить нельзя`,
    heading: "Материалы",
    newItem: "Новый материал",
    placeholder: "Например: Акварель",
    rowField: (title) => `Название материала ${title}`,
    rowFallback: "материал",
    others: "материалов",
    tooMany: `Не больше ${String(maxMaterials)} материалов`,
  },
  toItems: ({ materials }) => materials.map(({ id, title }) => ({ id, title })),
  toastId: "gallery-materials-save",
  workIds: (work) => work.materialIds,
};
