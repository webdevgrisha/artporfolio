import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";

export function getSaveMaterialsErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить материалы. Попробуйте ещё раз",
  });
}

export function getSaveColorsErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить цвета. Попробуйте ещё раз",
  });
}

export function getSavePalettesErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить палитры. Попробуйте ещё раз",
  });
}
