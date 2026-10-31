import type { UIMatch } from "react-router";

import { routes } from "@/shared/config/routes";
import type { BreadcrumbItem } from "@/shared/ui/breadcrumbs";
import { ButtonLink } from "@/shared/ui/button";
import type { AdminPageHandle } from "@/widgets/admin-layout";

import { ProjectTitle } from "../ui/ProjectTitle";

/** The pages above a project: the list it is opened from. */
const projectsCrumbs: BreadcrumbItem[] = [
  { label: "Проекты", to: routes.projects },
  { label: "Все проекты", to: routes.projectsAll },
];

/** The sections of the page: adding is an action, not a section, so it sits by the title. */
export const projectsHandle: AdminPageHandle = {
  titleAction: <ButtonLink to={routes.projectNew}>Добавить проект</ButtonLink>,
};

export const newProjectHandle: AdminPageHandle = {
  breadcrumbs: () => [...projectsCrumbs, { label: "Новый проект" }],
};

export const editProjectHandle: AdminPageHandle = {
  breadcrumbs: ({ params }: UIMatch) => [
    ...projectsCrumbs,
    { label: <ProjectTitle id={params.id ?? ""} /> },
  ],
};
