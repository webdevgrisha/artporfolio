import type { UIMatch } from "react-router";

import { routes } from "@/shared/config/routes";
import type { BreadcrumbItem } from "@/shared/ui/breadcrumbs";
import type { AdminPageHandle } from "@/widgets/admin-layout";

import { SectionTitle } from "../ui/SectionTitle";
import { WorkTitle } from "../ui/WorkTitle";

/** The pages above a section: the list it is opened from. */
const sectionsCrumbs: BreadcrumbItem[] = [
  { label: "Галерея", to: routes.gallery },
  { label: "Разделы", to: routes.gallerySections },
];

export const newSectionHandle: AdminPageHandle = {
  breadcrumbs: () => [...sectionsCrumbs, { label: "Новый раздел" }],
};

export const editSectionHandle: AdminPageHandle = {
  breadcrumbs: ({ params }: UIMatch) => [
    ...sectionsCrumbs,
    { label: <SectionTitle id={params.id ?? ""} /> },
  ],
};

/** The pages above a work: the list it is opened from. */
const worksCrumbs: BreadcrumbItem[] = [
  { label: "Галерея", to: routes.gallery },
  { label: "Все работы", to: routes.galleryWorks },
];

export const newWorkHandle: AdminPageHandle = {
  breadcrumbs: () => [...worksCrumbs, { label: "Новая работа" }],
};

export const editWorkHandle: AdminPageHandle = {
  breadcrumbs: ({ params }: UIMatch) => [
    ...worksCrumbs,
    { label: <WorkTitle id={params.id ?? ""} /> },
  ],
};
