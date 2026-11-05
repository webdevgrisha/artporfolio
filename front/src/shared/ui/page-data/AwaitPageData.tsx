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
 * Shows the page once the data its loader started loading (loadFresh, loadCached) is in the cache,
 * and its skeleton until then, which only a slow load gets to. A failed load goes to the error boundary of the route, unless the
 * page is already showing the cache. Its own boundary shows the skeleton even during a navigation,
 * which keeps the boundaries already shown.
 */
export function AwaitPageData({ children, fallback }: AwaitPageDataProps) {
  const { isReady, loading } = useLoaderData<PageData>();

  return (
    <React.Suspense fallback={fallback}>
      <Loaded isReady={isReady} loading={loading}>
        {children}
      </Loaded>
    </React.Suspense>
  );
}

interface LoadedProps {
  children: ReactNode;
  isReady: boolean;
  loading: Promise<void>;
}

function Loaded({ children, isReady, loading }: LoadedProps) {
  if (!isReady) {
    React.use(loading);
  }

  return children;
}
