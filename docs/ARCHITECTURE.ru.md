# Архитектура

Как устроен проект и каким соглашениям следует каждое изменение. Правила CSS — в [STYLE_GUIDE.ru.md](STYLE_GUIDE.ru.md).

## Обзор

Монорепозиторий pnpm из двух пакетов, развёрнутых в Firebase:

| Пакет | Стек | Где работает |
| --- | --- | --- |
| `front` | React 19, React Router (data mode), Vite, CSS Modules, zod | Firebase Hosting |
| `backend` | Express 5, Firebase Admin, zod | Cloud Functions (`api`, europe-west1) |

Firebase Hosting отдаёт фронтенд и перенаправляет `/api/**` в функцию `api`, поэтому браузер работает с одним источником (origin).

## Фронтенд: Feature-Sliced Design

`front/src` построен по [Feature-Sliced Design](https://feature-sliced.design). Код разделён на **слои**; слой может импортировать только из слоёв **ниже** себя.

| Слой | Что содержит | Пример |
| --- | --- | --- |
| `app` | Точка входа, роутер, глобальные стили | `app/router.tsx` |
| `pages` | По слайсу на маршрут; собирает виджеты и фичи | `pages/login` |
| `widgets` | Крупные самостоятельные блоки интерфейса | `widgets/admin-layout` |
| `features` | По одному действию пользователя | `features/login`, `features/logout` |
| `entities` | Бизнес-сущности: модель данных, запросы, UI только для чтения | `entities/user` |
| `shared` | Код без знания о предметной области | `shared/ui/button`, `shared/api/http` |

### Слайсы и сегменты

Каждый слой, кроме `app` и `shared`, состоит из **слайсов**, названных по бизнес-понятию в kebab-case. Внутри слайса код сгруппирован по **сегментам**:

| Сегмент | Назначение |
| --- | --- |
| `ui` | Компоненты и их CSS Modules |
| `model` | Состояние, хуки, loader и action маршрутов, схемы |
| `api` | Запросы к бэкенду или Firebase |
| `lib` | Чистые вспомогательные функции |

```text
features/login/
├── api/        createSession, signInWithFirebase
├── lib/        getLoginErrorMessage
├── model/      login, loginSchema
├── ui/         LoginForm.tsx, LoginForm.module.css
└── index.ts    публичный API
```

### Правила импортов

Проверяются Biome (`noRestrictedImports` в `biome.json`):

- Слайс импортируется только через свой публичный `index.ts`: `@/features/login`, а не `@/features/login/model/login`.
- Слой импортирует только из нижних слоёв: `features` может использовать `entities` и `shared`, но не `widgets` и не `pages`.
- `app` не импортирует никто.
- Внутри одного слайса импорты относительные (`../model/login`). Между слайсами и слоями — через алиас `@/`.
- Слайсы одного слоя не импортируют друг друга. Общее опускается на слой ниже (`getCsrfToken` нужен и входу, и выходу, поэтому лежит в `shared/api`).

В `shared` слайсов нет. У каждого компонента `shared/ui` свой публичный `index.ts` (`@/shared/ui/button`). `shared/api`, `shared/config` и `shared/lib` импортируются по файлам (`@/shared/api/http`) намеренно: общий index заставил бы каждый чанк, которому нужен HTTP-клиент, загружать ещё и Firebase.

### Именование

- Папки слайсов и компонентов `shared/ui`: kebab-case (`admin-layout`, `password-input`).
- Файлы компонентов: PascalCase, один компонент на файл, CSS Module рядом (`LoginForm.tsx`, `LoginForm.module.css`).
- Остальные файлы: camelCase, по смыслу содержимого (`getCurrentUser.ts`, `toast.ts`, `contactsRoute.ts`).
- Компоненты страниц заканчиваются на `Page` (`GalleryPage`).

### Маршруты и данные

- Пути и заголовки навигации админки заданы один раз в `shared/config/routes.ts`.
- `app/router.tsx` сопоставляет пути со страницами, которые загружаются лениво.
- Данные загружаются через loader React Router, а не через эффекты. Action используется только для изменения, после которого открывается другая страница:
  - маршрут лейаута админки использует `requireSession` (`entities/user`), который перенаправляет гостя на `/admin/login?redirectTo=…`;
  - внутри админки `useSessionUser()` возвращает текущего пользователя;
  - у страницы входа свои loader и action в `pages/login/model/loginRoute.ts`;
  - выход — это `<Form method="post">` на action `/admin/logout` (`features/logout`);
  - страница редактирования читает данные в loader (`pages/contacts/model/contactsRoute.ts`) и передаёт их форме. Форма остаётся на странице, поэтому сохраняет в обработчике отправки react-hook-form (`EditContactsForm`): отправляет изменения, перезагружает данные маршрута через `useRevalidator`, сбрасывает сохранённые поля и показывает результат. Пока идёт сохранение, `isSubmitting` блокирует форму.
- `PageLoading` — это `HydrateFallback`, который виден, пока выполняются первые loader.
- Страницы админки вложены в маршрут без пути, у которого `ErrorBoundary` — `AdminPageError` (`widgets/admin-layout`): страница, которая не загрузилась или упала при рендере, заменяется сообщением внутри лейаута, а навигация продолжает работать.

### Формы и обратная связь

- Формы построены на react-hook-form со схемой zod, которая повторяет правила сервера. Текстовые поля, такие как `Input`, построены на `Field` (`shared/ui`), который отвечает за подпись, подсказку (`hint`), ошибку и рамку; изменённые поля подсвечиваются пропом `isModified`.
- Форма из нескольких разделов использует `Tabs` (`shared/ui`) внутри одного `<form>` с одной кнопкой сохранения. Скрытые панели остаются смонтированными, поэтому их поля сохраняют значения. Форма задаёт `shouldFocusError: false` и при отправке с ошибками сначала открывает вкладку первого неверного поля, потом ставит на него фокус.
- Файлы выбираются через `MediaPicker` (`shared/ui`). Он проверяет тип и размер и показывает миниатюры, которые открываются в `PreviewDialog`, но ничего не загружает: форма хранит выбранный `File` и отправляет его при сохранении, поэтому на него тоже действуют отмена изменений и защита от ухода со страницы. Правила загрузки (`imageUploadRules`) и изображение, которое возвращает API (`imageSchema`), лежат в `shared/api/image`; `imageToMediaItem` показывает сохранённое изображение в выборе файлов.
- Сохранение, которое обращается к нескольким эндпоинтам, отправляет только изменённые части и сохраняет их независимо (`saveContacts`). Форма сбрасывает только поля сохранённых частей, поэтому часть, которая не сохранилась, сохраняет изменения. Несколько фото загружаются по одному (`savePageHeroes`), потому что сервер кодирует каждое.
- Форма редактирования заканчивается `FormActions` (`shared/ui`): кнопка сохранения и, пока есть несохранённые изменения, кнопка отмены. Ещё она выводит `UnsavedChangesDialog` (`shared/ui`): он не даёт уйти с несохранёнными изменениями через `useUnsavedChangesGuard` (`shared/lib`) и спрашивает через `ConfirmDialog`. React Router допускает только один блокировщик одновременно, поэтому на странице одна защищённая форма.
- Результат действия показывается через `showSuccessToast` или `showErrorToast` (`shared/ui/toast`). Ошибки висят, пока их не закроют. У уведомлений одного действия общий `id`, поэтому новый результат заменяет предыдущий.
- Тексты ошибок запросов берутся из `getRequestErrorMessage` (`shared/api`): он покрывает отсутствие соединения и ошибки сервера, а фича сначала обрабатывает свои случаи, как `getSaveContactsErrorMessage` и `getSavePhotoErrorMessage`. Сохранение, отклонённое из-за истёкшей сессии (`isSessionExpiredError`), показывает `sessionExpiredMessage`.
- Кнопка только с иконкой — это `IconButton` с `label`, обёрнутая в `Tooltip` с тем же текстом.

### Соглашения React

- Встроенные хуки и API вызываются через пространство имён: `React.useState`, `React.useEffect`, `React.useId`. Именованные импорты из `react` — только для типов.
- Пропсы описываются интерфейсом `interface ComponentNameProps`. `ref` — обычный проп (React 19).
- Статические визуальные значения живут в CSS; React передаёт только данные времени выполнения, например `--active-index`.
- Доступные имена и семантика — часть контракта компонента: у кнопок есть подписи, декоративные элементы скрыты от вспомогательных технологий.

## Бэкенд

Бэкенд разбит на **предметные модули**, как рекомендует [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices#1-project-architecture-practices): всё, что относится к одной сущности, лежит в одной папке. Код, который ничего не знает о предметной области, лежит в `shared/`.

```text
backend/src/
├── firebase.ts         точка входа Cloud Function
├── server.ts           приложение Express: общие middleware и роутеры модулей верхнего уровня
├── modules/            по папке на сущность
│   ├── about/          тексты страницы «О себе»; document.ts — документ Firestore, общий с вложенными
│   │   ├── photo/      «Моё фото», подключается роутером about
│   │   └── process-photos/  фото процесса в заданном порядке, подключается роутером about
│   ├── auth/           routes, controller, service, schema, middleware (requireAuth)
│   ├── contacts/       ссылки для связи; document.ts — документ Firestore, общий с photo/
│   │   └── photo/      фото для контактов, подключается роутером contacts
│   ├── health/
│   └── pages/          страницы публичного сайта и их главные фото (hero)
└── shared/             без знания о предметной области
    ├── config/         env, cookies, cors, csrf
    ├── firebase/       клиенты Firebase Admin: app, auth, firestore, storage
    ├── http/           HttpError, работа с cookies, типы запроса Express
    ├── images/         обработка изображений через sharp, файлы изображений в Cloud Storage, места для фото
    ├── middleware/     csrf, content-type, validation, upload, error
    └── openapi/        общие части описания API: ответы с ошибками, безопасность, загрузки

backend/openapi/
├── document.ts         собирает документ OpenAPI из путей модулей
├── generate.ts         `pnpm openapi`: записывает openapi.yaml
├── openapi.yaml        сгенерированное описание API, хранится в репозитории
└── redocly.yaml        правила линтера для `pnpm openapi:lint`
```

- В модуле по файлу на роль: `routes.ts`, `controller.ts`, `service.ts`, `schema.ts`, `openapi.ts`. Запрос проходит путь: маршрут → middleware → контроллер → сервис.
- `shared/` никогда не импортирует `modules/`, это проверяет Biome. Модуль может использовать другой модуль, как `contacts` использует `requireAuth` из `auth`.
- `server.ts` подключает только модули верхнего уровня. Вложенный модуль подключает роутер родителя, как `contacts` подключает `photo`.
- Одиночное фото с alt (фото контактов, «Моё фото») — это `PhotoSlot` из `shared/images/photo.ts`: документ Firestore, поле и папка в Storage. Сервис модуля только называет своё место; сохранение, замена, alt и удаление общие.
- Файлы фото сохраняются раньше записи в Firestore, а заменённые файлы удаляются последними, поэтому сайт никогда не ссылается на отсутствующие файлы. Каждое изменение, которое читает и пишет документ, выполняется в транзакции.
- Глобальные типы Express лежат у своего владельца: `modules/auth/express.d.ts` объявляет `Locals.auth`, `shared/http/express.d.ts` — `Request.file` и `rawBody`.
- Код импортируется через subpath imports (`#modules/auth/service`, `#shared/http/errors`). Файлов-реэкспортов нет.
- Express 5 сам передаёт отклонённые промисы в middleware ошибок, поэтому обработчики не оборачивают код в `try/catch` только ради `next(error)`.
- Переменные окружения читаются через `getEnv()` из `shared/config/env.ts` и проверяются один раз при первом обращении. `CSRF_SECRET` хранится в Secret Manager и читается конфигом CSRF.
- Ошибки для клиента выбрасываются как подклассы `HttpError`; middleware ошибок отправляет любую ошибку в формате Problem Details из RFC 9457. Всё остальное логируется и возвращается как общий ответ 500.
- API описан в OpenAPI 3.1 в [backend/openapi/openapi.yaml](../backend/openapi/openapi.yaml) (на английском) и генерируется из кода (code-first). Схемы Zod в `schema.ts` проверяют запросы и описывают ответы; контроллеры типизированы схемами ответов (`RequestHandler<Params, Response, Body>`). `openapi.ts` модуля перечисляет его пути с этими схемами, всеми кодами ответов и требованиями безопасности; схема, которая становится переиспользуемым компонентом, получает `.meta({ id })`.
- После изменения API запустите `pnpm openapi` и закоммитьте `openapi.yaml` в том же коммите. Тест падает, если файл устарел, а `pnpm check` проверяет его линтером Redocly. `pnpm openapi:docs` собирает страницу для чтения `openapi/docs.html`; она не хранится в репозитории и не раздаётся сервером.

## Тесты

- Тесты бэкенда лежат в `backend/tests`, повторяя структуру `src` (`tests/modules/contacts/photo/service.test.ts` тестирует `src/modules/contacts/photo/service.ts`), и запускаются Vitest. Их окружение задано в `backend/vitest.config.ts`.
- В `tests/support` лежат общие помощники: `startTestServer` запускает приложение Express на свободном порту, `adminHeaders` возвращает cookies и CSRF-заголовок вошедшего администратора, `apiImage` возвращает полное изображение для замоканных сервисов. Импортируйте их относительным путём с окончанием `.js`.
- `startTestServer` сверяет каждый ответ операции из `openapi.yaml` со спецификацией: код ответа должен быть описан, `Content-Type` должен совпадать, а тело должно проходить схему. Нарушение роняет тест, который его вызвал, поэтому фикстуры тестов маршрутов должны быть полными.
- У фронтенда пока нет автоматических тестов.

## Как добавить страницу админки

1. Добавьте путь в `routes` и заголовок в `adminNavigation` в `shared/config/routes.ts`.
2. Создайте `pages/<name>/ui/<Name>Page.tsx` и `pages/<name>/index.ts`.
3. Зарегистрируйте маршрут в `app/router.tsx` с ленивым импортом `@/pages/<name>`.
4. Загрузку данных положите в loader, а сохранение — в action в сегменте `model` страницы. Переиспользуемые действия — в `features`, модели данных и запросы — в `entities`.
