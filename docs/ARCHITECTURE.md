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
- Other files: camelCase, named after the main export (`getCurrentUser.ts`).
- Page components end with `Page` (`GalleryPage`).

### Routing and data

- Paths and admin navigation titles are defined once in `shared/config/routes.ts`.
- `app/router.tsx` maps paths to lazily loaded pages.
- Data is loaded and changed through React Router loaders and actions, not effects:
  - the admin layout route uses `requireSession` (`entities/user`), which redirects guests to `/admin/login?redirectTo=…`;
  - inside the admin area, `useSessionUser()` returns the signed-in user;
  - the login page has its own loader and action in `pages/login/model/loginRoute.ts`;
  - logout is a `<Form method="post">` to the `/admin/logout` action (`features/logout`).
- `PageLoading` is the `HydrateFallback` shown while the first loaders run.

### React conventions

- Built-in hooks and APIs are called through the namespace: `React.useState`, `React.useEffect`, `React.useId`. Named imports from `react` are for types only.
- Props are described by an `interface ComponentNameProps`. `ref` is a regular prop (React 19).
- Static visual values belong in CSS; React passes only runtime data, such as `--active-index`.
- Accessible names and semantics are part of a component's contract: buttons have labels, decorative elements are hidden from assistive technology.

## Backend

```text
backend/src/
├── firebase.ts     Cloud Function entry point
├── server.ts       Express app: middleware and routers
├── config/         env, cookies, cors, csrf
├── routes/         one router per domain
├── middleware/     auth, csrf, validation, error
├── controllers/    request handlers, one file per domain
├── services/       business logic (auth) and Firebase access
├── schemas/        zod request schemas
├── errors/         HttpError and its subclasses
├── http/           cookie helpers
├── types/          global type declarations (Express Locals)
├── database/       reserved for data access
├── models/         reserved for data models
└── utils/          reserved for shared helpers
```

- The request flow is route → middleware → controller → service.
- Each layer has one file per domain (`routes/auth.ts`, `controllers/auth.ts`). There are no barrel files.
- Modules import each other through subpath imports: `#services/auth`.
- Express 5 forwards rejected promises to the error middleware, so handlers do not wrap code in `try/catch` only to call `next(error)`.
- Environment variables are read through `getEnv()` in `config/env.ts`, validated once on first use. `CSRF_SECRET` is a Secret Manager value read by the CSRF config.
- Errors meant for the client are thrown as `HttpError` subclasses. Anything else is logged and returned as a generic 500.

## Tests

- Backend tests live in `backend/tests`, mirroring `src`, and run with Vitest. Their environment is set in `backend/vitest.config.ts`.
- The frontend currently has no automated tests.

## Adding an admin page

1. Add the path to `routes` and the title to `adminNavigation` in `shared/config/routes.ts`.
2. Create `pages/<name>/ui/<Name>Page.tsx` and `pages/<name>/index.ts`.
3. Register the route in `app/router.tsx` with a lazy import of `@/pages/<name>`.
4. Put data loading in a loader in the page's `model` segment. Put reusable actions in `features`, and data models and requests in `entities`.
