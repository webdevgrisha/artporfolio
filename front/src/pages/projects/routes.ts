import { revalidateUnlessOnlySearch } from "@/shared/lib/revalidateUnlessOnlySearch";

import { editProjectHandle, newProjectHandle } from "./model/projectsHandles";
import {
  projectLoader,
  projectsIntroLoader,
  projectsOrderLoader,
  projectsTableLoader,
} from "./model/projectsRoute";
import { EditProjectPage } from "./ui/EditProjectPage";
import { NewProjectPage } from "./ui/NewProjectPage";
import { ProjectsIntroSection } from "./ui/ProjectsIntroSection";
import { ProjectsOrderSection } from "./ui/ProjectsOrderSection";
import { ProjectsPage } from "./ui/ProjectsPage";
import { ProjectsTableSection } from "./ui/ProjectsTableSection";

/** The page with the tabs of the projects; each tab is a route of its own. */
export const projectsRoute = { Component: ProjectsPage };

export const projectsIntroRoute = { Component: ProjectsIntroSection, loader: projectsIntroLoader };

export const projectsTableRoute = {
  Component: ProjectsTableSection,
  loader: projectsTableLoader,
  shouldRevalidate: revalidateUnlessOnlySearch,
};

export const projectsOrderRoute = { Component: ProjectsOrderSection, loader: projectsOrderLoader };

export const newProjectRoute = { Component: NewProjectPage, handle: newProjectHandle };

export const editProjectRoute = {
  Component: EditProjectPage,
  handle: editProjectHandle,
  loader: projectLoader,
};
