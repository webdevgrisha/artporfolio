import clsx from "clsx";
import React from "react";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";

import {
  maxWorkColors,
  maxWorkMaterials,
  maxWorkPalettes,
  maxWorkProcessPhotos,
  maxWorkSetSize,
  minWorkSetSize,
} from "@/entities/gallery";
import type { ListPhoto, Photo } from "@/shared/api/photo";
import { Checkbox } from "@/shared/ui/checkbox";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ColorSwatch } from "@/shared/ui/color-swatch";
import { Combobox } from "@/shared/ui/combobox";
import { FieldHint } from "@/shared/ui/field";
import { Frame, FrameRow, FrameRowLabel } from "@/shared/ui/frame-list";
import { Input } from "@/shared/ui/input";
import { MultiSelect } from "@/shared/ui/multi-select";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { PhotoListField } from "@/shared/ui/photo-list-field";
import { RadioGroup } from "@/shared/ui/radio-group";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { toIdSet } from "../model/idSet";
import type { WorkReferences } from "../model/useWorkReferences";
import { countryOptions, useWorkCities } from "../model/workCities";
import {
  monthOptions,
  type WorkFormValues,
  workFormatOptions,
  workMaxLengths,
} from "../model/workFormSchema";
import {
  discountError,
  discountedAmount,
  formatPrice,
  parseWholeNumber,
  priceError,
  workFormCurrency,
} from "../model/workPrice";
import { toCollectionOptions, toTitleOptions } from "../model/workReferences";
import { workSaleStatusOptions } from "../model/workSaleStatus";
import { SectionsField } from "./SectionsField";
import styles from "./WorkFields.module.css";

interface WorkFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo of the saved work, shown while the photo field keeps it; none for a new work. */
  savedPhoto: Photo | null;
  /** The process photos of the saved work, to show that some were removed or moved. */
  savedProcessPhotos: readonly ListPhoto[];
  /** The lists of the gallery to choose from. */
  references: WorkReferences;
}

/** The fields of a work form; they read the form from its context. */
export function WorkFields({
  className,
  isSaving,
  references: { collections, colors, materials, palettes, sections },
  savedPhoto,
  savedProcessPhotos,
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
  // A combobox keeps its value through a controller, as the selects do.
  const { field: countryField } = useController({ control, name: "country" });
  const cityField = register("city");
  const cities = useWorkCities(countryField.value);
  // A checkbox always holds a value, so it is never invalid and needs no ref, as the format.
  const { field: publishedField } = useController({ control, name: "published" });
  const { field: sectionsField } = useController({ control, name: "sectionIds" });
  // A select, so a controller, as for the month.
  const { field: collectionField } = useController({ control, name: "collectionId" });
  const { field: materialsField } = useController({ control, name: "materialIds" });
  const { field: colorsField } = useController({ control, name: "colorIds" });
  const { field: palettesField } = useController({ control, name: "paletteIds" });
  // Radio buttons, as for the format.
  const { field: saleStatusField } = useController({ control, name: "saleStatus" });
  // A discount needs a price, so typing the price checks the discount again.
  const priceField = register("price", { deps: ["discountPercent"] });
  const discountField = register("discountPercent");
  const price = useWatch({ control, name: "price" });
  const discountPercent = useWatch({ control, name: "discountPercent" });
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
        {/* Where the work was made: the country, then the city, as an address reads. */}
        <div className={styles.place}>
          {/* Over two hundred countries, so the list is searched by typing. */}
          <Combobox
            className={styles.country}
            label="Страна"
            placeholder="Начните вводить"
            options={countryOptions}
            disabled={isSaving}
            error={errors.country?.message}
            isModified={Boolean(dirtyFields.country)}
            inputRef={countryField.ref}
            value={countryField.value}
            onBlur={countryField.onBlur}
            onChange={countryField.onChange}
          />
          {/* Suggests the cities of the other works, so one city is not typed two ways. */}
          <Input
            className={styles.city}
            label="Город"
            hint="Необязательно"
            placeholder="Например: Варшава"
            autoComplete="off"
            list={`${headingId}-cities`}
            disabled={isSaving}
            error={errors.city?.message}
            isModified={Boolean(dirtyFields.city)}
            {...cityField}
          />
          <datalist id={`${headingId}-cities`}>
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
      </section>

      <section className={styles.group} aria-labelledby={`${headingId}-place`}>
        <h2 id={`${headingId}-place`} className={styles.heading}>
          Где показывать
        </h2>
        <div>
          <Frame className={styles.published} isModified={Boolean(dirtyFields.published)}>
            <FrameRow>
              <FrameRowLabel htmlFor={`${headingId}-published`}>Показывать на сайте</FrameRowLabel>
              <Checkbox
                className={styles.publishedCheckbox}
                id={`${headingId}-published`}
                aria-describedby={`${headingId}-published-hint`}
                checked={publishedField.value}
                disabled={isSaving}
                onBlur={publishedField.onBlur}
                onChange={publishedField.onChange}
              />
            </FrameRow>
          </Frame>
          <FieldHint id={`${headingId}-published-hint`}>
            Скрытая работа остаётся здесь, её можно показать позже
          </FieldHint>
        </div>
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

      <section className={styles.group} aria-labelledby={`${headingId}-sale`}>
        <h2 id={`${headingId}-sale`} className={styles.heading}>
          Продажа
        </h2>
        <RadioGroup
          label="Статус"
          name={saleStatusField.name}
          options={workSaleStatusOptions}
          value={saleStatusField.value}
          disabled={isSaving}
          isModified={Boolean(dirtyFields.saleStatus)}
          onChange={saleStatusField.onChange}
        />
        <div className={styles.priceBox}>
          <div className={styles.price}>
            <Input
              id={`${headingId}-price`}
              className={styles.amount}
              label="Цена, $"
              hint="Необязательно"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1 500"
              disabled={isSaving}
              error={errors.price?.message}
              isModified={Boolean(dirtyFields.price)}
              {...priceField}
            />
            <Input
              id={`${headingId}-discount`}
              className={styles.discount}
              label="Скидка, %"
              hint="Необязательно"
              inputMode="numeric"
              autoComplete="off"
              placeholder="10"
              disabled={isSaving}
              error={errors.discountPercent?.message}
              isModified={Boolean(dirtyFields.discountPercent)}
              {...discountField}
            />
          </div>
          <FinalPrice
            price={price}
            discountPercent={discountPercent}
            sourceIds={`${headingId}-price ${headingId}-discount`}
          />
        </div>
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

interface FinalPriceProps {
  /** The price as typed. */
  price: string;
  /** The discount as typed. */
  discountPercent: string;
  /** The ids of the price and discount fields, which the result is computed from. */
  sourceIds: string;
}

/**
 * The price after the discount, computed as it is typed, as the server will compute it on save; a
 * dash while the price is empty or wrong.
 */
function FinalPrice({ discountPercent, price, sourceIds }: FinalPriceProps) {
  const isValid =
    price.trim() !== "" &&
    priceError(price) === null &&
    discountError(discountPercent, price) === null;
  const discount = discountPercent.trim() === "" ? null : parseWholeNumber(discountPercent);

  return (
    <div className={styles.final}>
      <span className={styles.finalLabel}>Итоговая цена</span>
      <output htmlFor={sourceIds} className={styles.finalValue}>
        {isValid
          ? formatPrice(discountedAmount(parseWholeNumber(price), discount), workFormCurrency)
          : "—"}
      </output>
    </div>
  );
}
