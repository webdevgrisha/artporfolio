import { toPrice } from "#modules/gallery/works/prices";
import type { KnownData } from "#modules/gallery/works/references";
import type { StoredWork, Work, WorkSummary } from "#modules/gallery/works/schema";
import { workTexts } from "#modules/gallery/works/texts";
import { toTranslations } from "#shared/i18n/translations";
import { toPhoto } from "#shared/images/photo";
import { toListPhoto } from "#shared/images/photo-list";

const centimetresPerInch = 2.54;

/**
 * A side in inches, rounded to hundredths. A side measured in inches with two decimals and saved in
 * centimetres comes back as measured: 16 inches are stored as 40.64 cm and read as 16 again.
 */
function toInches(centimetres: number): number {
  return Math.round((centimetres / centimetresPerInch) * 100) / 100;
}

/**
 * The stored work as the list of works returns it, with download URLs and ISO 8601 dates. A
 * section, a material, a color or a palette deleted since the work was saved is left out (`known`,
 * the ids that exist).
 */
export function toWorkSummary(
  id: string,
  {
    city,
    collectionId,
    colorIds,
    country,
    createdAt,
    format,
    materialIds,
    month,
    paletteIds,
    partCount,
    photo,
    price,
    published,
    saleStatus,
    sectionIds,
    size,
    title,
    updatedAt,
    year,
  }: StoredWork,
  known: KnownData,
): WorkSummary {
  return {
    city,
    collectionId,
    colorIds: colorIds.filter((colorId) => known.colors.has(colorId)),
    country,
    createdAt: createdAt.toDate().toISOString(),
    format,
    id,
    materialIds: materialIds.filter((materialId) => known.materials.has(materialId)),
    month,
    paletteIds: paletteIds.filter((paletteId) => known.palettes.has(paletteId)),
    partCount,
    photo: toPhoto(photo),
    price: toPrice(price, known.rates),
    published,
    saleStatus,
    sectionIds: sectionIds.filter((sectionId) => known.sections.has(sectionId)),
    size,
    sizeInches: { width: toInches(size.width), height: toInches(size.height) },
    title,
    updatedAt: updatedAt.toDate().toISOString(),
    year,
  };
}

/**
 * The stored work as the API returns it alone: its summary, its description, its process photos
 * and its translations.
 */
export function toWork(id: string, work: StoredWork, known: KnownData): Work {
  return {
    ...toWorkSummary(id, work, known),
    description: work.description,
    processPhotos: work.processPhotos.map(toListPhoto),
    translations: toTranslations(work.translations, workTexts(work)),
  };
}
