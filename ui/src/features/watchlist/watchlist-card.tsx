"use client";

import React from "react";
import { useState } from "react";

import { Panel } from "@/components/panel";
import { SearchDialog } from "@/features/search/search-dialog";
import { formatChange, formatCurrency } from "@/lib/format";
import type { PriceInfo, Stock } from "@/lib/types";

export function WatchlistCard({
  clearPending,
  currentStock,
  demoPending,
  onAdd,
  onClearDemo,
  onPlayDemo,
  onRemove,
  onSearchTextChange,
  onSelect,
  priceInfo,
  searchResults,
  searchText,
  stocks,
}: {
  clearPending: boolean;
  currentStock: Stock | null;
  demoPending: boolean;
  onAdd: (symbol: string) => Promise<void>;
  onClearDemo: () => Promise<void>;
  onPlayDemo: () => Promise<void>;
  onRemove: (symbol: string) => Promise<void>;
  onSearchTextChange: (value: string) => void;
  onSelect: (stock: Stock) => void;
  priceInfo: Record<string, PriceInfo>;
  searchResults: Stock[];
  searchText: string;
  stocks: Stock[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Panel
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="rounded-[5px] border border-hyper-05 bg-hyper-10 px-4 py-2 text-sm font-medium text-white transition hover:bg-hyper-09 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={clearPending}
              onClick={() => {
                void onClearDemo();
              }}
              type="button"
            >
              {clearPending ? "Clearing..." : "Clear data"}
            </button>
            <button
              className="rounded-[5px] border border-dusk-90 px-4 py-2 text-sm font-medium text-white transition hover:bg-dusk-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={demoPending}
              onClick={() => {
                void onPlayDemo();
              }}
              type="button"
            >
              {demoPending ? "Loading demo..." : "Play demo"}
            </button>
            <button
              className="rounded-[5px] border border-hyper-05 bg-hyper-10 px-4 py-2 text-sm font-medium text-white transition hover:bg-hyper-09"
              onClick={() => setDialogOpen(true)}
              type="button"
            >
              Add stock
            </button>
          </div>
        }
        subtitle="Search for symbols, build a watchlist, and track the latest prices."
        title="Stock watchlist"
      >
        {stocks.length === 0 ? (
          <div className="rounded-[5px] px-5 py-10 text-sm text-dusk-30">
            Your watchlist is empty. Add a stock manually, press Play demo to load a live sample feed, or use Clear data to reset the dashboard state.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-dusk-50">
                <tr>
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Change</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dusk-90">
                {stocks.map((stock) => {
                  const info = priceInfo[stock.symbol];
                  const selected = stock.symbol === currentStock?.symbol;
                  return (
                    <tr
                      className={selected ? "bg-dusk-90/40" : ""}
                      key={stock.symbol}
                    >
                      <td className="py-4 font-semibold text-white">
                        <button onClick={() => onSelect(stock)} type="button">
                          {stock.symbol}
                        </button>
                      </td>
                      <td className="py-4 text-dusk-10">{stock.name}</td>
                      <td className="py-4 text-dusk-10">{info ? formatCurrency(info.lastPrice) : "..."}</td>
                      <td className="py-4">
                        {info ? (
                          <span className={info.change >= 0 ? "text-volt" : "text-hyper-05"}>
                            {formatChange(info.change)}
                          </span>
                        ) : (
                          "..."
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          className="rounded-[5px] border border-dusk-90 px-3 py-1 text-xs font-medium text-dusk-30 transition hover:border-hyper-05 hover:text-hyper-04"
                          onClick={() => {
                            void onRemove(stock.symbol);
                          }}
                          type="button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <SearchDialog
        onAdd={onAdd}
        onClose={() => setDialogOpen(false)}
        onSearchTextChange={onSearchTextChange}
        open={dialogOpen}
        results={searchResults}
        searchText={searchText}
      />
    </>
  );
}
