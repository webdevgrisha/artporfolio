import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui/unsaved-changes", () => ({ useReportUnsavedChanges: vi.fn() }));

import { sessionExpiredMessage } from "@/shared/api/requestErrorMessages";
import type { ResourceTranslations } from "@/shared/api/translations";
import { TranslationForm } from "@/shared/ui/language-form/TranslationForm";

import { csrfHandler } from "../../../support/handlers";
import { recordRequests, server } from "../../../support/server";

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

    await waitFor(() =>
      expect(patches).toEqual([{ title: { source: "Слон", text: "The Elephant" } }]),
    );
  });

  it("sends the Russian text a change was begun from, though it changed meanwhile", async () => {
    const queryKey = ["translations", "gallery-work-1"];
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    const patches: unknown[] = [];

    client.setQueryData(queryKey, saved);
    server.use(
      csrfHandler,
      mswHttp.patch(`${path}/en`, async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json(saved);
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <TranslationForm fields={fields} language="en" resource="gallery-work-1" />
      </QueryClientProvider>,
    );

    fireEvent.change(await screen.findByLabelText("Название"), { target: { value: "Elephant!" } });
    act(() => {
      client.setQueryData(queryKey, { ...saved, sources: { ...saved.sources, title: "Тигр" } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(patches).toEqual([{ title: { source: "Слон", text: "Elephant!" } }]),
    );
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

  it("asks before a new translation replaces what was typed over an automatic text", async () => {
    const { patches } = setUp();
    const description = await screen.findByLabelText("Описание");

    fireEvent.change(description, { target: { value: "My draft" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Перевести заново" })[1] as HTMLElement);

    expect(await screen.findByText("Заменить ручную правку?")).toBeDefined();
    expect(patches).toEqual([]);
    expect(description).toHaveProperty("value", "My draft");
  });

  it("takes no other action on a form while a new translation is being asked for", async () => {
    let release = () => {};
    const answer = new Promise<void>((resolve) => {
      release = resolve;
    });
    const patches: unknown[] = [];

    server.use(
      csrfHandler,
      mswHttp.get(path, () => HttpResponse.json(saved)),
      mswHttp.patch(`${path}/en`, async ({ request }) => {
        patches.push(await request.json());
        await answer;
        return HttpResponse.json(saved);
      }),
    );
    render(<TranslationForm fields={fields} language="en" resource="gallery-work-1" />, {
      wrapper: Providers,
    });
    await screen.findByLabelText("Описание");

    const button = screen.getAllByRole("button", { name: "Перевести заново" })[1] as HTMLElement;

    fireEvent.click(button);
    await waitFor(() => expect(patches).toHaveLength(1));
    fireEvent.click(button);
    release();

    await waitFor(() => expect(button).toHaveProperty("disabled", false));
    expect(patches).toHaveLength(1);
  });

  it("keeps what was saved when a read begun earlier ends later", async () => {
    let finishRead = () => {};
    const readEnds = new Promise<void>((resolve) => {
      finishRead = resolve;
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    const queryKey = ["translations", "gallery-work-1"];
    const changed: ResourceTranslations = {
      ...saved,
      translations: {
        en: {
          description: { status: "auto", text: "Oil." },
          title: { status: "edited", text: "The Elephant" },
        },
      },
    };

    client.setQueryData(queryKey, saved);
    server.use(
      csrfHandler,
      mswHttp.get(path, async () => {
        await readEnds;
        return HttpResponse.json(saved);
      }),
      mswHttp.patch(`${path}/en`, () => HttpResponse.json(changed)),
    );
    render(
      <QueryClientProvider client={client}>
        <TranslationForm fields={fields} language="en" resource="gallery-work-1" />
      </QueryClientProvider>,
    );

    const title = await screen.findByLabelText("Название");

    void client.invalidateQueries({ queryKey });
    fireEvent.change(title, { target: { value: "The Elephant" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(client.getQueryData(queryKey)).toEqual(changed));
    finishRead();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(client.getQueryData(queryKey)).toEqual(changed);
    expect(title).toHaveProperty("value", "The Elephant");
  });

  it("leaves a text deleted in Russian out of a save", async () => {
    const queryKey = ["translations", "gallery-work-1"];
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    const patches: unknown[] = [];
    const page = (shown: typeof fields) => (
      <QueryClientProvider client={client}>
        <TranslationForm fields={shown} language="en" resource="gallery-work-1" />
      </QueryClientProvider>
    );

    client.setQueryData(queryKey, saved);
    server.use(
      csrfHandler,
      mswHttp.patch(`${path}/en`, async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json(saved);
      }),
    );

    const { rerender } = render(page(fields));

    fireEvent.change(await screen.findByLabelText("Описание"), { target: { value: "Gone" } });
    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "The Elephant" } });

    const { description: _deleted, ...sources } = saved.sources;

    client.setQueryData(queryKey, { ...saved, sources });
    rerender(page(fields.filter(({ key }) => key !== "description")));

    await waitFor(() => expect(screen.queryByLabelText("Описание")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(patches).toEqual([{ title: { source: "Слон", text: "The Elephant" } }]),
    );
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

  it("tells that the session ended, keeps what was typed and stops asking", async () => {
    const queryKey = ["translations", "gallery-work-1"];
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    const requests = recordRequests();

    client.setQueryData(queryKey, { ...saved, isTranslating: true });
    server.use(mswHttp.get(path, () => new HttpResponse(null, { status: 401 })));
    render(
      <QueryClientProvider client={client}>
        <TranslationForm fields={fields} language="en" resource="gallery-work-1" />
      </QueryClientProvider>,
    );

    const title = await screen.findByLabelText("Название");

    fireEvent.change(title, { target: { value: "My draft" } });
    void client.invalidateQueries({ queryKey });

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", sessionExpiredMessage);
    expect(title).toHaveProperty("value", "My draft");

    const reads = requests.length;

    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(5_000);
    vi.useRealTimers();

    expect(requests).toHaveLength(reads);
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
