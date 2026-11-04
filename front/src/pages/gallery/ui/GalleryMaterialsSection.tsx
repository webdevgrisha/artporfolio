import { materialsList } from "@/features/edit-gallery";

import { TitleListSection } from "./TitleListSection";

export function GalleryMaterialsSection() {
  return <TitleListSection list={materialsList} />;
}
