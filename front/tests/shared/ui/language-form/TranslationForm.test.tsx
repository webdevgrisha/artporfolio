import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui/unsaved-changes", () => ({ useReportUnsavedChanges: vi.fn() }));

import type { ResourceTranslations } from "@/shared/api/translations";
import { TranslationForm } from "@/shared/ui/language-form/TranslationForm";

import { csrfHandler } from "../../../support/handlers";
import { server } from "../../../support/server";

const path = "/api/translations/gallery-work-1";
const fields = [
  { key: "title", label: "Название" },
  { key: "city", label: "Город" },
  { key: "description", label: "Описание", multiline: true },
];

const saved: ResourceTranslations = {
  failed: false,
  isTranslating: false,
  sources: { description: "Масло.", title: "Слон" },
  translations: {
    en: {
      description: { status: "auto", text: "Oil." },
      title: { status: "edited", text: "Elephant" },
    },
  },
};

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function setUp(language: "ar" | "en" = "en") {
  const patches: unknown[] = [];

  server.use(
    csrfHandler,
    mswHttp.get(path, () => HttpResponse.json(saved)),
    mswHttp.patch(`${path}/${language}`, async ({ request }) => {
      patches.push(await request.json());
      return HttpResponse.json(saved);
    }),
  );
  const view = render(
    <TranslationForm fields={fields} language={language} resource="gallery-work-1" />,
    { wrapper: Providers },
  );

  return { patches, view };
}

describe("TranslationForm", () => {
  it("shows each text with its status and the Russian text", async () => {
    setUp();

    expect(await screen.findByLabelText("Название")).toHaveProperty("value", "Elephant");
    expect(screen.getByText("Исправлено вручную")).toBeDefined();
  });

  it("keeps the Russian text folded away", async () => {
    setUp();

    await screen.findByLabelText("Название");

    const original = screen.getByText("Слон").closest("details");

    expect(original?.open).toBe(false);
    expect(screen.getAllByText("Показать оригинал")).toHaveLength(2);
  });

  it("leaves out a text with no Russian text", async () => {
    setUp();

    await screen.findByLabelText("Название");

    expect(screen.queryByLabelText("Город")).toBeNull();
  });

  it("sends only what changed", async () => {
    const { patches } = setUp();
    const title = await screen.findByLabelText("Название");

    fireEvent.change(title, { target: { value: "The Elephant" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(patches).toEqual([{ title: "The Elephant" }]));
  });

  it("asks the translator for an emptied text", async () => {
    const { patches } = setUp();
    const title = await screen.findByLabelText("Название");
    const row = title.parentElement as HTMLElement;

    fireEvent.click(within(row).getByRole("button"));

    expect(await screen.findByText("Переведётся при сохранении")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(patches).toEqual([{ title: null }]));
  });

  it("lays out Arabic from right to left", async () => {
    const { view } = setUp("ar");

    await screen.findByLabelText("Название");

    expect(view.container.querySelector('[dir="rtl"]')).not.toBeNull();
  });
});
