import { Outlet, useMatch } from "react-router";

import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./GalleryPage.module.css";

const sections = [
  { label: "Основной текст", to: routes.galleryIntro },
  { label: "Разделы", to: routes.gallerySections },
  { label: "Материалы", to: routes.galleryMaterials },
  { label: "Цвета", to: routes.galleryColors },
] as const;

/** The text above the works, the sections, the materials and the colors are saved independently. */
export function GalleryPage() {
  const isSectionsTab = useMatch(routes.gallerySections) !== null;

  return (
    <div className={styles.root}>
      {/* Adding is an action of the sections tab: it sits at the end of the tabs, as for projects. */}
      <div className={styles.sectionsBar}>
        <TabNav label="Разделы страницы «Галерея»" items={sections} />
        {isSectionsTab ? (
          <ButtonLink className={styles.addLink} to={routes.gallerySectionNew}>
            Добавить раздел
          </ButtonLink>
        ) : null}
      </div>
      <Outlet />
    </div>
  );
}
