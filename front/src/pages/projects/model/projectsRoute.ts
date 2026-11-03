import type { LoaderFunctionArgs } from "react-router";

import {
  projectQuery,
  projectsIntroQuery,
  projectsOrderQuery,
  projectsQuery,
} from "@/entities/project";
import { fetchFresh, loadPageData } from "@/shared/api/pageData";

// Each section loads its own resources afresh on entering it, and shows its skeleton meanwhile.

export function projectsIntroLoader() {
  return loadPageData(fetchFresh(projectsIntroQuery));
}

export function projectsTableLoader() {
  return loadPageData(fetchFresh(projectsQuery));
}

export function projectsOrderLoader() {
  return loadPageData(fetchFresh(projectsQuery), fetchFresh(projectsOrderQuery));
}

export function projectLoader({ params }: LoaderFunctionArgs) {
  return loadPageData(fetchFresh(projectQuery(params.id ?? "")));
}
