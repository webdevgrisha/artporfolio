import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { allowNextNavigation, navigate } = vi.hoisted(() => ({
  allowNextNavigation: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/shared/ui/unsaved-changes", () => ({
  useAllowNextNavigation: () => allowNextNavigation,
  useReportUnsavedChanges: vi.fn(),
}));

import { HttpError } from "@/shared/api/httpError";
import { useCreateForm } from "@/shared/ui/edit-form";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

function setUp(create: (params: { id: string; values: { title: string } }) => Promise<void>) {
  return renderHook(
    () =>
      useCreateForm({
        form: useForm({ defaultValues: { title: "Слон" } }),
        mutation: useMutation({ mutationFn: create }),
        toPath: (id) => `/works/${id}`,
      }),
    { wrapper },
  );
}

async function submit(onSubmit: () => unknown) {
  await act(async () => {
    await onSubmit();
  });
}

describe("useCreateForm", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("opens what it created in place of the form", async () => {
    const create = vi.fn(async () => undefined);
    const { result } = setUp(create);

    await submit(() => result.current.onSubmit({ preventDefault: vi.fn() } as never));

    const [{ id }] = create.mock.calls[0] as unknown as [{ id: string }];

    await waitFor(() => expect(navigate).toHaveBeenCalledWith(`/works/${id}`, { replace: true }));
    expect(allowNextNavigation).toHaveBeenCalledWith(`/works/${id}`);
  });

  it("opens what an earlier try saved", async () => {
    const { result } = setUp(() => Promise.reject(new HttpError(412)));

    await submit(() => result.current.onSubmit({ preventDefault: vi.fn() } as never));

    await waitFor(() => expect(navigate).toHaveBeenCalledOnce());
  });

  it("stays on the form after any other failure, and tries again under the same id", async () => {
    const create = vi.fn(() => Promise.reject(new HttpError(500)));
    const { result } = setUp(create);

    await submit(() => result.current.onSubmit({ preventDefault: vi.fn() } as never));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    await submit(() => result.current.onSubmit({ preventDefault: vi.fn() } as never));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));

    const [first, second] = create.mock.calls as unknown as [[{ id: string }], [{ id: string }]];

    expect(second[0].id).toBe(first[0].id);
    expect(navigate).not.toHaveBeenCalled();
  });
});
