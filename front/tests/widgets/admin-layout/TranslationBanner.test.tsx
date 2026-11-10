import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { type TranslationState, translationsQuery } from "@/entities/translation";
import { TranslationBanner } from "@/widgets/admin-layout/ui/TranslationBanner";

import { csrfHandler } from "../../support/handlers";
import { recordRequests, server } from "../../support/server";

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function setUp(state: TranslationState) {
  server.use(
    csrfHandler,
    mswHttp.get("/api/translations/status", () => HttpResponse.json(state)),
    mswHttp.post("/api/translations/retry", () => new HttpResponse(null, { status: 202 })),
  );

  return render(<TranslationBanner />, { wrapper: Providers });
}

/** An open form of the gallery intro, which reads its translations. */
function GalleryIntroForm() {
  useQuery(translationsQuery("gallery-intro"));

  return null;
}

describe("TranslationBanner", () => {
  it("says nothing while all is well", async () => {
    const requests = recordRequests();
    const { container } = setUp({ halted: null, usage: { limit: 100, used: 89 } });

    await waitFor(() => expect(requests).toContain("GET /api/translations/status"));

    expect(container.textContent).toBe("");
  });

  it("warns at 90% of the plan", async () => {
    setUp({ halted: null, usage: { limit: 100, used: 90 } });

    expect(await screen.findByText(/Использовано 90% лимита переводов/)).toBeDefined();
  });

  it("tells that the plan ended and goes on when asked", async () => {
    const requests = recordRequests();

    setUp({ halted: "limit", usage: null });

    expect(await screen.findByText(/Обновите тариф DeepL/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Повторить перевод" }));

    await waitFor(() => expect(requests).toContain("POST /api/translations/retry"));
  });

  it("makes an open form read its texts again after a retry", async () => {
    const path = "/api/translations/gallery-intro";
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
    });
    const requests = recordRequests();

    server.use(
      csrfHandler,
      mswHttp.get("/api/translations/status", () =>
        HttpResponse.json({ halted: "limit", usage: null }),
      ),
      mswHttp.post("/api/translations/retry", () => new HttpResponse(null, { status: 202 })),
      mswHttp.get(path, () =>
        HttpResponse.json({ failed: false, isTranslating: false, sources: {}, translations: {} }),
      ),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <TranslationBanner />
        <GalleryIntroForm />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(requests).toContain(`GET ${path}`));

    const reads = requests.filter((request) => request === `GET ${path}`).length;

    fireEvent.click(await screen.findByRole("button", { name: "Повторить перевод" }));

    await waitFor(() =>
      expect(requests.filter((request) => request === `GET ${path}`).length).toBeGreaterThan(reads),
    );
  });
});
