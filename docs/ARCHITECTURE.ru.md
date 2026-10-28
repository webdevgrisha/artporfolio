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
- Остальные файлы: camelCase по имени главного экспорта (`getCurrentUser.ts`).
- Компоненты страниц заканчиваются на `Page` (`GalleryPage`).

### Маршруты и данные

- Пути и заголовки навигации админки заданы один раз в `shared/config/routes.ts`.
- `app/router.tsx` сопоставляет пути со страницами, которые загружаются лениво.
- Данные загружаются и меняются через loader и action React Router, а не через эффекты:
  - маршрут лейаута админки использует `requireSession` (`entities/user`), который перенаправляет гостя на `/admin/login?redirectTo=…`;
  - внутри админки `useSessionUser()` возвращает текущего пользователя;
  - у страницы входа свои loader и action в `pages/login/model/loginRoute.ts`;
  - выход — это `<Form method="post">` на action `/admin/logout` (`features/logout`).
- `PageLoading` — это `HydrateFallback`, который виден, пока выполняются первые loader.

### Соглашения React

- Встроенные хуки и API вызываются через пространство имён: `React.useState`, `React.useEffect`, `React.useId`. Именованные импорты из `react` — только для типов.
- Пропсы описываются интерфейсом `interface ComponentNameProps`. `ref` — обычный проп (React 19).
- Статические визуальные значения живут в CSS; React передаёт только данные времени выполнения, например `--active-index`.
- Доступные имена и семантика — часть контракта компонента: у кнопок есть подписи, декоративные элементы скрыты от вспомогательных технологий.

## Бэкенд

```text
backend/src/
├── firebase.ts     точка входа Cloud Function
├── server.ts       приложение Express: middleware и роутеры
├── config/         env, cookies, cors, csrf
├── routes/         по роутеру на домен
├── middleware/     auth, csrf, validation, upload, error
├── controllers/    обработчики запросов, по файлу на домен
├── services/       бизнес-логика (auth, contacts, contactPhoto), обработка изображений и доступ к Firebase
├── schemas/        zod-схемы запросов
├── errors/         HttpError и его подклассы
├── http/           работа с cookies
├── types/          глобальные объявления типов (Express Locals)
├── database/       зарезервировано под доступ к данным
├── models/         зарезервировано под модели данных
└── utils/          зарезервировано под общие утилиты
```

- Запрос проходит путь: маршрут → middleware → контроллер → сервис.
- В каждом слое по файлу на домен (`routes/auth.ts`, `controllers/auth.ts`). Файлов-реэкспортов нет.
- Модули импортируют друг друга через subpath imports: `#services/auth`.
- Express 5 сам передаёт отклонённые промисы в middleware ошибок, поэтому обработчики не оборачивают код в `try/catch` только ради `next(error)`.
- Переменные окружения читаются через `getEnv()` из `config/env.ts` и проверяются один раз при первом обращении. `CSRF_SECRET` хранится в Secret Manager и читается конфигом CSRF.
- Ошибки для клиента выбрасываются как подклассы `HttpError`. Всё остальное логируется и возвращается как общий ответ 500.
- Эндпоинты описаны в [API.ru.md](API.ru.md) и обновляются в том же коммите, что и эндпоинт.

## Тесты

- Тесты бэкенда лежат в `backend/tests`, повторяя структуру `src`, и запускаются Vitest. Их окружение задано в `backend/vitest.config.ts`.
- У фронтенда пока нет автоматических тестов.

## Как добавить страницу админки

1. Добавьте путь в `routes` и заголовок в `adminNavigation` в `shared/config/routes.ts`.
2. Создайте `pages/<name>/ui/<Name>Page.tsx` и `pages/<name>/index.ts`.
3. Зарегистрируйте маршрут в `app/router.tsx` с ленивым импортом `@/pages/<name>`.
4. Загрузку данных положите в loader в сегменте `model` страницы. Переиспользуемые действия — в `features`, модели данных и запросы — в `entities`.
