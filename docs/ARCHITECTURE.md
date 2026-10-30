# Architecture

How the project is organized and the conventions every change follows. CSS rules live in [STYLE_GUIDE.md](STYLE_GUIDE.md).

## Overview

A pnpm monorepo with two packages, deployed to Firebase:

| Package | Stack | Runs on |
| --- | --- | --- |
| `front` | React 19, React Router (data mode), TanStack Query, react-hook-form, Vite, CSS Modules, zod | Firebase Hosting |
| `backend` | Express 5, Firebase Admin, zod | Cloud Functions (`api`, europe-west1) |

Firebase Hosting serves the frontend and rewrites `/api/**` to the `api` function, so the browser talks to one origin.

## Frontend: Feature-Sliced Design

`front/src` follows [Feature-Sliced Design](https://feature-sliced.design). Code is split into **layers**; a layer may import only from layers **below** it.

| Layer | Contains | Example |
| --- | --- | --- |
| `app` | Entry point, router, global styles | `app/router.tsx` |
| `pages` | One slice per route; composes widgets and features | `pages/login` |
| `widgets` | Large self-contained UI blocks | `widgets/admin-layout` |
| `features` | One user action each | `features/login`, `features/logout` |
| `entities` | Business entities: data model, requests, read-only UI | `entities/user` |
| `shared` | Code with no business knowledge | `shared/ui/button`, `shared/api/http` |

### Slices and segments

Every layer except `app` and `shared` consists of **slices** named after a business concept in kebab-case. Inside a slice, code is grouped by **segment**:

| Segment | Purpose |
| --- | --- |
| `ui` | Components and their CSS Modules |
| `model` | State, hooks, route loaders and actions, schemas |
| `api` | Requests to the backend or Firebase |
| `lib` | Pure helpers |

```text
features/login/
├── api/        createSession, signInWithFirebase
├── lib/        getLoginErrorMessage
├── model/      login, loginSchema
├── ui/         LoginForm.tsx, LoginForm.module.css
└── index.ts    public API
```

### Import rules

Enforced by Biome (`noRestrictedImports` in `biome.json`):

- A slice is imported only through its public `index.ts`: `@/features/login`, never `@/features/login/model/login`.
- A layer imports only from lower layers: `features` may use `entities` and `shared`, never `widgets` or `pages`.
- Nothing imports `app`.
- Inside one slice, use relative imports (`../model/login`). Across slices and layers, use the `@/` alias.
- Slices of the same layer do not import each other. Shared needs move down a layer (`isSessionExpiredError` is used by several features, so it lives in `shared/api`).

`shared` has no slices. `shared/ui` exposes one public `index.ts` per component (`@/shared/ui/button`). `shared/api`, `shared/config` and `shared/lib` are imported file by file (`@/shared/api/http`) on purpose: a common index would make every chunk that needs the HTTP client also load Firebase.

### Naming

- Folders of slices and of `shared/ui` components: kebab-case (`admin-layout`, `password-input`).
- Component files: PascalCase, one component per file, CSS Module beside it (`LoginForm.tsx`, `LoginForm.module.css`).
- Other files: camelCase, named after what they contain (`getCurrentUser.ts`, `toast.ts`, `contactsRoute.ts`).
- Page components end with `Page` (`GalleryPage`).

### Routing and data

- Paths and admin navigation titles are defined once in `shared/config/routes.ts`.
- `app/router.tsx` maps paths to lazily loaded pages.
- Data is loaded through React Router loaders, not effects. An action is used only for a change that leads to another page:
  - the admin layout route uses `requireSession` (`entities/user`) on every navigation; on 401 it redirects to `/admin/login?redirectTo=…`, and that redirect wins over a failed page loader. Any other failure is an error, not a reason to sign in again;
  - inside the admin area, `useSessionUser()` returns the signed-in user;
  - the login page has its own loader and action in `pages/login/model/loginRoute.ts`;
  - logout is a `<Form method="post">` to the `/admin/logout` action (`features/logout`). When the session may still be there (no connection, a refused request), the action shows an error toast and returns to the page the form was sent from. After a server error it asks `/auth/me` first: the server may have cleared the cookie and failed only to revoke the session, or a proxy may have answered before the server was reached;
  - server data lives in the TanStack Query cache (`queryClient` in `shared/api/queryClient.ts`). An entity exposes each request as query options (`contactsQuery` in `entities/contacts`). Nothing refetches in the background: the admin is the only one who changes the data;
  - an edit page loads its data afresh on entering it: its loader calls `queryClient.fetchQuery` (`pages/contacts/model/contactsRoute.ts`), and the page reads it with `useSuspenseQuery` and passes it to the form;
  - the form stays on the page, so it saves in its react-hook-form submit handler (`EditContactLinksForm`) through a mutation hook (`useSaveContactLinks`). The mutation sends the changes and invalidates the page's query after every save, a failed one included, since a failed request may still have changed the server; then the form resets to the saved values and shows the result. `isSubmitting` disables the form meanwhile;
  - logout clears the query cache.
- Every change carries the CSRF token without its caller knowing: `http` (`shared/api/http.ts`) asks `GET /api/auth/csrf` for it with the first change and reuses it. A 403 means the session changed, for example after signing in again in another tab: `http` asks for the new token and sends the change once more. Login goes without a token (`withCsrfToken: false`); logout forgets it.
- `PageLoading` is the `HydrateFallback` shown while the first loaders run.
- A pathless root route catches every error that no route below handles with `ErrorPage` (`pages/error`), imported eagerly so it works when a chunk fails to load.
- Admin pages are nested in a pathless route whose `ErrorBoundary` is `AdminPageError` (`widgets/admin-layout`): a page that fails to load or render is replaced inside the layout, and the navigation stays usable.

### Forms and feedback

- Forms use react-hook-form with a zod schema that mirrors the server rules. Text controls (`Input`, `Textarea`) are built on `Field` (`shared/ui`), which owns the label, the `hint`, the error and the frame; modified fields are highlighted with `isModified`.
- A form edits one resource of the API and saves all of its changes or none of them. A page with several resources gives each its own section: a child route with its own URL and form (`pages/about`: `/admin/about/text`, `/photo`, `/process`). The page is the layout route: its loader fetches the data once, and `TabNav` (`shared/ui`) links the sections, drawn as tabs. Switching sections is a navigation, so unsaved changes are always in the open section, and leaving it asks first, as leaving any page does.
- Files are picked with `MediaPicker` (`shared/ui`), one file at a time. It checks the type and size against the rules it gets (`rules={imageUploadRules}`) and shows thumbnails that open in `PreviewDialog`, but it uploads nothing: in a form the picked `File` is kept and sent on save, so revert and the unsaved-changes guard cover it too; a field saved on its own uploads it at once and shows `isBusy` meanwhile. The upload rules (`imageUploadRules`) and the image the API returns (`imageSchema`) live in `shared/api/image`. One stored image in a form, such as the photo with alt text, uses `ImagePicker` (`shared/ui`): its value is `ImageFieldValue` (`shared/lib/imageFieldValue`), the saved image (`savedImage`), a picked `File` or `null`.
- A single photo with alt text (the contacts photo, «Моё фото») mirrors `PhotoSlot` of the backend: `photoSchema` in `shared/api/photo`, the form fields in `shared/lib/photoForm` (`photoFieldsShape` with `refinePhotoAlt` in the schema, `getPhotoChange`, `toPhotoFormValues`), and `PhotoFields` (`shared/ui`), which reads `photo` and `photoAlt` from the form context. `EditPhotoForm` (`shared/ui`) is the whole form; a feature gives it the photo and its save function (`EditContactPhotoForm`). The entity only names its requests.
- An ordered list of files with fields per file uses `SortableMediaList` (`shared/ui`), the About process photos for example. Rows are moved by dragging their handle (dnd-kit) or with the arrow buttons, so the order can be changed without dragging (WCAG 2.5.7); a single row cannot be moved. Each row can be replaced or removed and shows the fields its owner renders. The form keeps the rows in `useFieldArray`, with the field `id` as the row key, and compares them with the server by value (`getProcessPhotosChanges`). `MediaPicker` and `SortableMediaList` are built from the same parts: `MediaFieldset` and `FileInput` (`shared/ui/media-field`), `MediaThumbnailButton`, `MediaFileName` and `MediaPreviewDialog` (`shared/ui/media-preview`), and the file checks (`getFileRejection`, `useFileDrop` in `shared/lib`).
- Things that do not belong together are saved on their own, without a form: each page hero (`PageHeroCard` in `features/edit-page-heroes`) is uploaded as soon as a file is picked and deleted once `ConfirmDialog` confirms it. Its mutations put the hero the server answered with into the loaded pages (`setQueryData`) and load them again only after a failure.
- One form saves several requests at once. The process photo list sends them one by one (`saveProcessPhotos`): the deletions first, then each changed row, then the order once the server has every photo. It stops at the first failed request, whose `SaveProcessPhotoError` names the photo for the toast; each row saved before it is marked as saved in the form at once, so a repeated save sends only the rest. The saved value is the reloaded page data, limited to the photos the form has shown or saved: a request whose response was lost may still have changed the server, and a photo added in another tab is not in the rows and must not look deleted.
- An edit form is an `EditForm` (`shared/ui`): the fields, then `FormActions` with the save button and, while there are unsaved changes, the revert button. It reports its unsaved changes with `useReportUnsavedChanges` to `UnsavedChangesProvider` (`shared/ui/unsaved-changes`), which the admin layout renders once around the pages: React Router allows one blocker at a time. While any form of the page has unsaved changes, leaving it asks first (`useUnsavedChangesGuard` in `shared/lib`, `ConfirmDialog`).
- A change shows its result through the query client: its `useMutation` declares `meta.feedback` (`MutationFeedback` in `shared/api/queryClient`: `getErrorMessage`, `toastId`, optionally `successMessage`, «Изменения сохранены» by default), and the app shows the error or the success toast (`shared/ui/toast`): `showMutationFeedback` (`app/mutationFeedback.ts`) subscribes to the mutation cache once, so the data layer knows nothing about the UI. A form only resets its fields after a save and keeps them after a failure; a save with nothing to send shows the success toast itself with the same `toastId`. Errors stay until closed. Toasts of one action share an `id`, so a new result replaces the previous one.
- Where feedback goes: a client check (an empty required field, the type or size of a file) is shown under its field; a failed request (the server, the connection, an expired session) and a successful change are shown in a toast; a page that fails to load is replaced by its error screen; a failed sign-in is shown in the login form. An error toast names what was not saved, such as the page whose hero failed.
- Request error texts live in `shared/api/requestErrorMessages`. A change, such as a save or a deletion, gets its text from `getSaveErrorMessage`: an expired session (`isSessionExpiredError`) shows `sessionExpiredMessage`, then the change's own texts by status apply (`byStatus`, as `getSaveContactLinksErrorMessage` gives them), then no connection and server errors, then its `fallback`. The photo with alt text has `getSavePhotoErrorMessage` (`shared/api/photo`). A failed load and other requests use `getRequestErrorMessage`, which covers only no connection and server errors. The errors of several parts are joined with `joinMessages` (`shared/lib`).
- An icon-only button is an `IconButton` with a `label`, wrapped in a `Tooltip` with the same text.

### React conventions

- Built-in hooks and APIs are called through the namespace: `React.useState`, `React.useEffect`, `React.useId`. Named imports from `react` are for types only.
- Props are described by an `interface ComponentNameProps`. `ref` is a regular prop (React 19).
- Static visual values belong in CSS; React passes only runtime data, such as `--active-index`.
- Accessible names and semantics are part of a component's contract: buttons have labels, decorative elements are hidden from assistive technology.

## Backend

The backend is split by **domain modules**, as recommended by [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices#1-project-architecture-practices): everything about one domain lives in one folder. Code that knows nothing about the domain lives in `shared/`.

```text
backend/src/
├── firebase.ts         Cloud Function entry point
├── server.ts           Express app: global middleware and top-level module routers
├── modules/            one folder per domain
│   ├── about/          the About page texts; document.ts is the Firestore document shared below
│   │   ├── photo/      «My photo», mounted by the about router
│   │   └── process-photos/  the ordered process photos, mounted by the about router
│   ├── auth/           routes, controller, service, schema, middleware (requireAuth)
│   ├── contacts/       contact links; document.ts is the Firestore document shared with photo/
│   │   └── photo/      the contact photo, mounted by the contacts router
│   ├── health/
│   └── pages/          the pages of the public site and their main photos (heroes)
└── shared/             no knowledge of the domain
    ├── config/         env, cookies, cors
    ├── firebase/       Firebase Admin clients: app, auth, firestore, storage
    ├── http/           HttpError, cookie helpers, Express request typing
    ├── images/         image processing with sharp, image files in Cloud Storage, photo slots
    └── middleware/     csrf, content-type, validation, upload, error
```

- A module has one file per role: `routes.ts`, `controller.ts`, `service.ts`, `schema.ts`. The request flow is route → middleware → controller → service.
- `shared/` never imports `modules/`; Biome enforces it. A module may use another module, as `contacts` uses `requireAuth` from `auth`.
- `server.ts` mounts only top-level modules. A submodule is mounted by its parent's router, as `contacts` mounts `photo`.
- A single photo with alt text (the contact photo, «My photo») is a `PhotoSlot` from `shared/images/photo.ts`: a Firestore document, a field and a Storage folder. The module's service only names its slot; saving, replacing, the alt text and deleting are shared.
- Data read from Firestore is checked for its shape only (`stored…Schema`): limits and formats are checked once, when the API writes the data. Tightening a rule later then never makes saved data unreadable. For the same reason the response schemas describe the shape of the data, not the rules of its request.
- Photos are stored before Firestore is written, and replaced files are deleted last, so the site never links to missing files. Every change that reads and writes a document runs in a transaction.
- The session is the `__session` cookie: Firebase Hosting passes the function no other cookie. The CSRF token is an HMAC of that cookie, issued by `GET /api/auth/csrf` and sent back in `X-CSRF-Token`, so every tab of a session has the same token and a new session gets a new one. Login needs no token: there is no session yet, and only the admin can sign in.
- Global Express typing lives with its owner: `modules/auth/express.d.ts` declares `Locals.auth`, `shared/http/express.d.ts` declares `Request.file` and `rawBody`.
- Code imports through subpath imports (`#modules/auth/service`, `#shared/http/errors`). There are no barrel files.
- Express 5 forwards rejected promises to the error middleware, so handlers do not wrap code in `try/catch` only to call `next(error)`.
- Environment variables are read through `getEnv()` in `shared/config/env.ts`, validated once on first use. `CSRF_SECRET` is a Secret Manager value read by the CSRF middleware.
- Errors meant for the client are thrown as `HttpError` subclasses; the error middleware sends every error as RFC 9457 Problem Details. Anything else is logged and returned as a generic 500.
- The API is described by its code: each module's `routes.ts` lists its endpoints, and `schema.ts` holds the Zod schemas that validate requests and describe responses. Controllers are typed with the response schemas (`RequestHandler<Params, Response, Body>`), so a handler cannot send another shape.

## Tests

- Backend tests live in `backend/tests`, mirroring `src` (`tests/modules/contacts/photo/service.test.ts` tests `src/modules/contacts/photo/service.ts`), and run with Vitest. Their environment is set in `backend/vitest.config.ts`.
- `backend/tests/support` holds shared helpers: `startTestServer` runs an Express app on a free port, `adminHeaders` returns the session cookie and CSRF header of a signed-in admin, `apiImage` returns a complete image for mocked services, `routeApp` builds the app for a route test: the global middleware, the auth routes and the router under test. Import them with a relative path ending in `.js`.
- Frontend tests live in `front/tests`, mirroring `src` in the same way, and run with Vitest in happy-dom (`front/vitest.config.ts`). They cover the logic: form schemas, the changes a save sends, the save functions, error messages, route loaders and actions, and hooks. Components are not tested yet.
- Frontend tests talk to the API through MSW: `tests/support/server.ts` intercepts every request, and a request without a handler fails the test. Each test sets its handlers with `server.use`; `recordRequests` lists the requests sent, in order. Other helpers in `front/tests/support`: `csrfHandler`, `problem` and `noContent` (`handlers.ts`), `apiImage`, `apiPhoto`, `apiProcessPhoto` and `imageFile` (`images.ts`), `fieldErrors` for schemas, `routeArgs`, `formActionArgs` and `thrownResponse` for loaders and actions.
- Frontend tests import the module under test by its own path (`@/features/edit-about/model/saveProcessPhotos`), not through the slice's `index.ts`. `vi.mock` is kept for what MSW cannot replace: Firebase and the toasts.

## Adding an admin page

1. Add the path to `routes` and the title to `adminNavigation` in `shared/config/routes.ts`.
2. Create `pages/<name>/ui/<Name>Page.tsx` and `pages/<name>/index.ts`.
3. Register the route in `app/router.tsx` with a lazy import of `@/pages/<name>`.
4. Put data loading in a loader and saving in an action in the page's `model` segment. Put reusable actions in `features`, and data models and requests in `entities`.
