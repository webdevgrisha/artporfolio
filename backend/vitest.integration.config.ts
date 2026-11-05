import { defineConfig } from "vitest/config";

// Runs against the Firestore and Storage emulators: see the test:emulators script of the root.
export default defineConfig({
  test: {
    env: {
      FIREBASE_CONFIG:
        '{"projectId":"demo-artportfolio","storageBucket":"demo-artportfolio.appspot.com"}',
      GCLOUD_PROJECT: "demo-artportfolio",
    },
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
