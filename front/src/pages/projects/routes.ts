import type { LoaderFunctionArgs } from "react-router";

import {
  projectQuery,
  projectsIntroQuery,
  projectsOrderQuery,
  projectsQuery,
} from "@/entities/project";
import { loadCached, loadFresh } from "@/shared/api/pageData";
import { revalidateUnlessOnlySearch } from "@/shared/lib/revalidateUnlessOnlySearch";

import { editProjectHandle, newProjectHandle } from "./model/projectsHandles";
import { EditProjectPage } from "./ui/EditProjectPage";
import { NewProjectPage } from "./ui/NewProjectPage";
import { ProjectsIntroSection } from "./ui/ProjectsIntroSection";
import { ProjectsOrderSection } from "./ui/ProjectsOrderSection";
import { ProjectsPage } from "./ui/ProjectsPage";
import { ProjectsTableSection } from "./ui/ProjectsTableSection";

/** The page with the tabs of the projects; each tab is a route of its own. */
export const projectsRoute = { Component: ProjectsPage };

export const projectsIntroRoute = {
  Component: ProjectsIntroSection,
  loader: () => loadFresh(projectsIntroQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const projectsTableRoute = {
  Component: ProjectsTableSection,
  loader: () => loadCached(projectsQuery),
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const projectsOrderRoute = {
  Component: ProjectsOrderSection,
  loader: () => loadFresh(projectsQuery, projectsOrderQuery),
};

export const newProjectRoute = { Component: NewProjectPage, handle: newProjectHandle };

export const editProjectRoute = {
  Component: EditProjectPage,
  handle: editProjectHandle,
  loader: ({ params }: LoaderFunctionArgs) => loadFresh(projectQuery(params.id ?? "")),
  shouldRevalidate: revalidateUnlessOnlySearch,
};
