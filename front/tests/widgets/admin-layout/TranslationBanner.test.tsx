import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { TranslationState } from "@/shared/api/translations";
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
});
