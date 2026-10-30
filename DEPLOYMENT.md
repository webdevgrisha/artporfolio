# Production deployment

Production deployments run from the `production` GitHub Environment when a commit is pushed to
`main`.

CI also audits the production dependencies in a separate job, so a new advisory fails a check but
does not block a deploy. An advisory that does not apply is ignored by its GHSA id in
`pnpm.auditConfig` of the root `package.json`, with the reason next to the audit job in
`.github/workflows/ci.yml`.

## GitHub Environment variables

Configure the following variables in **Settings → Environments → production → Environment
variables**:

- `ADMIN_UID` — Firebase Authentication UID allowed to access the admin area.
- `CORS_ORIGINS` — comma-separated production origins, for example
  `https://artportfolio-b2ef4.web.app,https://artportfolio-b2ef4.firebaseapp.com`.
- `VITE_FIREBASE_API_KEY` — Firebase Web API key.
- `VITE_FIREBASE_APP_ID` — Firebase Web App ID.
- `VITE_FIREBASE_AUTH_DOMAIN` — Firebase Authentication domain.
- `VITE_FIREBASE_PROJECT_ID` — Firebase project ID.

The deployment workflow validates these values before deploying. It injects the `VITE_*` values
into the Hosting build and creates the project-specific Functions dotenv file used by the Firebase
CLI.

## Firebase secret

`CSRF_SECRET` is a Firebase Functions secret and must contain at least 32 characters. Configure it
once for the production project:

```sh
pnpm exec firebase functions:secrets:set CSRF_SECRET --project artportfolio-b2ef4
```

The deployed `api` function declares this secret in its runtime configuration.

## Firestore

The API stores site content in Firestore. Create the database once in the Firebase console:
**Firestore Database → Create database**, Production mode, location `europe-west1` (the region of
the `api` function; it cannot be changed later).

Browsers never access Firestore directly, so [`firestore.rules`](firestore.rules) denies all client
access. The CI workflow does not deploy these rules; deploy them manually after changing them:

```sh
pnpm deploy:firestore-rules --project artportfolio-b2ef4
```

## Cloud Storage

The API stores the contact photo and the main photos of the pages in the default Cloud Storage
bucket. Enable it once in the Firebase console: **Storage → Get started**, Production mode,
location `europe-west1`. Storage requires the Blaze plan.

Browsers read the photos only through Firebase download URLs, which bypass the rules, so
[`storage.rules`](storage.rules) denies all other client access. Deploy the rules manually after
changing them:

```sh
pnpm deploy:storage-rules --project artportfolio-b2ef4
```

## Local development

Copy the frontend and backend `.env.example` files to `.env.local` and provide local values. Start
the Auth, Firestore, Functions and Storage emulators, then run Vite in another terminal:

```sh
pnpm dev:backend
pnpm dev:front
```

Vite proxies `/api` requests to the `api` function running in the local Functions Emulator. The
Functions Emulator connects the Admin SDK to the Firestore and Storage emulators automatically. The
Firestore Emulator needs Java 21 or later.
