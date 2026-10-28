# API

Endpoints of the `api` Cloud Function. Update this file in the same commit as the endpoint.

## Conventions

- All paths start with `/api`; bodies are JSON unless stated otherwise.
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

Public. Returns empty strings until contacts are first saved, and `photo: null` until a photo is
uploaded.

`200 { "contacts": Contacts, "photo": Photo | null }`

### `PUT /api/contacts`

*Session, CSRF.* Replaces all contacts. Every field is required.

- Values are trimmed.
- `instagram`, `linkedin`, `youtube`: empty or an `http(s)` URL with a domain.
- `email`: empty or an email address.

`200 { "contacts": Contacts }` with the saved values.

## Contact photo

```ts
interface ImageSource {
  url: string; // Firebase download URL, cached for a year
  width: number;
}

interface Photo {
  alt: string;
  fileName: string; // name of the uploaded file
  fileSize: number; // size of the uploaded file, in bytes
  width: number; // size of the largest image
  height: number;
  sources: { avif: ImageSource[]; webp: ImageSource[] }; // ordered by width
  version: string;
}
```

The upload is resized without cropping to the widths 640, 960, 1280 and 1920 (never wider than the
original) and encoded as AVIF and WebP. The EXIF orientation is applied and all metadata, including
the location, is removed. The original is kept privately to rebuild the images later.

### `PUT /api/contacts/photo`

*Session, CSRF.* Uploads or replaces the photo. The body is `multipart/form-data`:

| Field | Value |
| --- | --- |
| `file` | JPEG or PNG, up to 15 MB and 50 megapixels, file name up to 255 characters. WebP and AVIF are rejected: they are already compressed for the web |
| `alt` | Required, 1–250 characters after trimming |

| Status | Result |
| --- | --- |
| `200` | `{ "photo": Photo }` |
| `400` | Missing file or alt, unsupported or oversized image, file name too long |
| `413` | File larger than 15 MB |

The previous photo is deleted after the new one is saved.

### `PATCH /api/contacts/photo`

*Session, CSRF.* Changes the alt text without uploading the photo again.

```json
{ "alt": "…" }
```

| Status | Result |
| --- | --- |
| `200` | `{ "photo": Photo }` |
| `404` | There is no photo |

### `DELETE /api/contacts/photo`

*Session, CSRF.* Deletes the photo and its files. Succeeds when there is no photo.

`204`, no body.
