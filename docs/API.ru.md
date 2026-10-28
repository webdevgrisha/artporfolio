# API

Эндпоинты Cloud Function `api`. Обновляйте этот файл в том же коммите, что и эндпоинт.

## Общие правила

- Все пути начинаются с `/api`, тела запросов и ответов — JSON.
- **Сессия.** `POST /api/auth/login` ставит httpOnly-cookie `admin_session`. Эндпоинты с пометкой *Сессия* без действующей сессии администратора возвращают `401`.
- **CSRF.** Эндпоинтам с пометкой *CSRF* нужен заголовок `X-CSRF-Token` с токеном из `GET /api/auth/csrf`, иначе они возвращают `403`. Токен привязан к сессии, поэтому после входа запросите новый.
- **Проверка.** Некорректное тело возвращает `400`. Неизвестные поля отклоняются.
- **Ошибки** имеют один формат:

  ```json
  { "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
  ```

  Непредвиденные ошибки логируются и возвращаются как `500 INTERNAL_SERVER_ERROR`.

## Health

### `GET /api/health`

`200 { "status": "ok" }`

## Авторизация

### `GET /api/auth/csrf`

Выдаёт CSRF-токен и ставит соответствующую cookie.

`200 { "csrfToken": string }`

### `POST /api/auth/login`

*CSRF.* Обменивает Firebase ID token на сессию администратора.

```json
{ "idToken": "…" }
```

| Статус | Результат |
| --- | --- |
| `200` | `{ "user": { "email": string \| null, "uid": string } }`, ставит cookie сессии |
| `401` | Не администратор, или пароль вводили больше 5 минут назад |

### `GET /api/auth/me`

*Сессия.* `200 { "user": { "email": string | null, "uid": string } }`

### `POST /api/auth/logout`

*CSRF.* Удаляет cookies сессии и отзывает сессию. Успешен и без сессии.

`204`, без тела.

## Контакты

```ts
interface Contacts {
  email: string;
  instagram: string;
  linkedin: string;
  youtube: string;
}
```

Пустая строка означает, что контакт на сайте не показывается.

### `GET /api/contacts`

Публичный. Пока контакты ни разу не сохраняли, возвращает пустые строки.

`200 { "contacts": Contacts }`

### `PUT /api/contacts`

*Сессия, CSRF.* Заменяет все контакты целиком. Все поля обязательны.

- Пробелы по краям обрезаются.
- `instagram`, `linkedin`, `youtube`: пусто или `http(s)`-ссылка с доменом.
- `email`: пусто или адрес почты.

`200 { "contacts": Contacts }` с сохранёнными значениями.
