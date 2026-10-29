# API

Endpoints of the `api` Cloud Function. Update this file in the same commit as the endpoint.

## Conventions

- All paths start with `/api`; bodies are JSON unless stated otherwise.
- **Session.** `POST /api/auth/login` sets the httpOnly `admin_session` cookie. Endpoints marked *Session* return `401` without a valid admin session.
- **CSRF.** Endpoints marked *CSRF* need the `X-CSRF-Token` header with a token from `GET /api/auth/csrf`, otherwise they return `403`. The token is bound to the session, so request a new one after login.
- **Validation.** A body in a format the endpoint does not take, such as JSON sent to an upload, returns `415`. An invalid body returns `400`. Unknown fields are rejected. A path parameter that names nothing, such as an unknown page, returns `404`.
- **Errors** are Problem Details ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)), sent as
  `application/problem+json`:

  ```json
  {
    "type": "about:blank",
    "title": "Bad Request",
    "status": 400,
    "detail": "Invalid request body",
    "errors": [{ "detail": "Too big: expected string to have <=250 characters", "pointer": "#/alt" }]
  }
  ```

  `type` is always `about:blank`, so `title` is the reason phrase of `status`. `detail` explains
  this occurrence. `errors` lists every invalid value of the body, with a JSON Pointer
  ([RFC 6901](https://www.rfc-editor.org/rfc/rfc6901)) to it; it is present only on `400` for an
  invalid body. Unexpected errors are logged and returned as `500` without `detail`.

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

## Images

Uploaded photos are returned as an `Image`:

```ts
interface ImageSource {
  url: string; // Firebase download URL, cached for a year
  width: number;
}

interface Image {
  fileName: string; // name of the uploaded file
  fileSize: number; // size of the uploaded file, in bytes
  width: number; // size of the largest image
  height: number;
  sources: { avif: ImageSource[]; webp: ImageSource[] }; // ordered by width
  version: string;
}
```

An upload is a JPEG or PNG file of up to 15 MB and 50 megapixels, with a file name of up to 255
characters. WebP and AVIF are rejected: they are already compressed for the web.

The upload is resized without cropping to the widths 640, 960, 1280 and 1920 (never wider than the
original) and encoded as AVIF and WebP. The EXIF orientation is applied and all metadata, including
the location, is removed. The original is kept privately to rebuild the images later.

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
interface Photo extends Image {
  alt: string;
}
```

### `PUT /api/contacts/photo`

*Session, CSRF.* Uploads or replaces the photo. The body is `multipart/form-data`:

| Field | Value |
| --- | --- |
| `file` | An image upload, see [Images](#images) |
| `alt` | Required, 1–250 characters after trimming |

| Status | Result |
| --- | --- |
| `201` | `{ "photo": Photo }`, the first photo was created |
| `200` | `{ "photo": Photo }`, the photo was replaced |
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

## Pages

The pages of the public site that open with a main photo, the hero: `home`, `gallery`, `projects`,
`about`, `contacts`. Any other `:page` returns `404`.

```ts
interface Page {
  hero: Image | null; // null until a hero is uploaded
}
```

The hero is a background under the page title, so it has no alt text.

### `GET /api/pages`

Public. Returns every page.

`200 { "pages": { "home": Page, "gallery": Page, "projects": Page, "about": Page, "contacts": Page } }`

### `PUT /api/pages/:page/hero`

*Session, CSRF.* Uploads or replaces the hero of the page. The body is `multipart/form-data` with
one field, `file`: an image upload, see [Images](#images).

| Status | Result |
| --- | --- |
| `201` | `{ "hero": Image }`, the page had no hero |
| `200` | `{ "hero": Image }`, the hero was replaced |
| `400` | Missing file, another field, unsupported or oversized image, file name too long |
| `404` | Unknown page |
| `413` | File larger than 15 MB |

The previous hero is deleted after the new one is saved.

### `DELETE /api/pages/:page/hero`

*Session, CSRF.* Deletes the hero and its files. Succeeds when the page has no hero.

| Status | Result |
| --- | --- |
| `204` | No body |
| `404` | Unknown page |
