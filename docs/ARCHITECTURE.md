# Architecture

How the project is organized and the conventions every change follows. CSS rules live in [STYLE_GUIDE.md](STYLE_GUIDE.md).

## Overview

A pnpm monorepo with two packages, deployed to Firebase:

| Package | Stack | Runs on |
| --- | --- | --- |
| `front` | React 19, React Router (data mode), Vite, CSS Modules, zod | Firebase Hosting |
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
- Slices of the same layer do not import each other. Shared needs move down a layer (`getCsrfToken` is used by login and logout, so it lives in `shared/api`).

`shared` has no slices. `shared/ui` exposes one public `index.ts` per component (`@/shared/ui/button`). `shared/api`, `shared/config` and `shared/lib` are imported file by file (`@/shared/api/http`) on purpose: a common index would make every chunk that needs the HTTP client also load Firebase.

### Naming

- Folders of slices and of `shared/ui` components: kebab-case (`admin-layout`, `password-input`).
- Component files: PascalCase, one component per file, CSS Module beside it (`LoginForm.tsx`, `LoginForm.module.css`).
- Other files: camelCase, named after what they contain (`getCurrentUser.ts`, `toast.ts`, `contactsRoute.ts`).
- Page components end with `Page` (`GalleryPage`).

### Routing and data

- Paths and admin navigation titles are defined once in `shared/config/routes.ts`.
- `app/router.tsx` maps paths to lazily loaded pages.
- Data is loaded and changed through React Router loaders and actions, not effects:
  - the admin layout route uses `requireSession` (`entities/user`), which redirects guests to `/admin/login?redirectTo=…`;
  - inside the admin area, `useSessionUser()` returns the signed-in user;
  - the login page has its own loader and action in `pages/login/model/loginRoute.ts`;
  - logout is a `<Form method="post">` to the `/admin/logout` action (`features/logout`);
  - an edit page saves through `useFetcher` to its route action (`pages/contacts/model/contactsRoute.ts`): saving stays on the page and adds no history entry. The action returns the saved values, so the route turns revalidation off with `shouldRevalidate`. A form with a file submits `multipart/form-data`, the only body that carries a file (`contactsChangesToFormData`), and the action validates it again.
- `PageLoading` is the `HydrateFallback` shown while the first loaders run.
- Admin pages are nested in a pathless route whose `ErrorBoundary` is `AdminPageError` (`widgets/admin-layout`): a page that fails to load or render is replaced inside the layout, and the navigation stays usable.

### Forms and feedback

- Forms use react-hook-form with a zod schema that mirrors the server rules. Text controls such as `Input` are built on `Field` (`shared/ui`), which owns the label, the `hint`, the error and the frame; modified fields are highlighted with `isModified`.
- A form with several sections uses `Tabs` (`shared/ui`) inside one `<form>` with one save button. Hidden panels stay mounted, so their fields keep their values. The form sets `shouldFocusError: false` and, on an invalid submit, opens the tab of the first invalid field before focusing it.
- Files are picked with `MediaPicker` (`shared/ui`). It checks the type and size and shows thumbnails that open in `PreviewDialog`, but it uploads nothing: the form keeps the picked `File` and sends it on save, so revert and the unsaved-changes guard cover it too. The upload rules (`imageUploadRules`) and the image the API returns (`imageSchema`) live in `shared/api/image`; `imageToMediaItem` shows a stored image in the picker.
- A save that calls several endpoints sends only the changed parts and saves them independently (`saveContacts`). The page replaces only the parts that were saved, and the form resets only their fields, so a part that failed keeps its changes. Several photos are uploaded one at a time (`savePageHeroes`), because the server encodes each one.
- An edit form ends with `FormActions` (`shared/ui`): the save button, and the revert button while there are unsaved changes. It also renders `UnsavedChangesDialog` (`shared/ui`), which stops leaving with unsaved changes through `useUnsavedChangesGuard` (`shared/lib`) and asks with `ConfirmDialog`. React Router allows one blocker at a time, so a page has one guarded form.
- The result of an action is shown with `showSuccessToast` or `showErrorToast` (`shared/ui/toast`). Errors stay until closed. Toasts of one action share an `id`, so a new result replaces the previous one.
- Request error texts come from `getRequestErrorMessage` (`shared/api`), which covers no connection and server errors; a feature handles its own cases first, as `getSaveContactsErrorMessage` and `getSavePhotoErrorMessage` do. A save rejected for an expired session (`isSessionExpiredError`) shows `sessionExpiredMessage`.
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
│   ├── auth/           routes, controller, service, schema, middleware (requireAuth)
│   ├── contacts/       contact links; document.ts is the Firestore document shared with photo/
│   │   └── photo/      the contact photo, mounted by the contacts router
│   ├── health/
│   └── pages/          the pages of the public site and their main photos (heroes)
└── shared/             no knowledge of the domain
    ├── config/         env, cookies, cors, csrf
    ├── firebase/       Firebase Admin clients: app, auth, firestore, storage
    ├── http/           HttpError, cookie helpers, Express request typing
    ├── images/         image processing with sharp, image files in Cloud Storage
    └── middleware/     csrf, validation, upload, error
```

- A module has one file per role: `routes.ts`, `controller.ts`, `service.ts`, `schema.ts`. The request flow is route → middleware → controller → service.
- `shared/` never imports `modules/`; Biome enforces it. A module may use another module, as `contacts` uses `requireAuth` from `auth`.
- `server.ts` mounts only top-level modules. A submodule is mounted by its parent's router, as `contacts` mounts `photo`.
- Global Express typing lives with its owner: `modules/auth/express.d.ts` declares `Locals.auth`, `shared/http/express.d.ts` declares `Request.file` and `rawBody`.
- Code imports through subpath imports (`#modules/auth/service`, `#shared/http/errors`). There are no barrel files.
- Express 5 forwards rejected promises to the error middleware, so handlers do not wrap code in `try/catch` only to call `next(error)`.
- Environment variables are read through `getEnv()` in `shared/config/env.ts`, validated once on first use. `CSRF_SECRET` is a Secret Manager value read by the CSRF config.
- Errors meant for the client are thrown as `HttpError` subclasses. Anything else is logged and returned as a generic 500.
- Endpoints are documented in [API.md](API.md), updated in the same commit as the endpoint.

## Tests

- Backend tests live in `backend/tests`, mirroring `src` (`tests/modules/contacts/photo/service.test.ts` tests `src/modules/contacts/photo/service.ts`), and run with Vitest. Their environment is set in `backend/vitest.config.ts`.
- `tests/support` holds shared helpers: `startTestServer` runs an Express app on a free port, `adminHeaders` returns the cookies and CSRF header of a signed-in admin. Import them with a relative path ending in `.js`.
- The frontend currently has no automated tests.

## Adding an admin page

1. Add the path to `routes` and the title to `adminNavigation` in `shared/config/routes.ts`.
2. Create `pages/<name>/ui/<Name>Page.tsx` and `pages/<name>/index.ts`.
3. Register the route in `app/router.tsx` with a lazy import of `@/pages/<name>`.
4. Put data loading in a loader and saving in an action in the page's `model` segment. Put reusable actions in `features`, and data models and requests in `entities`.
