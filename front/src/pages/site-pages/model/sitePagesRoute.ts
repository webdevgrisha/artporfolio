import type { LoaderFunctionArgs } from "react-router";

import { getSitePages } from "@/entities/site-page";

export async function sitePagesLoader({ request }: LoaderFunctionArgs) {
  return getSitePages({ signal: request.signal });
}
