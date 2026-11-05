import React, { type ReactNode } from "react";
import { useLoaderData } from "react-router";

import type { PageData } from "@/shared/api/pageData";

interface AwaitPageDataProps {
  /** The page; it reads its data from the cache with useSuspenseQuery, which never suspends here. */
  children: ReactNode;
  /** The skeleton of the page, in its shape. */
  fallback: ReactNode;
}

/**
 * Shows the skeleton of a page until the data its loader started loading (loadFresh, loadCached) is
 * in the cache, then the page. A failed load goes to the error boundary of the route, unless the
 * page is already showing the cache. Its own boundary shows the skeleton even during a navigation,
 * which keeps the boundaries already shown.
 */
export function AwaitPageData({ children, fallback }: AwaitPageDataProps) {
  const { isCached = false, loading } = useLoaderData<PageData>();

  return (
    <React.Suspense fallback={fallback}>
      <Loaded isCached={isCached} loading={loading}>
        {children}
      </Loaded>
    </React.Suspense>
  );
}

interface LoadedProps {
  children: ReactNode;
  isCached: boolean;
  loading: Promise<void>;
}

function Loaded({ children, isCached, loading }: LoadedProps) {
  if (!isCached) {
    React.use(loading);
  }

  return children;
}
