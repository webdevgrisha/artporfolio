import { z } from "zod";

import { firestore } from "#shared/firebase/firestore";

/** Why nothing is translated for now: the limit of the plan, a key DeepL refuses, or on purpose. */
const haltReasons = ["limit", "key", "paused"] as const;

export type HaltReason = (typeof haltReasons)[number];

const stateSchema = z.object({ halted: z.enum(haltReasons).nullable() });

function stateDocument() {
  return firestore().doc("site/translation");
}

/** Why translating stopped for the whole site; null while it works. */
export async function readHalted(): Promise<HaltReason | null> {
  const snapshot = await stateDocument().get();

  return snapshot.exists ? stateSchema.parse(snapshot.data()).halted : null;
}

/** Stops translating, or with null goes on. */
export async function setHalted(halted: HaltReason | null): Promise<void> {
  await stateDocument().set({ halted });
}
