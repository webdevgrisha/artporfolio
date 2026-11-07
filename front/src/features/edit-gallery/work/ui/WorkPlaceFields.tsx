import React from "react";
import { useController, useFormContext, useFormState } from "react-hook-form";

import { Combobox } from "@/shared/ui/combobox";
import { Input } from "@/shared/ui/input";

import { countryOptions, useWorkCities } from "../model/workCities";
import type { WorkFormValues } from "../model/workFormSchema";
import styles from "./WorkFields.module.css";

interface WorkPlaceFieldsProps {
  isSaving: boolean;
}

/** Where the work was made: the country, then the city, as an address reads. */
export function WorkPlaceFields({ isSaving }: WorkPlaceFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  // A combobox keeps its value through a controller, as the selects do.
  const { field: countryField } = useController({ control, name: "country" });
  const cityField = register("city");
  const cities = useWorkCities(countryField.value);
  const citiesId = React.useId();

  return (
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
  );
}
