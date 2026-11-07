import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { DataTable, type TableRow } from "@/shared/ui/data-table";

interface Item {
  id: string;
  title: string;
}

const columns = [
  {
    accessorFn: (row: TableRow<Item>) => row.item.title,
    header: "Название",
    id: "title",
  },
];

function setUp(count: number, address = "/") {
  const items = Array.from({ length: count }, (_, index) => ({
    id: String(index),
    title: `Работа ${String(index + 1)}`,
  }));
  const router = createMemoryRouter(
    [
      {
        element: (
          <DataTable
            addLink={{ label: "Добавить", to: "/new" }}
            caption="Работы"
            columns={columns}
            emptyText="Пусто"
            getId={(item) => item.id}
            items={items}
            matches={(item, query) => item.title.includes(query)}
            searchLabel="Поиск"
            sortableColumns={["title"]}
          />
        ),
        path: "/",
      },
    ],
    { initialEntries: [address] },
  );

  render(<RouterProvider router={router} />);

  return router;
}

function bodyRows(): number {
  return screen.getAllByRole("row").length - 1;
}

describe("DataTable", () => {
  it("shows a short list without pages", () => {
    setUp(50);

    expect(bodyRows()).toBe(50);
    expect(screen.queryByRole("navigation", { name: "Страницы таблицы" })).toBeNull();
  });

  it("shows a long list by pages, and keeps the page in the address", async () => {
    const router = setUp(120);

    expect(bodyRows()).toBe(50);
    fireEvent.click(screen.getByRole("button", { name: "Вперёд" }));

    expect(await screen.findByText("Работа 51")).toBeDefined();
    expect(router.state.location.search).toBe("?page=2");
  });

  it("opens the last page for a number past the end of the list", () => {
    setUp(120, "/?page=9");

    expect(screen.getByText("Страница 3 из 3")).toBeDefined();
    expect(bodyRows()).toBe(20);
  });

  it("keeps what is typed at once and writes it into the address after a pause", async () => {
    const router = setUp(3);
    const search = screen.getByRole("searchbox") as HTMLInputElement;

    fireEvent.change(search, { target: { value: "Работа 2" } });

    expect(search.value).toBe("Работа 2");
    expect(router.state.location.search).toBe("");
    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).get("q")).toBe("Работа 2"),
    );
    expect(search.value).toBe("Работа 2");
    expect(bodyRows()).toBe(1);
  });

  it("starts a new search from the first page", async () => {
    const router = setUp(120, "/?page=2");

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Работа 1" } });

    await waitFor(() => expect(router.state.location.search).toContain("q="));
    expect(router.state.location.search).not.toContain("page=");
  });

  it("takes a search the address changed by itself", async () => {
    const router = setUp(3, "/?q=Работа");

    await router.navigate("/");

    await waitFor(() => expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe(""));
  });
});
