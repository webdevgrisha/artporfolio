/** What the texts of a resource are, by the start of its name. */
const contexts = {
  "about-photo": "Описание фотографии художника на его сайте",
  "about-process-photos": "Описание фотографий рабочего процесса художника",
  "about-text": "Рассказ художника о себе, биография и творчество",
  "contacts-photo": "Описание фотографии на странице контактов сайта художника",
  "gallery-collection": "Название и описание коллекции картин на сайте художника",
  "gallery-colors": "Название цвета в каталоге картин",
  "gallery-intro": "Вступление к галерее на сайте художника",
  "gallery-materials": "Название художественного материала в каталоге картин",
  "gallery-palettes": "Название цветовой палитры в каталоге картин",
  "gallery-section": "Название раздела галереи на сайте художника",
  "gallery-work": "Название и описание картины на сайте художника",
  project: "Название и описание художественного проекта на сайте художника",
  "projects-intro": "Вступление к проектам на сайте художника",
};

const anyText = "Текст сайта художника";

/** Tells DeepL what the texts of `resource` are; a short title reads differently in each place. */
export function translationContext(resource: string): string {
  const found = Object.entries(contexts).find(
    ([name]) => resource === name || resource.startsWith(`${name}-`),
  );

  return found?.[1] ?? anyText;
}
