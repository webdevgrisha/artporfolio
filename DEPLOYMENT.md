# Production deployment

Production deployments run from the `production` GitHub Environment when a commit is pushed to
`main`.

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

## Local development

Copy the frontend and backend `.env.example` files to `.env.local` and provide local values. Start
the Auth and Functions emulators, then run Vite in another terminal:

```sh
pnpm dev:backend
pnpm dev:front
```

Vite proxies `/api` requests to the `api` function running in the local Functions Emulator.
