import { QueryClient, QueryClientProvider, queryOptions } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { FormEvent, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import type { Tagged } from "@/shared/api/http";
import { HttpError } from "@/shared/api/httpError";
import { useSavedForm } from "@/shared/ui/edit-form";

interface Values {
  name: string;
}

const initial: Tagged<Values> = { data: { name: "Холст" }, etag: '"read"' };
const latest: Tagged<Values> = { data: { name: "Бумага" }, etag: '"latest"' };

const valuesQuery = queryOptions({
  queryFn: () => Promise.resolve(latest),
  queryKey: ["values"],
});

type Save = (values: Values, etag: string) => Promise<Tagged<Values>> | null;

function setUp(save: Save) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const { result } = renderHook(
    () => {
      const form = useForm<Values>({ defaultValues: initial.data });
      const savedForm = useSavedForm({
        form,
        initial,
        query: valuesQuery,
        save,
        toValues: (data) => data,
        toastId: "values-save",
      });

      return { form, ...savedForm };
    },
    { wrapper },
  );

  return result;
}

const submitEvent = { persist() {}, preventDefault() {} } as unknown as FormEvent<HTMLFormElement>;

async function edit(result: ReturnType<typeof setUp>, name: string) {
  await act(async () => result.current.form.setValue("name", name, { shouldDirty: true }));
}

async function submit(result: ReturnType<typeof setUp>) {
  await act(async () => result.current.editForm.onSubmit(submitEvent));
}

describe("useSavedForm", () => {
  it("sends the changes with the ETag of the base, then starts from the saved resource", async () => {
    const save = vi.fn<Save>((values) => Promise.resolve({ data: values, etag: '"saved"' }));
    const result = setUp(save);

    await edit(result, "Масло");
    await submit(result);
    await edit(result, "Акварель");
    await submit(result);

    expect(save.mock.calls).toEqual([
      [{ name: "Масло" }, '"read"'],
      [{ name: "Акварель" }, '"saved"'],
    ]);
    expect(result.current.saved).toEqual({ data: { name: "Акварель" }, etag: '"saved"' });
    expect(result.current.editForm.hasUnsavedChanges).toBe(false);
  });

  it("sends nothing without changes", async () => {
    const save = vi.fn<Save>();
    const result = setUp(save);

    await submit(result);

    expect(save).not.toHaveBeenCalled();
  });

  it("keeps the changes and the base after a failed save", async () => {
    const result = setUp(() => Promise.reject(new HttpError(500)));

    await edit(result, "Масло");
    await submit(result);

    expect(result.current.form.getValues()).toEqual({ name: "Масло" });
    expect(result.current.saved).toBe(initial);
    expect(result.current.editForm.conflict.isOpen).toBe(false);
  });

  it("offers the latest version after a conflict and starts from it once taken", async () => {
    const result = setUp(() => Promise.reject(new HttpError(412)));

    await edit(result, "Масло");
    await submit(result);

    expect(result.current.editForm.conflict.isOpen).toBe(true);

    await act(async () => result.current.editForm.conflict.onTakeLatest());

    expect(result.current.editForm.conflict.isOpen).toBe(false);
    expect(result.current.saved).toEqual(latest);
    expect(result.current.form.getValues()).toEqual(latest.data);
    expect(result.current.editForm.hasUnsavedChanges).toBe(false);
  });

  it("keeps the changes and the base when the latest version is declined", async () => {
    const result = setUp(() => Promise.reject(new HttpError(412)));

    await edit(result, "Масло");
    await submit(result);
    await act(async () => result.current.editForm.conflict.onKeep());

    expect(result.current.editForm.conflict.isOpen).toBe(false);
    expect(result.current.saved).toBe(initial);
    expect(result.current.form.getValues()).toEqual({ name: "Масло" });
  });
});
