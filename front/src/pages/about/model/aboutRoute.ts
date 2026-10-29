import type { LoaderFunctionArgs } from "react-router";

import { getAbout } from "@/entities/about";

export async function aboutLoader({ request }: LoaderFunctionArgs) {
  return getAbout({ signal: request.signal });
}
