import { z } from "zod";

const firebaseEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().trim().min(1),
  VITE_FIREBASE_APP_ID: z.string().trim().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().trim().min(1),
  VITE_FIREBASE_AUTH_EMULATOR_URL: z.url().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().trim().min(1),
});

const env = firebaseEnvSchema.parse(import.meta.env);

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  appId: env.VITE_FIREBASE_APP_ID,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
};

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const firebaseAuthEmulatorUrl = isLocalHost
  ? env.VITE_FIREBASE_AUTH_EMULATOR_URL
  : undefined;
