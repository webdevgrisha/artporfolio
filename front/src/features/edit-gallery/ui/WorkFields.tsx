import clsx from "clsx";
import React from "react";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import {
  type GalleryCollection,
  type GalleryColor,
  type GalleryMaterial,
  type GalleryPalette,
  type GallerySection,
  maxWorkColors,
  maxWorkMaterials,
  maxWorkPalettes,
  maxWorkProcessPhotos,
} from "@/entities/gallery";
import type { ListPhoto, Photo } from "@/shared/api/photo";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ColorSwatch } from "@/shared/ui/color-swatch";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/multi-select";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { PhotoListField } from "@/shared/ui/photo-list-field";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { monthOptions, type WorkFormValues, workMaxLengths } from "../model/workFormSchema";
import { toCollectionOptions, toTitleOptions } from "../model/workReferences";
import { SectionsField } from "./SectionsField";
import styles from "./WorkFields.module.css";

interface WorkFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo of the saved work, shown while the photo field keeps it; none for a new work. */
  savedPhoto: Photo | null;
  /** The process photos of the saved work, to show that some were removed or moved. */
  savedProcessPhotos: readonly ListPhoto[];
  /** The sections of the gallery, sorted by title, to choose from. */
  sections: readonly GallerySection[];
  /** The materials of the gallery, sorted by title, to choose from. */
  materials: readonly GalleryMaterial[];
  /** The colors of the gallery, sorted by title, to choose from. */
  colors: readonly GalleryColor[];
  /** The palettes of the gallery, sorted by title, to choose from. */
  palettes: readonly GalleryPalette[];
  /** The collections of the gallery, to choose from. */
  collections: readonly GalleryCollection[];
}

/** The fields of a work form; they read the form from its context. */
export function WorkFields({
  className,
  collections,
  colors,
  isSaving,
  materials,
  palettes,
  savedPhoto,
  savedProcessPhotos,
  sections,
}: WorkFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<WorkFormValues>();
  const { defaultValues, dirtyFields, errors, isSubmitted } = useFormState({ control });
  const title = useWatch({ control, name: "title" });
  // After a refused submit, react-hook-form focuses the first invalid field in the order the
  // fields were registered, so they are registered here in the order of the form; the photos
  // come last, from their own components.
  const titleField = register("title");
  const descriptionField = register("description");
  const { field: sectionsField } = useController({ control, name: "sectionIds" });
  const { field: materialsField } = useController({ control, name: "materialIds" });
  const { field: colorsField } = useController({ control, name: "colorIds" });
  const { field: palettesField } = useController({ control, name: "paletteIds" });
  // A select, so a controller, as for the month below.
  const { field: collectionField } = useController({ control, name: "collectionId" });
  const widthField = register("width");
  const heightField = register("height");
  // A select is not a text input: before the form is ready, react-hook-form takes its DOM value
  // for a change, so a controller keeps the value in the form's state instead (see the colours).
  const { field: monthField } = useController({ control, name: "month" });
  const yearField = register("year");
  const savedSectionIds = React.useMemo(
    () => defaultValues?.sectionIds?.filter((id) => id !== undefined) ?? [],
    [defaultValues],
  );
  const materialOptions = React.useMemo(() => toTitleOptions(materials), [materials]);
  const colorOptions = React.useMemo(
    () =>
      colors.map(({ hex, id, title }) => ({
        icon: <ColorSwatch hex={hex} variant="text" />,
        label: title,
        value: id,
      })),
    [colors],
  );
  const paletteOptions = React.useMemo(() => toTitleOptions(palettes), [palettes]);
  const collectionOptions = React.useMemo(() => toCollectionOptions(collections), [collections]);

  function clearTitle() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("title", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("title");
  }

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.texts}>
        <ClearableInput
          label="Название"
          hint={`До ${String(workMaxLengths.title)} символов`}
          placeholder="Например: Слон на закате"
          disabled={isSaving}
          error={errors.title?.message}
          isModified={Boolean(dirtyFields.title)}
          hasValue={Boolean(title)}
          clearLabel="Очистить название"
          onClear={clearTitle}
          {...titleField}
        />
        <Textarea
          label="Описание"
          hint={`До ${String(workMaxLengths.description)} символов. Абзацы разделяйте пустой строкой`}
          placeholder="О чём работа и как она сделана"
          rows={8}
          disabled={isSaving}
          error={errors.description?.message}
          isModified={Boolean(dirtyFields.description)}
          {...descriptionField}
        />
        <SectionsField
          sections={sections}
          value={sectionsField.value}
          savedIds={savedSectionIds}
          disabled={isSaving}
          error={errors.sectionIds?.message}
          inputRef={sectionsField.ref}
          onBlur={sectionsField.onBlur}
          onChange={sectionsField.onChange}
        />
        <MultiSelect
          label="Материалы"
          hint={`До ${String(maxWorkMaterials)}`}
          placeholder="Например: масло"
          options={materialOptions}
          value={materialsField.value}
          disabled={isSaving}
          error={errors.materialIds?.message}
          isModified={Boolean(dirtyFields.materialIds)}
          inputRef={materialsField.ref}
          onBlur={materialsField.onBlur}
          onChange={materialsField.onChange}
        />
        <MultiSelect
          label="Цвета"
          hint={`До ${String(maxWorkColors)}. Для чёрно-белой работы выберите «Чёрный» и «Белый»`}
          placeholder="Например: синий"
          options={colorOptions}
          value={colorsField.value}
          disabled={isSaving}
          error={errors.colorIds?.message}
          isModified={Boolean(dirtyFields.colorIds)}
          inputRef={colorsField.ref}
          onBlur={colorsField.onBlur}
          onChange={colorsField.onChange}
        />
        <MultiSelect
          label="Палитры"
          hint={`До ${String(maxWorkPalettes)}. Как работа окрашена в целом`}
          placeholder="Например: пастельная"
          options={paletteOptions}
          value={palettesField.value}
          disabled={isSaving}
          error={errors.paletteIds?.message}
          isModified={Boolean(dirtyFields.paletteIds)}
          inputRef={palettesField.ref}
          onBlur={palettesField.onBlur}
          onChange={palettesField.onChange}
        />
        {/* Always holds a choice, so it needs no «Необязательно»: «Без коллекции» is one. */}
        <Select
          className={styles.collection}
          label="Коллекция"
          options={collectionOptions}
          disabled={isSaving}
          error={errors.collectionId?.message}
          isModified={Boolean(dirtyFields.collectionId)}
          ref={collectionField.ref}
          name={collectionField.name}
          value={collectionField.value}
          onBlur={collectionField.onBlur}
          onChange={collectionField.onChange}
        />
        <div className={styles.size}>
          <Input
            className={styles.side}
            label="Ширина, см"
            inputMode="decimal"
            autoComplete="off"
            placeholder="50"
            disabled={isSaving}
            error={errors.width?.message}
            isModified={Boolean(dirtyFields.width)}
            {...widthField}
          />
          <Input
            className={styles.side}
            label="Высота, см"
            inputMode="decimal"
            autoComplete="off"
            placeholder="70"
            disabled={isSaving}
            error={errors.height?.message}
            isModified={Boolean(dirtyFields.height)}
            {...heightField}
          />
        </div>
        {/* When the work was finished, as it is read: the month, then the year. */}
        <div className={styles.date}>
          <Select
            className={styles.month}
            label="Месяц"
            placeholder="Выберите"
            options={monthOptions}
            disabled={isSaving}
            error={errors.month?.message}
            isModified={Boolean(dirtyFields.month)}
            ref={monthField.ref}
            name={monthField.name}
            value={monthField.value}
            onBlur={monthField.onBlur}
            onChange={monthField.onChange}
          />
          <Input
            className={styles.year}
            label="Год"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder={String(new Date().getFullYear())}
            disabled={isSaving}
            error={errors.year?.message}
            isModified={Boolean(dirtyFields.year)}
            {...yearField}
          />
        </div>
      </div>

      <PhotoFields label="Фото работы" isSaving={isSaving} serverPhoto={savedPhoto} />

      <PhotoListField
        label="Фото процесса"
        altPlaceholder="Например: первые наброски карандашом"
        maxPhotos={maxWorkProcessPhotos}
        isSaving={isSaving}
        savedPhotos={savedProcessPhotos}
      />
    </div>
  );
}
