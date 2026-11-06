import type { TranslatedField } from "@/shared/ui/language-form";

/** The texts of a work that are translated, under the names the server gives them. */
export const workTranslatedFields = ["title", "description", "city", "alt"] as const;

/** How the work form shows its translated texts. */
export const workLanguageFields: readonly TranslatedField[] = [
  { field: "title", label: "Название", source: "title" },
  { field: "description", label: "Описание", multiline: true, source: "description" },
  { field: "city", label: "Город", source: "city" },
  { field: "alt", label: "Описание фото", source: "photoAlt" },
];
