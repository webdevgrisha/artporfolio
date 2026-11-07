import { galleryMaterialsQuery, maxMaterials, replaceGalleryMaterials } from "@/entities/gallery";

import { getSaveMaterialsErrorMessage } from "../lib/saveErrorMessages";
import type { TitleListConfig } from "./titleList";

export const materialsList: TitleListConfig = {
  getSaveErrorMessage: getSaveMaterialsErrorMessage,
  max: maxMaterials,
  query: galleryMaterialsQuery,
  replace: ({ etag, items }) => replaceGalleryMaterials({ etag, materials: items }),
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
  toastId: "gallery-materials-save",
  translationResource: "gallery-materials",
  usages: (usage) => usage.materials,
};
