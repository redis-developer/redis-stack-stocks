import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/features/chart/chart-card", () => ({
  ChartCard: () => <div>Chart</div>,
}));
vi.mock("@/lib/ws", () => ({
  connectWebSocket: () => () => {},
}));

import { DashboardPage } from "@/features/dashboard/dashboard-page";

class MockWebSocket {
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  close() {}
}

describe("DashboardPage", () => {
  beforeEach(() => {
    const watchlist = [
      {
        pk: "AAPL",
        symbol: "AAPL",
        name: "Apple Inc.",
        last_sale: "$191.00",
        market_cap: "1",
        country: "United States",
        ipo: "1980",
        volume: "10",
        sector: "Technology",
        industry: "Consumer Electronics",
        news: [],
      },
    ];

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = input instanceof Request ? input.method : (init?.method ?? "GET");

      if (url.includes("/watchlist") && method === "GET") {
        return new Response(JSON.stringify(watchlist));
      }
      if (url.includes("/watchlist") && method === "POST") {
        const symbol = url.split("/").pop() ?? "UNKNOWN";
        if (!watchlist.some((stock) => stock.symbol === symbol)) {
          watchlist.push({
            pk: symbol,
            symbol,
            name: `${symbol} Inc.`,
            last_sale: "$100.00",
            market_cap: "1",
            country: "United States",
            ipo: "1980",
            volume: "10",
            sector: "Technology",
            industry: "Software",
            news: [],
          });
        }
        return new Response(JSON.stringify({ status: "ok" }));
      }
      if (url.includes("/demo/reset") && method === "POST") {
        watchlist.splice(0, watchlist.length);
        return new Response(JSON.stringify({ status: "Reset demo data" }));
      }
      if (url.includes("/bars/")) {
        return new Response(JSON.stringify([[1, 10], [2, 11]]));
      }
      if (url.includes("/trade/")) {
        return new Response(JSON.stringify([1, 11]));
      }
      if (url.includes("/close/")) {
        return new Response(JSON.stringify([1, 10]));
      }
      if (url.includes("/trending")) {
        return new Response(JSON.stringify(["AAPL", 4]));
      }
      if (url.includes("/search/")) {
        return new Response(JSON.stringify([]));
      }
      return new Response(JSON.stringify({ status: "ok" }));
    }) as typeof fetch;

    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  it("renders the dashboard with watchlist data", async () => {
    render(<DashboardPage />);

    expect(screen.getByText("Redis stock watchlist")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    });
  });

  it("loads replay symbols when the demo action is clicked", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Play demo" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/watchlist/AAPL"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/watchlist/MSFT"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/watchlist/NVDA"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/watchlist/TSLA"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(screen.getByText("MSFT Inc.")).toBeInTheDocument();
    });
  });

  it("clears demo data and returns the dashboard to empty state", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear data" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/demo/reset"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(
        screen.getByText(/Your watchlist is empty\. Add a stock manually, press Play demo/i),
      ).toBeInTheDocument();
    });
  });
});
