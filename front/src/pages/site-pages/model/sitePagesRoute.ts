import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { getSitePages } from "@/entities/site-page";
import {
  getSavePageHeroesErrorMessage,
  parsePageHeroesChanges,
  type SavePageHeroesResult,
  savePageHeroes,
} from "@/features/edit-page-heroes";

export async function sitePagesLoader({ request }: LoaderFunctionArgs) {
  return getSitePages({ signal: request.signal });
}

export async function sitePagesAction({
  request,
}: ActionFunctionArgs): Promise<SavePageHeroesResult> {
  const changes = parsePageHeroesChanges(await request.formData());

  if (!changes.success) {
    return { error: getSavePageHeroesErrorMessage(changes.error), pages: {} };
  }

  try {
    return await savePageHeroes(changes.data);
  } catch (error) {
    return { error: getSavePageHeroesErrorMessage(error), pages: {} };
  }
}
