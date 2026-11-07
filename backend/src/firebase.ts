import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";

import { runTranslation } from "#modules/translations/worker";
import { server } from "#server";
import type { TranslationTask } from "#shared/i18n/translation-queue";

const csrfSecret = defineSecret("CSRF_SECRET");
const deeplApiKey = defineSecret("DEEPL_API_KEY");

export const api = onRequest(
  {
    // Caps the cost of a traffic spike; the admin API never needs more.
    maxInstances: 10,
    // Encoding uploaded photos to AVIF needs more than the default 256 MiB and 60 seconds.
    memory: "1GiB",
    // Instead of the default 80 requests per instance. Encoding a 50-megapixel photo takes about
    // 300 MiB and one CPU for over 15 seconds (measured locally, docs/TODO.md B07): two uploads at
    // once fit in the memory, four would reach it. The memory holds because the admin sends at
    // most two at once; lower this if that limit is ever raised.
    concurrency: 4,
    timeoutSeconds: 120,
    region: "europe-west1",
    secrets: [csrfSecret, deeplApiKey],
  },
  server,
);

/** How many times the queue tries a task before the texts show as failed. */
const maxTranslationAttempts = 5;

/**
 * Translates in the background, so a save never waits for DeepL. One task at a time keeps within
 * its rate limit, whatever the number of saves; a failed task comes back later.
 */
export const translate = onTaskDispatched<TranslationTask>(
  {
    rateLimits: { maxConcurrentDispatches: 1 },
    region: "europe-west1",
    retryConfig: { maxAttempts: maxTranslationAttempts, minBackoffSeconds: 60 },
    secrets: [deeplApiKey],
    timeoutSeconds: 300,
  },
  ({ data, retryCount }) => runTranslation(data.resource, retryCount >= maxTranslationAttempts - 1),
);
