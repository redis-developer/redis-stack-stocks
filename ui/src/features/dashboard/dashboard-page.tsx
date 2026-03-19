"use client";

import React from "react";
import { ChartCard } from "@/features/chart/chart-card";
import { NewsCard } from "@/features/news/news-card";
import { TrendingCard } from "@/features/trending/trending-card";
import { WatchlistCard } from "@/features/watchlist/watchlist-card";

import { useDashboard } from "./use-dashboard";

export function DashboardPage() {
  const dashboard = useDashboard();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <header className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-5">
            <img alt="Redis" className="mb-1 h-8" src="/redis-logo-white.svg" />
            <div>
              <p className="font-mono text-xs font-normal uppercase tracking-[0.22em] text-volt">
                Stock watchlist
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-white">
                Real-time market moves without the stale stack.
              </h1>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-dusk-30">
            Search symbols, manage a watchlist, inspect price history, and stream live updates
            from Redis-backed APIs and WebSockets.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <WatchlistCard
            clearPending={dashboard.clearPending}
            currentStock={dashboard.currentStock}
            onAdd={dashboard.addToWatchlist}
            onClearDemo={dashboard.clearDemo}
            onPlayDemo={dashboard.playDemo}
            onRemove={dashboard.removeFromWatchlist}
            onSearchTextChange={dashboard.setSearchText}
            onSelect={dashboard.selectStock}
            demoPending={dashboard.demoPending}
            priceInfo={dashboard.stockInfo}
            searchResults={dashboard.searchResults}
            searchText={dashboard.searchText}
            stocks={dashboard.watchlist}
          />
          <TrendingCard trending={dashboard.trending} />
          <ChartCard
            bars={dashboard.currentBars}
            stock={dashboard.currentStock}
            stockInfo={dashboard.currentStock ? dashboard.stockInfo[dashboard.currentStock.symbol] : undefined}
          />
          <NewsCard stock={dashboard.currentStock} />
        </div>
      </div>
    </main>
  );
}
