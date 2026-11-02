import type { LoaderFunctionArgs } from "react-router";

import {
  projectQuery,
  projectsIntroQuery,
  projectsOrderQuery,
  projectsQuery,
} from "@/entities/project";
import { queryClient } from "@/shared/api/queryClient";

// Each section loads its own resources afresh on entering it, even when they are cached: a form,
// or the table, takes its saved values and their ETag from them once, so they must not be outdated.

export async function projectsIntroLoader() {
  await queryClient.fetchQuery({ ...projectsIntroQuery, staleTime: 0 });

  return null;
}

export async function projectsTableLoader() {
  await queryClient.fetchQuery({ ...projectsQuery, staleTime: 0 });

  return null;
}

export async function projectsOrderLoader() {
  await Promise.all([
    queryClient.fetchQuery({ ...projectsQuery, staleTime: 0 }),
    queryClient.fetchQuery({ ...projectsOrderQuery, staleTime: 0 }),
  ]);

  return null;
}

export async function projectLoader({ params }: LoaderFunctionArgs) {
  await queryClient.fetchQuery({ ...projectQuery(params.id ?? ""), staleTime: 0 });

  return null;
}
