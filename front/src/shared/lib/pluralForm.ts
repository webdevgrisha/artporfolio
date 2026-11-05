const pluralRules = new Intl.PluralRules("ru");

/** The word for `count` among three forms, as in «1 работа», «2 работы», «5 работ». */
export function pluralForm(count: number, one: string, few: string, many: string): string {
  const plural = pluralRules.select(count);

  return plural === "one" ? one : plural === "few" ? few : many;
}
