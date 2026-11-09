import { getFunctions } from "firebase-admin/functions";

/** The region of the function that takes the tasks; see firebase.ts. */
const queue = "locations/europe-west1/functions/translate";

/** A task: the translations of one resource, by the key of that resource. */
export interface TranslationTask {
  resource: string;
}

/** Asks for the missing translations of `resource`; the queue keeps within the DeepL limits. */
export function enqueueTranslation(resource: string): Promise<void> {
  return getFunctions().taskQueue<TranslationTask>(queue).enqueue({ resource });
}
