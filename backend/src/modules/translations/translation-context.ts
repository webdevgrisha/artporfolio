/** What the texts of a resource are, by the start of its name. */
const contexts = {
  "about-photo": "Описание фотографии художника на его сайте",
  "about-process-photos": "Описание фотографий рабочего процесса художника",
  "about-text": "Рассказ художника о себе, биография и творчество",
  "contacts-photo": "Описание фотографии на странице контактов сайта художника",
  "gallery-collection": "Название и описание коллекции картин на сайте художника",
  "gallery-colors": "Название цвета в каталоге картин",
  "gallery-intro": "Вступление к галерее на сайте художника",
  "gallery-materials": "Название материала из списка материалов: чем и на чём написана картина",
  "gallery-palettes": "Название цветовой палитры в каталоге картин",
  "gallery-section": "Название раздела галереи на сайте художника",
  "gallery-work": "Название и описание картины на сайте художника",
  project: "Название и описание художественного проекта на сайте художника",
  "projects-intro": "Вступление к проектам на сайте художника",
};

const anyText = "Текст сайта художника";

/**
 * Tells DeepL what the texts of `resource` are. It translates each text on its own, so a short one,
 * such as a title that is an idiom, is read here against the title and the description beside it.
 */
export function translationContext(resource: string, sources: Record<string, string>): string {
  const found = Object.entries(contexts).find(
    ([name]) => resource === name || resource.startsWith(`${name}-`),
  );
  const { description, title } = sources;

  return [
    found?.[1] ?? anyText,
    title ? `Название: ${title}` : "",
    description ? `Описание: ${description}` : "",
  ]
    .filter((part) => part !== "")
    .join(". ");
}
