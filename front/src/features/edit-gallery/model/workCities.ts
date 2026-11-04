import { useQuery } from "@tanstack/react-query";

import { type GalleryWork, galleryWorksQuery } from "@/entities/gallery";
import { countryCodes, countryName } from "@/shared/lib/countries";

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/** The countries to choose from, by their Russian names, after «Не указана» for none. */
export const countryOptions: readonly { label: string; value: string }[] = [
  { label: "Не указана", value: "" },
  ...countryCodes
    .map((code) => ({ label: countryName(code), value: code }))
    .sort((a, b) => collator.compare(a.label, b.label)),
];

/**
 * The cities the works were made in, each once and alphabetically, so a city is typed alike; only
 * those of the country `country` names, unless it is empty.
 */
export function citiesOf(works: readonly GalleryWork[], country: string): string[] {
  const cities = new Set(
    works
      .filter((work) => work.city !== "" && (country === "" || work.country === country))
      .map(({ city }) => city),
  );

  return [...cities].sort(collator.compare);
}

/**
 * The cities to suggest in a work form. They load beside the form and never hold it back: until
 * the works arrive, or if they fail to, there is nothing to suggest.
 */
export function useWorkCities(country: string): string[] {
  const { data: works = [] } = useQuery(galleryWorksQuery);

  return citiesOf(works, country);
}
