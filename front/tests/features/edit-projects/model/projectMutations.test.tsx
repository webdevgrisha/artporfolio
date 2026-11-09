import { QueryClient, QueryClientProvider, type QueryKey } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { type Project, projectQuery, projectsIntroQuery, projectsQuery } from "@/entities/project";
import { translationResources, translationsQuery } from "@/entities/translation";
import { emptyProjectFormValues } from "@/features/edit-projects/model/projectFormSchema";
import { useCreateProject } from "@/features/edit-projects/model/useCreateProject";
import { useSaveProject } from "@/features/edit-projects/model/useSaveProject";
import { useSaveProjectsIntro } from "@/features/edit-projects/model/useSaveProjectsIntro";

import { csrfHandler, problem } from "../../../support/handlers";
import { recordRequests, server } from "../../../support/server";

const id = "11111111-1111-4111-8111-111111111111";
const path = `/api/projects/${id}`;
const values = { ...emptyProjectFormValues, title: "Слон" };
const savedEtag = '"saved"';

function apiProject(title: string): Project {
  return {
    createdAt: "2026-01-15T10:00:00.000Z",
    description: "",
    id,
    link: "",
    photos: [],
    title,
    updatedAt: "2026-01-15T10:00:00.000Z",
  };
}

function setUp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return renderHook(() => useCreateProject(), { wrapper }).result.current;
}

/** The conditional headers of each PUT of the project, in order. */
function recordPreconditions(): { ifMatch: string | null; ifNoneMatch: string | null }[] {
  const headers: { ifMatch: string | null; ifNoneMatch: string | null }[] = [];
  server.events.on("request:start", ({ request }) => {
    if (request.method === "PUT" && new URL(request.url).pathname === path) {
      headers.push({
        ifMatch: request.headers.get("If-Match"),
        ifNoneMatch: request.headers.get("If-None-Match"),
      });
    }
  });
  return headers;
}

beforeEach(() => {
  server.use(csrfHandler);
});

describe("useCreateProject", () => {
  it("creates the project the form named, only if there is none yet", async () => {
    server.use(
      mswHttp.put(path, () =>
        HttpResponse.json(apiProject("Слон"), { headers: { ETag: savedEtag }, status: 201 }),
      ),
    );
    const createProject = setUp();
    const preconditions = recordPreconditions();

    const project = await createProject.mutateAsync({ id, values });

    expect(project.title).toBe("Слон");
    expect(preconditions).toEqual([{ ifMatch: null, ifNoneMatch: "*" }]);
  });

  it("never overwrites the project an earlier try created, which may have changed since", async () => {
    server.use(mswHttp.put(path, () => problem(412)));
    const createProject = setUp();
    const requests = recordRequests();

    await expect(createProject.mutateAsync({ id, values })).rejects.toMatchObject({ status: 412 });
    expect(requests.filter((request) => request.endsWith(path))).toEqual([`PUT ${path}`]);
  });
});

describe("useSaveProject", () => {
  it("keeps the saved project and the intro fresh, and marks the list outdated", async () => {
    server.use(
      mswHttp.put(path, () =>
        HttpResponse.json(apiProject("Слон"), { headers: { ETag: savedEtag } }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const projectKey = projectQuery(id).queryKey;
    const cachedKeys: QueryKey[] = [
      projectKey,
      projectsQuery.queryKey,
      projectsIntroQuery.queryKey,
    ];
    for (const queryKey of cachedKeys) {
      queryClient.setQueryData(queryKey, "cached");
    }
    const saveProject = renderHook(() => useSaveProject(id), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }).result.current;

    await saveProject.mutateAsync({ etag: '"read"', values });

    expect(queryClient.getQueryState(projectKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(projectsIntroQuery.queryKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(projectsQuery.queryKey)?.isInvalidated).toBe(true);
  });
});

/** A client with each of `queryKeys` cached, and a wrapper that provides it. */
function cachedClient(queryKeys: readonly QueryKey[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const queryKey of queryKeys) {
    queryClient.setQueryData(queryKey, "cached");
  }

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, wrapper };
}

describe("translations after a save", () => {
  it("are read again after a save of the project, as its texts may have gone to the translator", async () => {
    server.use(
      mswHttp.put(path, () =>
        HttpResponse.json(apiProject("Слон"), { headers: { ETag: savedEtag } }),
      ),
    );
    const translationsKey = translationsQuery(translationResources.project(id)).queryKey;
    const { queryClient, wrapper } = cachedClient([translationsKey]);
    const saveProject = renderHook(() => useSaveProject(id), { wrapper }).result.current;

    await saveProject.mutateAsync({ etag: '"read"', values });

    expect(queryClient.getQueryState(translationsKey)?.isInvalidated).toBe(true);
  });

  it("are read again after a save of the intro", async () => {
    server.use(
      mswHttp.put("/api/projects/intro", () =>
        HttpResponse.json({ text: "Книги" }, { headers: { ETag: savedEtag } }),
      ),
    );
    const translationsKey = translationsQuery(translationResources.projectsIntro).queryKey;
    const { queryClient, wrapper } = cachedClient([translationsKey]);
    const saveIntro = renderHook(() => useSaveProjectsIntro(), { wrapper }).result.current;

    await saveIntro.mutateAsync({ etag: '"read"', intro: { text: "Книги" } });

    expect(queryClient.getQueryState(translationsKey)?.isInvalidated).toBe(true);
  });
});
