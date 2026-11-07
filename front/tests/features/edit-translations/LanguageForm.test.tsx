import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui/unsaved-changes", () => ({ useReportUnsavedChanges: vi.fn() }));

import type { ResourceTranslations } from "@/entities/translation";
import { LanguageForm } from "@/features/edit-translations";

import { recordRequests, server } from "../../support/server";

const path = "/api/translations/gallery-intro";
const fields = [{ key: "text", label: "Основной текст" }];

const translations: ResourceTranslations = {
  failed: false,
  isTranslating: false,
  sources: { text: "Живопись" },
  translations: { en: { text: { status: "auto", text: "Painting" } } },
};

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Page({ address, savedTag }: { address: string; savedTag: string }): ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[address]}>
        <LanguageForm fields={fields} resource="gallery-intro" savedTag={savedTag}>
          <p>Форма на русском</p>
        </LanguageForm>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LanguageForm", () => {
  it("shows the Russian form by default", () => {
    server.use(mswHttp.get(path, () => HttpResponse.json(translations)));
    render(<Page address="/" savedTag='"1"' />);

    expect(screen.getByText("Форма на русском").parentElement?.hidden).toBe(false);
  });

  it("keeps the Russian form mounted behind the language of the address", async () => {
    server.use(mswHttp.get(path, () => HttpResponse.json(translations)));
    render(<Page address="/?lang=en" savedTag='"1"' />);

    expect(await screen.findByLabelText("Основной текст")).toBeDefined();
    expect(screen.getByText("Форма на русском").parentElement?.hidden).toBe(true);
  });

  it("reads the translations again after a save of the resource", async () => {
    server.use(mswHttp.get(path, () => HttpResponse.json(translations)));

    const requests = recordRequests();
    const { rerender } = render(<Page address="/" savedTag='"1"' />);

    await waitFor(() => expect(requests).toContain(`GET ${path}`));

    const before = requests.length;

    rerender(<Page address="/" savedTag='"2"' />);

    await waitFor(() => expect(requests.length).toBeGreaterThan(before));
  });

  it("reads nothing again when only the page around it renders anew", async () => {
    server.use(mswHttp.get(path, () => HttpResponse.json(translations)));

    const requests = recordRequests();
    const { rerender } = render(<Page address="/" savedTag='"1"' />);

    await waitFor(() => expect(requests).toContain(`GET ${path}`));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));

    const before = requests.length;

    rerender(<Page address="/" savedTag='"1"' />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(requests).toHaveLength(before);
  });
});
