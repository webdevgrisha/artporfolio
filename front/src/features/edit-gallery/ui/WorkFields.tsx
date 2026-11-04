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
  maxWorkSetSize,
  minWorkSetSize,
} from "@/entities/gallery";
import type { ListPhoto, Photo } from "@/shared/api/photo";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ColorSwatch } from "@/shared/ui/color-swatch";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/multi-select";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { PhotoListField } from "@/shared/ui/photo-list-field";
import { RadioGroup } from "@/shared/ui/radio-group";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { toIdSet } from "../model/idSet";
import {
  monthOptions,
  type WorkFormValues,
  workFormatOptions,
  workMaxLengths,
} from "../model/workFormSchema";
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
  // fields were registered, so they are registered here in the order of the form. The photos
  // register in their own components, after these: the picker of the work photo takes no focus,
  // and the process photos come last anyway.
  const titleField = register("title");
  const descriptionField = register("description");
  // Radio buttons always hold a choice, so the format is never invalid and needs no ref.
  const { field: formatField } = useController({ control, name: "format" });
  const partCountField = register("partCount");
  const widthField = register("width");
  const heightField = register("height");
  // A select has no input for react-hook-form to register, so a controller keeps its value.
  const { field: monthField } = useController({ control, name: "month" });
  const yearField = register("year");
  const { field: sectionsField } = useController({ control, name: "sectionIds" });
  // A select, so a controller, as for the month.
  const { field: collectionField } = useController({ control, name: "collectionId" });
  const { field: materialsField } = useController({ control, name: "materialIds" });
  const { field: colorsField } = useController({ control, name: "colorIds" });
  const { field: palettesField } = useController({ control, name: "paletteIds" });
  const headingId = React.useId();
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
  // The count of works opens under «Несколько работ», the only format that needs it.
  const formatOptions = workFormatOptions.map((option) =>
    option.value === "set"
      ? {
          ...option,
          details: (
            <Input
              className={styles.count}
              label="Количество работ"
              hint={`От ${String(minWorkSetSize)} до ${String(maxWorkSetSize)}`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="10"
              disabled={isSaving}
              error={errors.partCount?.message}
              isModified={Boolean(dirtyFields.partCount)}
              {...partCountField}
            />
          ),
        }
      : option,
  );

  function clearTitle() {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue("title", "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus("title");
  }

  // The fields in groups under headings, in one column: a form is read and filled top to bottom.
  return (
    <div className={clsx(styles.root, className)}>
      <section className={styles.group} aria-labelledby={`${headingId}-work`}>
        <h2 id={`${headingId}-work`} className={styles.heading}>
          Работа
        </h2>
        <PhotoFields label="Фото работы" isSaving={isSaving} serverPhoto={savedPhoto} />
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
      </section>

      <section className={styles.group} aria-labelledby={`${headingId}-size`}>
        <h2 id={`${headingId}-size`} className={styles.heading}>
          Формат и размер
        </h2>
        <RadioGroup
          label="Формат"
          name={formatField.name}
          options={formatOptions}
          value={formatField.value}
          disabled={isSaving}
          isModified={Boolean(dirtyFields.format)}
          onChange={formatField.onChange}
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
      </section>

      <section className={styles.group} aria-labelledby={`${headingId}-place`}>
        <h2 id={`${headingId}-place`} className={styles.heading}>
          Где показывать
        </h2>
        <SectionsField
          sections={sections}
          value={sectionsField.value}
          savedIds={savedSectionIds}
          disabled={isSaving}
          error={errors.sectionIds?.message}
          inputRef={sectionsField.ref}
          onBlur={sectionsField.onBlur}
          onChange={(ids) => sectionsField.onChange(toIdSet(ids))}
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
          value={collectionField.value}
          onBlur={collectionField.onBlur}
          onChange={collectionField.onChange}
        />
      </section>

      <section className={styles.group} aria-labelledby={`${headingId}-search`}>
        <h2 id={`${headingId}-search`} className={styles.heading}>
          Для поиска на сайте
        </h2>
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
          onChange={(ids) => materialsField.onChange(toIdSet(ids))}
        />
        <MultiSelect
          label="Цвета"
          hint={`До ${String(maxWorkColors)}`}
          placeholder="Например: синий"
          options={colorOptions}
          value={colorsField.value}
          disabled={isSaving}
          error={errors.colorIds?.message}
          isModified={Boolean(dirtyFields.colorIds)}
          inputRef={colorsField.ref}
          onBlur={colorsField.onBlur}
          onChange={(ids) => colorsField.onChange(toIdSet(ids))}
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
          onChange={(ids) => palettesField.onChange(toIdSet(ids))}
        />
      </section>

      <section className={styles.group} aria-labelledby={`${headingId}-process`}>
        <h2 id={`${headingId}-process`} className={styles.heading}>
          Процесс
        </h2>
        <PhotoListField
          label="Фото процесса"
          altPlaceholder="Например: первые наброски карандашом"
          maxPhotos={maxWorkProcessPhotos}
          isSaving={isSaving}
          savedPhotos={savedProcessPhotos}
        />
      </section>
    </div>
  );
}
