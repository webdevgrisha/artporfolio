# API

Endpoints of the `api` Cloud Function. Update this file in the same commit as the endpoint.

## Conventions

- All paths start with `/api`; bodies are JSON.
- **Session.** `POST /api/auth/login` sets the httpOnly `admin_session` cookie. Endpoints marked *Session* return `401` without a valid admin session.
- **CSRF.** Endpoints marked *CSRF* need the `X-CSRF-Token` header with a token from `GET /api/auth/csrf`, otherwise they return `403`. The token is bound to the session, so request a new one after login.
- **Validation.** An invalid body returns `400`. Unknown fields are rejected.
- **Errors** have one shape:

  ```json
  { "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
  ```

  Unexpected errors are logged and returned as `500 INTERNAL_SERVER_ERROR`.

## Health

### `GET /api/health`

`200 { "status": "ok" }`

## Auth

### `GET /api/auth/csrf`

Issues a CSRF token and sets the matching cookie.

`200 { "csrfToken": string }`

### `POST /api/auth/login`

*CSRF.* Exchanges a Firebase ID token for an admin session.

```json
{ "idToken": "…" }
```

| Status | Result |
| --- | --- |
| `200` | `{ "user": { "email": string \| null, "uid": string } }`, sets the session cookie |
| `401` | Not the admin, or the password was entered more than 5 minutes ago |

### `GET /api/auth/me`

*Session.* `200 { "user": { "email": string | null, "uid": string } }`

### `POST /api/auth/logout`

*CSRF.* Clears the session cookies and revokes the session. Succeeds even without a session.

`204`, no body.

## Contacts

```ts
interface Contacts {
  email: string;
  instagram: string;
  linkedin: string;
  youtube: string;
}
```

An empty string means the contact is not shown on the site.

### `GET /api/contacts`

Public. Returns empty strings until contacts are first saved.

`200 { "contacts": Contacts }`

### `PUT /api/contacts`

*Session, CSRF.* Replaces all contacts. Every field is required.

- Values are trimmed.
- `instagram`, `linkedin`, `youtube`: empty or an `http(s)` URL with a domain.
- `email`: empty or an email address.

`200 { "contacts": Contacts }` with the saved values.
