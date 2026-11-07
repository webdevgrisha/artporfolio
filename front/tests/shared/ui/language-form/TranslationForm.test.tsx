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

  it("shows the Russian text on request and hides it again", async () => {
    setUp();

    await screen.findByLabelText("Название");

    const [toggle] = screen.getAllByRole("button", { name: "Показать оригинал" });
    const original = screen.getByText("Слон").parentElement as HTMLElement;

    expect(original.hidden).toBe(true);

    fireEvent.click(toggle as HTMLElement);

    expect(original.hidden).toBe(false);
    expect(toggle?.textContent).toBe("Скрыть оригинал");

    fireEvent.click(toggle as HTMLElement);

    expect(original.hidden).toBe(true);
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

  it("empties a field without asking the translator, and refuses to save it empty", async () => {
    const { patches } = setUp();
    const title = await screen.findByLabelText("Название");
    const row = title.parentElement as HTMLElement;

    fireEvent.click(within(row).getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Введите перевод или нажмите «Перевести заново»")).toBeDefined();
    expect(patches).toEqual([]);
  });

  it("translates an automatic text anew at once", async () => {
    const { patches } = setUp();

    await screen.findByLabelText("Описание");

    const buttons = screen.getAllByRole("button", { name: "Перевести заново" });

    fireEvent.click(buttons[1] as HTMLElement);

    await waitFor(() => expect(patches).toEqual([{ description: null }]));
  });

  it("asks before replacing a person's text", async () => {
    const { patches } = setUp();

    await screen.findByLabelText("Название");

    fireEvent.click(screen.getAllByRole("button", { name: "Перевести заново" })[0] as HTMLElement);

    expect(await screen.findByText("Заменить ручную правку?")).toBeDefined();
    expect(patches).toEqual([]);
  });

  it("says when there is nothing to translate yet", async () => {
    server.use(
      mswHttp.get(path, () => HttpResponse.json({ ...saved, sources: {}, translations: {} })),
    );
    render(<TranslationForm fields={fields} language="en" resource="gallery-work-1" />, {
      wrapper: Providers,
    });

    expect(await screen.findByText(/сначала сохраните текст на русском/)).toBeDefined();
  });

  it("says when the translations cannot be read", async () => {
    server.use(mswHttp.get(path, () => new HttpResponse(null, { status: 404 })));
    render(<TranslationForm fields={fields} language="en" resource="gallery-work-1" />, {
      wrapper: Providers,
    });

    expect(await screen.findByRole("alert")).toBeDefined();
  });

  it("names the language of the field for spelling and screen readers", async () => {
    setUp();

    expect((await screen.findByLabelText("Название")).getAttribute("lang")).toBe("en");
  });

  it("lays out Arabic from right to left", async () => {
    const { view } = setUp("ar");

    await screen.findByLabelText("Название");

    expect(view.container.querySelector('[dir="rtl"]')).not.toBeNull();
  });
});
