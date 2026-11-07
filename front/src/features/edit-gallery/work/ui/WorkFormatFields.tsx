import React from "react";
import { useController, useFormContext, useFormState } from "react-hook-form";

import { maxWorkSetSize, minWorkSetSize, monthOptions } from "@/entities/gallery";
import { Combobox } from "@/shared/ui/combobox";
import { Input } from "@/shared/ui/input";
import { RadioGroup } from "@/shared/ui/radio-group";
import { Select } from "@/shared/ui/select";

import { countryOptions, useWorkCities } from "../model/workCities";
import { workFormatOptions } from "../model/workFormat";
import type { WorkFormValues } from "../model/workFormSchema";
import styles from "./WorkFields.module.css";

interface WorkFormatFieldsProps {
  isSaving: boolean;
}

/** What the work is made up of, its size, and when and where it was made. */
export function WorkFormatFields({ isSaving }: WorkFormatFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  // Radio buttons always hold a choice, so the format is never invalid and needs no ref. Only a set
  // needs a count, so choosing the format checks the count again.
  const { field: formatField } = useController({
    control,
    name: "format",
    rules: { deps: ["partCount"] },
  });
  const partCountField = register("partCount");
  const widthField = register("width");
  const heightField = register("height");
  // A select has no input for react-hook-form to register, so a controller keeps its value.
  const { field: monthField } = useController({ control, name: "month" });
  // A month of this year may be still to come, so typing the year checks the month again.
  const yearField = register("year", { deps: ["month"] });
  // A combobox keeps its value through a controller, as the selects do.
  const { field: countryField } = useController({ control, name: "country" });
  const cityField = register("city");
  const cities = useWorkCities(countryField.value);
  const citiesId = React.useId();
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

  return (
    <>
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
          list={citiesId}
          disabled={isSaving}
          error={errors.city?.message}
          isModified={Boolean(dirtyFields.city)}
          {...cityField}
        />
        <datalist id={citiesId}>
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </div>
    </>
  );
}
