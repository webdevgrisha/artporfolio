import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type { Project } from "@/entities/project";
import { emptyProjectFormValues } from "@/features/edit-projects/model/projectFormSchema";
import { useCreateProject } from "@/features/edit-projects/model/projectMutations";

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
        HttpResponse.json(
          { project: apiProject("Слон") },
          { headers: { ETag: savedEtag }, status: 201 },
        ),
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
