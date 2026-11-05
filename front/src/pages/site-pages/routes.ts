import { pageHeroQuery, sitePageIds } from "@/entities/site-page";
import { loadFresh } from "@/shared/api/pageData";

import { SitePagesPage } from "./ui/SitePagesPage";

export const sitePagesRoute = {
  Component: SitePagesPage,
  loader: () => loadFresh(...sitePageIds.map(pageHeroQuery)),
};
