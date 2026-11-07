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

`DEEPL_API_KEY` is the key of the DeepL API, which translates the texts of the site when they are
saved, in the background through a Cloud Tasks queue. Configure it the same way:

```sh
pnpm exec firebase functions:secrets:set DEEPL_API_KEY --project artportfolio-b2ef4
```

The deployed `api` function declares both secrets in its runtime configuration. For the emulators,
add `DEEPL_API_KEY` to `backend/.secret.local`; without it a save goes through untranslated.

## Translation queue

The `api` function puts texts in a Cloud Tasks queue, and the `translate` function takes them from it.
Once per project, enable the API and let the runtime service account of `api` add tasks. `PROJECT_NUMBER`
is the number of the project in the Google Cloud console:

```sh
gcloud services enable cloudtasks.googleapis.com --project artportfolio-b2ef4
gcloud projects add-iam-policy-binding artportfolio-b2ef4 \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/cloudtasks.enqueuer
gcloud projects add-iam-policy-binding artportfolio-b2ef4 \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

Without them a save still goes through, and its texts show as failed: «Не удалось перевести».

Adding a task does not prove that it can run. A task calls `translate` as the same service account,
and a 2nd gen function is a Cloud Run service, so after the first deploy check that the account may
invoke it:

```sh
gcloud run services add-iam-policy-binding translate --project artportfolio-b2ef4 \
  --region=europe-west1 \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/run.invoker
```

Tasks refused with 403 stay in the queue and retry, then the texts wait as «Переводится…»: look for
them in the logs of `translate` and under Cloud Tasks in the Google Cloud console.

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

The API stores the photos of the site in the default Cloud Storage bucket. Enable it once in the Firebase console: **Storage → Get started**, Production mode,
location `europe-west1`. Storage requires the Blaze plan.

Browsers read the photos only through Firebase download URLs, which bypass the rules, so
[`storage.rules`](storage.rules) denies all other client access. Deploy the rules manually after
changing them:

```sh
pnpm deploy:storage-rules --project artportfolio-b2ef4
```

A photo is first uploaded to `uploads/`, and a later request copies it into the content. The
server does not delete an upload once it is used, so a request repeated after a lost response can
still refer to it; every upload is deleted by the bucket's lifecycle rule in
[`storage.lifecycle.json`](storage.lifecycle.json): every file under `uploads/` older than a day.
Without the rule, uploads would pile up.
The Firebase CLI does not deploy it; apply it once, and again after changing it, with the bucket
name shown in **Storage** of the Firebase console:

```sh
STORAGE_BUCKET=BUCKET_NAME pnpm deploy:storage-lifecycle
```

## Everything the CI workflow does not deploy

The Firestore rules, the Storage rules and the lifecycle rule of the bucket are applied by one
command; run it after setting up the project and after changing any of them:

```sh
STORAGE_BUCKET=BUCKET_NAME pnpm deploy:infra
```

The Storage Emulator ignores lifecycle rules, so local uploads stay until the emulator data is
cleared.

## Local development

Copy the frontend and backend `.env.example` files to `.env.local` and provide local values. Start
the Auth, Firestore, Functions and Storage emulators, then run Vite in another terminal:

```sh
pnpm dev:backend
pnpm dev:front
```

`dev:backend` builds the backend once: the Functions Emulator runs the compiled `backend/dist`. To
work on the backend, also run its build in watch mode in a third terminal; the emulator reloads the
function whenever `dist` changes:

```sh
pnpm dev:backend:watch
```

Vite proxies `/api` requests to the `api` function running in the local Functions Emulator. The
Functions Emulator connects the Admin SDK to the Firestore and Storage emulators automatically. The
Firestore Emulator needs Java 21 or later.

The emulators start empty. Once they are ready, create the admin and fill the admin panel with demo
content (page heroes, About, contacts, projects with photos), through the API as the admin would:

```sh
pnpm emulators:seed            # admin@example.com / admin123
pnpm emulators:admin [email] [password]   # only the admin
```

Every run of `emulators:seed` first empties the Firestore emulator, then fills it again. Its images are drawn by the script
(`scripts/seed-emulators.mjs`), so the content is the same on every machine and needs no network.
